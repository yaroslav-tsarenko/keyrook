import { z } from "zod";
import { catalogConfig } from "@/config/catalog";

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? def : v === "true" || v === "1"));

const num = (def: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? def : Number(v)))
    .pipe(z.number().finite());

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

export const PAYMENT_PROVIDER_IDS = ["none", "mock"] as const;
export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number];

export function mockPaymentsAllowed(): boolean {
  const flag = process.env.PAYMENT_MOCK_ENABLED;
  return process.env.NODE_ENV !== "production" && (flag === "true" || flag === "1");
}

const baseUrl = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : fallback))
    .pipe(z.string().url())
    .transform((v) => v.replace(/\/+$/, "").replace(/\/v[12]$/, ""));

const shape = {
  KINGUIN_API_KEY: z.string().min(1, "KINGUIN_API_KEY is required"),
  KINGUIN_API_BASE: baseUrl("https://gateway.kinguin.net/esa/api"),
  KINGUIN_CLIENT_ID: optional,
  KINGUIN_CLIENT_SECRET: optional,
  KINGUIN_OAUTH_TOKEN_URL: optional,
  KINGUIN_LIVE_ORDERS: bool(false),
  KINGUIN_SANDBOX_API_BASE: baseUrl("http://localhost:4010/esa/api"),
  KINGUIN_SANDBOX_API_KEY: optional,
  KINGUIN_WEBHOOK_SECRET: z.string().min(1, "KINGUIN_WEBHOOK_SECRET is required"),
  KINGUIN_LOW_BALANCE_THRESHOLD: num(50),
  CATALOG_MARGIN: num(catalogConfig.pricing.margin),
  CATALOG_MIN_MARGIN_ABS: num(catalogConfig.pricing.minMarginAbs),
  CATALOG_PRICE_TOLERANCE: num(catalogConfig.pricing.priceTolerance),
  CATALOG_FIXTURE_FILE: optional,

  KEY_ENCRYPTION_SECRET: z.string().min(32, "KEY_ENCRYPTION_SECRET must be at least 32 characters"),

  PAYMENT_PROVIDER: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim().toLowerCase() : "none"))
    .pipe(z.enum(PAYMENT_PROVIDER_IDS))
    .refine((v) => v !== "mock" || mockPaymentsAllowed(), {
      message: 'PAYMENT_PROVIDER="mock" is refused: it requires NODE_ENV other than "production" and PAYMENT_MOCK_ENABLED=true',
    }),
  PAYMENT_MOCK_ENABLED: bool(false),

  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
  APP_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
    .pipe(z.string().url())
    .transform((v) => v.replace(/\/+$/, "")),

  ALERT_TELEGRAM_BOT_TOKEN: optional,
  ALERT_TELEGRAM_CHAT_ID: optional,
} as const;

const schema = z.object(shape);
type Env = z.infer<typeof schema>;

const cache = new Map<keyof Env, unknown>();

function readEnv<K extends keyof Env>(key: K): Env[K] {
  if (cache.has(key)) return cache.get(key) as Env[K];
  const parsed = shape[key].safeParse(process.env[key as string]);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid environment configuration:\n  - ${String(key)}: ${msg}`);
  }
  cache.set(key, parsed.data);
  return parsed.data as Env[K];
}

export const env: Env = new Proxy({} as Env, {
  get(_t, prop: string) {
    return readEnv(prop as keyof Env);
  },
});

export function hasEnv(...keys: (keyof Env)[]): boolean {
  return keys.every((key) => shape[key].safeParse(process.env[key as string]).success);
}

export function assertPaymentConfig(): void {
  void env.PAYMENT_PROVIDER;
}
