import { z } from "zod";
import { env } from "@/lib/env";
import { SihError, mapSihError } from "./errors";
import {
  sihProjectSchema,
  sihProjectEnvelopeSchema,
  sihGetItemsSchema,
  sihMinItemSchema,
  sihCreateOrderResponseSchema,
  sihGetOrderSchema,
  sihGetOrdersSchema,
  sihWalletHistorySchema,
  type SihProject,
  type SihGetItems,
  type SihMinItem,
  type SihOrderObject,
  type SihCreateOrderInput,
  type SihWalletHistory,
} from "./types";

const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method: "GET" | "POST";
  query?: Query;
  body?: unknown;
  retry?: boolean;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Query): string {
  const base = env.SIH_API_BASE.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rawRequest(
  path: string,
  { method, query, body, retry, timeoutMs }: RequestOptions,
): Promise<{ status: number; json: unknown }> {
  const url = buildUrl(path, query);
  const shouldRetry = retry ?? method === "GET";

  let lastErr: unknown;
  for (let attempt = 1; attempt <= (shouldRetry ? MAX_ATTEMPTS : 1); attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          apikey: env.SIH_API_KEY,
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status >= 500 && shouldRetry && attempt < MAX_ATTEMPTS) {
        lastErr = new SihError("bad_response", { httpStatus: res.status });
        await sleep(backoff(attempt));
        continue;
      }

      const text = await res.text();
      let json: unknown = undefined;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          throw new SihError("bad_response", {
            httpStatus: res.status,
            message: `SIH ${path}: non-JSON response (status ${res.status})`,
          });
        }
      }
      return { status: res.status, json };
    } catch (err) {
      lastErr = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      const transient = isAbort || err instanceof TypeError;
      if (shouldRetry && transient && attempt < MAX_ATTEMPTS) {
        await sleep(backoff(attempt));
        continue;
      }
      if (err instanceof SihError) throw err;
      if (isAbort) {
        throw new SihError("timeout", { message: `SIH ${path}: request timed out` });
      }
      throw new SihError("network", {
        message: `SIH ${path}: network error`,
      });
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastErr instanceof SihError) throw lastErr;
  throw new SihError("network", { message: `SIH ${path}: request failed` });
}

function backoff(attempt: number): number {
  return 300 * 3 ** (attempt - 1) + Math.floor(Math.random() * 150);
}

function parse<T>(schema: z.ZodType<T>, json: unknown, path: string): T {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new SihError("bad_response", {
      message: `SIH ${path}: unexpected response shape`,
    });
  }
  return result.data;
}

function assertSuccess(payload: { success: boolean; error?: string | null }, httpStatus: number): void {
  if (!payload.success) {
    throw mapSihError(payload.error, httpStatus);
  }
}

function extractProject(json: unknown, path: string): SihProject {
  const env = sihProjectEnvelopeSchema.safeParse(json);
  if (env.success) return env.data.project;
  return parse(sihProjectSchema, json, path);
}

export async function getProject(): Promise<SihProject> {
  const { json } = await rawRequest("/project", { method: "GET" });
  return extractProject(json, "/project");
}

export async function setWebhook(url?: string): Promise<SihProject> {
  await rawRequest("/set-webhook", {
    method: "GET",
    query: url ? { url } : undefined,
  });
  return getProject();
}

export async function getItems(appId = env.SIH_APP_ID): Promise<SihGetItems> {
  const { status, json } = await rawRequest("/get-items", {
    method: "GET",
    query: { appId, extended: true },
    timeoutMs: 90_000,
  });
  const parsed = parse(sihGetItemsSchema, json, "/get-items");
  assertSuccess(parsed, status);
  return parsed;
}

export async function getMinItem(
  item: string,
  appId = env.SIH_APP_ID,
): Promise<SihMinItem> {
  const { status, json } = await rawRequest("/get-min-item", {
    method: "GET",
    query: { item, appId },
  });
  const parsed = parse(sihMinItemSchema, json, "/get-min-item");
  assertSuccess(parsed, status);

  const raw = parsed.items[item] ?? Object.values(parsed.items)[0];
  const entries = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
  const live = entries.filter((e) => (e.count ?? 0) > 0).sort((a, b) => a.price - b.price);
  const entry = live[0] ?? entries[0];
  if (!entry) return { found: false, price: null, count: 0 };
  return { found: true, price: entry.price, count: live.reduce((sum, e) => sum + (e.count ?? 0), 0) };
}

export async function createOrder(input: SihCreateOrderInput): Promise<SihOrderObject> {
  const body = {
    steamId: input.steamId,
    token: input.token,
    amount: input.amount,
    item: input.item,
    customId: input.customId,
    test: input.test ?? env.SIH_TEST_MODE,
    appId: input.appId ?? env.SIH_APP_ID,
  };

  let status: number;
  let json: unknown;
  try {
    ({ status, json } = await rawRequest("/create-order", {
      method: "POST",
      body,
      retry: false,
    }));
  } catch (err) {
    if (err instanceof SihError && (err.code === "timeout" || err.code === "network")) {
      const existing = await getOrder({ customId: input.customId }).catch(() => null);
      if (existing) return existing;
    }
    throw err;
  }

  const parsed = parse(sihCreateOrderResponseSchema, json, "/create-order");

  if (status === 409 || (!parsed.success && /already exists/i.test(parsed.error ?? ""))) {
    if (parsed.order) return parsed.order;
    const existing = await getOrder({ customId: input.customId }).catch(() => null);
    if (existing) return existing;
  }

  if (!parsed.success) {
    throw mapSihError(parsed.error, status);
  }

  if (parsed.order) return parsed.order;
  return {
    id: parsed.id ?? undefined,
    customId: input.customId,
    status: "created",
    balance: parsed.balance ?? undefined,
  };
}

export async function getOrder(params: {
  id?: string;
  customId?: string;
}): Promise<SihOrderObject | null> {
  const query: Query = {};
  if (params.id) query.id = params.id;
  if (params.customId) query.customId = params.customId;

  const { status, json } = await rawRequest("/get-order", { method: "GET", query });
  const parsed = parse(sihGetOrderSchema, json, "/get-order");
  if (!parsed.success) {
    const err = mapSihError(parsed.error, status);
    if (err.code === "item_unavailable" || /not found/i.test(parsed.error ?? "")) {
      return null;
    }
    throw err;
  }
  return parsed.order ?? null;
}

export async function getOrders(params: {
  ids?: string[];
  customIds?: string[];
}): Promise<SihOrderObject[]> {
  const { status, json } = await rawRequest("/get-orders", {
    method: "POST",
    body: { ids: params.ids ?? [], customIds: params.customIds ?? [] },
    retry: true,
  });
  const parsed = parse(sihGetOrdersSchema, json, "/get-orders");
  assertSuccess(parsed, status);
  return parsed.orders;
}

export async function getWalletHistory(params: {
  walletTypeId?: number;
  typeIds?: number[];
  limit?: number;
  offset?: number;
}): Promise<SihWalletHistory> {
  const { status, json } = await rawRequest("/wallet/history", {
    method: "GET",
    query: {
      walletTypeId: params.walletTypeId ?? 1,
      typeIds: params.typeIds?.join(","),
      limit: params.limit,
      offset: params.offset,
    },
  });
  const parsed = parse(sihWalletHistorySchema, json, "/wallet/history");
  assertSuccess(parsed, status);
  return parsed;
}

export const sihClient = {
  getProject,
  setWebhook,
  getItems,
  getMinItem,
  createOrder,
  getOrder,
  getOrders,
  getWalletHistory,
};
