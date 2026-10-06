import { z } from "zod";

const money = z.coerce.number().finite();
const optionalNumber = z.coerce.number().finite().nullish().catch(null);

export const sihProjectSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  balance: money,
  webhook: z.string().nullish(),
});
export type SihProject = z.infer<typeof sihProjectSchema>;

export const sihProjectEnvelopeSchema = z.object({
  success: z.boolean(),
  project: sihProjectSchema,
});

export const sihCatalogItemSchema = z
  .object({
    price: money,
    count: z.coerce.number().int().nonnegative().default(0),
    phase: z.string().nullish(),
    market: z.string().nullish(),
    sell: money.nullish(),
    steam: money.nullish(),
    image: z.string().nullish(),
    color: z.string().nullish(),
    float: optionalNumber,
    floatMin: optionalNumber,
    floatMax: optionalNumber,
    paintSeed: optionalNumber,
    paintIndex: optionalNumber,
    collection: z.string().nullish().catch(null),
    inspect: z.string().nullish().catch(null),
    id: z.union([z.string(), z.number()]).nullish().catch(null),
    name: z.string().nullish(),
    market_hash_name: z.string().nullish(),
  })
  .passthrough();
export type SihCatalogItem = z.infer<typeof sihCatalogItemSchema>;

const catalogEntrySchema = z.union([sihCatalogItemSchema, z.array(sihCatalogItemSchema)]);

export const sihGetItemsSchema = z.object({
  success: z.boolean(),
  error: z.string().nullish(),
  items: z.union([z.record(z.string(), catalogEntrySchema), z.array(sihCatalogItemSchema)]).default({}),
});
export type SihGetItems = z.infer<typeof sihGetItemsSchema>;

export interface SihOffer {
  marketHashName: string;
  item: SihCatalogItem;
}

export function flattenCatalog(items: SihGetItems["items"]): SihOffer[] {
  const offers: SihOffer[] = [];
  if (Array.isArray(items)) {
    for (const item of items) {
      const name = item.market_hash_name ?? item.name;
      if (name) offers.push({ marketHashName: name, item });
    }
    return offers;
  }
  for (const [marketHashName, entry] of Object.entries(items)) {
    for (const item of Array.isArray(entry) ? entry : [entry]) offers.push({ marketHashName, item });
  }
  return offers;
}

export const sihMinItemSchema = z
  .object({
    success: z.boolean(),
    items: z.record(z.string(), catalogEntrySchema).default({}),
    error: z.string().nullish(),
  })
  .passthrough();

export interface SihMinItem {
  found: boolean;
  price: number | null;
  count: number;
}

export const sihSenderSchema = z
  .object({
    offerId: z.union([z.string(), z.number()]).nullish(),
    timeout: z.union([z.string(), z.number()]).nullish(),
    nickname: z.string().nullish(),
    avatar: z.string().nullish(),
  })
  .passthrough();

export const sihProtectionSchema = z
  .object({
    status: z.string().nullish(),
    error: z.string().nullish(),
    rollbackAt: z.union([z.string(), z.number()]).nullish(),
    rollbackAmount: money.nullish(),
  })
  .passthrough();

export const sihOrderObjectSchema = z
  .object({
    id: z.union([z.string(), z.number()]).nullish(),
    customId: z.union([z.string(), z.number()]).nullish(),
    status: z.string().nullish(),
    amount: money.nullish(),
    item: z.string().nullish(),
    balance: money.nullish(),
    error: z.string().nullish(),
    sender: sihSenderSchema.nullish(),
    protection: sihProtectionSchema.nullish(),
  })
  .passthrough();
export type SihOrderObject = z.infer<typeof sihOrderObjectSchema>;

export const sihCreateOrderResponseSchema = z
  .object({
    success: z.boolean(),
    id: z.union([z.string(), z.number()]).nullish(),
    balance: money.nullish(),
    error: z.string().nullish(),
    order: sihOrderObjectSchema.nullish(),
  })
  .passthrough();
export type SihCreateOrderResponse = z.infer<typeof sihCreateOrderResponseSchema>;

export const sihGetOrderSchema = z
  .object({
    success: z.boolean(),
    order: sihOrderObjectSchema.nullish(),
    error: z.string().nullish(),
  })
  .passthrough();

export const sihGetOrdersSchema = z
  .object({
    success: z.boolean(),
    orders: z.array(sihOrderObjectSchema).default([]),
    error: z.string().nullish(),
  })
  .passthrough();

export const sihWalletHistorySchema = z
  .object({
    success: z.boolean(),
    history: z.array(z.record(z.string(), z.unknown())).default([]),
    error: z.string().nullish(),
  })
  .passthrough();
export type SihWalletHistory = z.infer<typeof sihWalletHistorySchema>;

export interface SihCreateOrderInput {
  steamId: string;
  token: string;
  amount: number;
  item: string;
  customId: string;
  test?: boolean;
  appId?: number;
}
