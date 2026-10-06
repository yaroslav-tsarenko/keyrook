import { z } from "zod";
import { env } from "@/lib/env";
import { EsaError, mapEsaError } from "./errors";
import {
  esaBalanceSchema,
  esaKeysSchema,
  esaOrderCreateSchema,
  esaOrderSchema,
  esaOrderSearchSchema,
  esaProductPageSchema,
  esaProductSchema,
  type EsaKey,
  type EsaOrder,
  type EsaOrderCreate,
  type EsaProduct,
  type EsaProductPage,
} from "./types";

const TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;

type Query = Record<string, string | number | boolean | undefined | null>;
type Channel = "catalog" | "orders";

interface RequestOptions {
  method: "GET" | "POST";
  channel?: Channel;
  query?: Query;
  body?: unknown;
  retry?: boolean;
  timeoutMs?: number;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export function ordersAreLive(): boolean {
  return env.KINGUIN_LIVE_ORDERS;
}

function baseFor(channel: Channel): string {
  return channel === "orders" && !ordersAreLive() ? env.KINGUIN_SANDBOX_API_BASE : env.KINGUIN_API_BASE;
}

async function bearerToken(): Promise<string | null> {
  const id = env.KINGUIN_CLIENT_ID;
  const secret = env.KINGUIN_CLIENT_SECRET;
  const url = env.KINGUIN_OAUTH_TOKEN_URL;
  if (!id || !secret || !url) return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
    cache: "no-store",
  });
  if (!res.ok) throw new EsaError("unauthorized", { httpStatus: res.status, message: `token endpoint answered ${res.status}` });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new EsaError("unauthorized", { message: "token endpoint returned no access_token" });
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return tokenCache.token;
}

async function authHeaders(channel: Channel): Promise<Record<string, string>> {
  if (channel === "orders" && !ordersAreLive()) {
    return { "X-Api-Key": env.KINGUIN_SANDBOX_API_KEY ?? env.KINGUIN_API_KEY };
  }
  try {
    return { "X-Api-Key": env.KINGUIN_API_KEY };
  } catch (err) {
    const token = await bearerToken();
    if (token) return { Authorization: `Bearer ${token}` };
    throw err;
  }
}

function buildUrl(channel: Channel, path: string, query?: Query): string {
  const url = new URL(`${baseFor(channel)}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  return url.toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number) => 400 * 3 ** (attempt - 1) + Math.floor(Math.random() * 200);

async function request(path: string, opts: RequestOptions): Promise<unknown> {
  const channel = opts.channel ?? "catalog";
  const url = buildUrl(channel, path, opts.query);
  const retry = opts.retry ?? opts.method === "GET";
  let lastErr: unknown;
  for (let attempt = 1; attempt <= (retry ? MAX_ATTEMPTS : 1); attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: opts.method,
        headers: {
          Accept: "application/json",
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(await authHeaders(channel)),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        const err = mapEsaError(res.status, text.slice(0, 500));
        if (retry && attempt < MAX_ATTEMPTS && (res.status >= 500 || res.status === 429)) {
          lastErr = err;
          await sleep(backoff(attempt) * (res.status === 429 ? 3 : 1));
          continue;
        }
        throw err;
      }
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new EsaError("bad_response", { httpStatus: res.status, message: `${path}: non-JSON response` });
      }
    } catch (err) {
      if (err instanceof EsaError) throw err;
      lastErr = err;
      const aborted = err instanceof Error && err.name === "AbortError";
      if (retry && attempt < MAX_ATTEMPTS) {
        await sleep(backoff(attempt));
        continue;
      }
      throw new EsaError(aborted ? "timeout" : "network", { message: `${path}: ${aborted ? "timed out" : "network error"}` });
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastErr instanceof EsaError) throw lastErr;
  throw new EsaError("network", { message: `${path}: request failed` });
}

function parse<T>(schema: z.ZodType<T>, json: unknown, path: string): T {
  const result = schema.safeParse(json);
  if (!result.success) throw new EsaError("bad_response", { message: `${path}: unexpected response shape (${result.error.issues[0]?.message ?? "invalid"})` });
  return result.data;
}

export function parseProducts(raw: unknown[]): { products: EsaProduct[]; rejected: number } {
  const products: EsaProduct[] = [];
  let rejected = 0;
  for (const entry of raw) {
    const parsed = esaProductSchema.safeParse(entry);
    if (parsed.success) products.push(parsed.data);
    else rejected++;
  }
  return { products, rejected };
}

export interface ListProductsParams {
  page: number;
  limit?: number;
  kinguinId?: number[];
  updatedSince?: string;
}

export const esaClient = {
  async listProducts(params: ListProductsParams): Promise<EsaProductPage> {
    const json = await request("/v1/products", {
      method: "GET",
      query: {
        page: params.page,
        limit: params.limit ?? 100,
        kinguinId: params.kinguinId?.length ? params.kinguinId.join(",") : undefined,
        updatedSince: params.updatedSince,
        sortBy: "kinguinId",
        sortType: "asc",
      },
    });
    const page = parse(esaProductPageSchema, json, "/v1/products");
    const { products, rejected } = parseProducts(page.results);
    return { results: products, itemCount: page.item_count, rejected };
  },

  async getProduct(productId: string): Promise<EsaProduct | null> {
    try {
      const json = await request(`/v2/products/${encodeURIComponent(productId)}`, { method: "GET" });
      return parse(esaProductSchema, json, "/v2/products/:id");
    } catch (err) {
      if (err instanceof EsaError && err.code === "not_found") return null;
      throw err;
    }
  },

  async createOrder(input: { orderExternalId: string; products: { productId: string; qty: number; price: number; offerId?: string | null }[] }): Promise<EsaOrderCreate> {
    const json = await request("/v2/order", {
      method: "POST",
      channel: "orders",
      retry: false,
      timeoutMs: 45_000,
      body: {
        orderExternalId: input.orderExternalId,
        products: input.products.map((p) => ({ productId: p.productId, qty: p.qty, price: p.price, keyType: "text", ...(p.offerId ? { offerId: p.offerId } : {}) })),
      },
    });
    return parse(esaOrderCreateSchema, json, "/v2/order");
  },

  async findOrderByExternalId(orderExternalId: string): Promise<EsaOrder | null> {
    const json = await request("/v1/order", { method: "GET", channel: "orders", query: { orderExternalId } });
    const found = parse(esaOrderSearchSchema, json, "/v1/order");
    return found.results[0] ?? null;
  },

  async getOrder(orderId: string): Promise<EsaOrder> {
    const json = await request(`/v1/order/${encodeURIComponent(orderId)}`, { method: "GET", channel: "orders" });
    return parse(esaOrderSchema, json, "/v1/order/:id");
  },

  async getKeys(orderId: string): Promise<EsaKey[]> {
    const json = await request(`/v2/order/${encodeURIComponent(orderId)}/keys`, { method: "GET", channel: "orders" });
    return parse(esaKeysSchema, json, "/v2/order/:id/keys");
  },

  async getBalance(): Promise<number> {
    const json = await request("/v1/balance", { method: "GET", channel: "orders" });
    return parse(esaBalanceSchema, json, "/v1/balance").balance;
  },
};
