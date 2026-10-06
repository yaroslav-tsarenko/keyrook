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

const shape = {
  SIH_API_KEY: z.string().min(1, "SIH_API_KEY is required"),
  SIH_API_BASE: z.string().url().default("https://api.sih.market/api/v1"),
  SIH_APP_ID: num(catalogConfig.appId),
  SIH_WEBHOOK_SECRET: z.string().min(1, "SIH_WEBHOOK_SECRET is required"),
  SIH_TEST_MODE: bool(false),
  SIH_PRICE_TOLERANCE: num(catalogConfig.pricing.priceTolerance),
  SIH_MARGIN: num(catalogConfig.pricing.margin),
  SIH_MIN_MARGIN_ABS: num(catalogConfig.pricing.minMarginAbs),
  SIH_LOW_BALANCE_THRESHOLD: num(100),

  PAYMENT_PROVIDER: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim().toLowerCase() : "none"))
    .pipe(z.enum(PAYMENT_PROVIDER_IDS))
    .refine((v) => v !== "mock" || mockPaymentsAllowed(), {
      message: 'PAYMENT_PROVIDER="mock" is refused: it requires NODE_ENV other than "production" and PAYMENT_MOCK_ENABLED=true',
    }),
  PAYMENT_MOCK_ENABLED: bool(false),

  STEAM_API_KEY: optional,

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
