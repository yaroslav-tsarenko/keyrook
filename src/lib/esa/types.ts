import { z } from "zod";

const text = z.string().nullish().catch(null);
const strings = z.array(z.coerce.string()).nullish().catch(null);
const num = z.coerce.number().finite().nullish().catch(null);

export const esaOfferSchema = z
  .object({
    offerId: z.coerce.string(),
    name: text,
    price: z.coerce.number().finite(),
    qty: z.coerce.number().int().nonnegative().catch(0),
    textQty: z.coerce.number().int().nonnegative().nullish().catch(null),
    availableQty: num,
    availableTextQty: num,
    merchantName: text,
    isPreorder: z.boolean().nullish().catch(null),
    releaseDate: text,
  })
  .passthrough();
export type EsaOffer = z.infer<typeof esaOfferSchema>;

const imageSchema = z.object({ url: text, thumbnail: text }).passthrough();

export const esaProductSchema = z
  .object({
    kinguinId: z.coerce.number().int(),
    productId: z.coerce.string(),
    name: z.string().default(""),
    originalName: text,
    description: text,
    coverImage: text,
    coverImageOriginal: text,
    developers: strings,
    publishers: strings,
    genres: strings,
    platform: text,
    releaseDate: text,
    qty: z.coerce.number().int().nonnegative().catch(0),
    textQty: z.coerce.number().int().nonnegative().nullish().catch(null),
    price: z.coerce.number().finite().catch(0),
    cheapestOfferId: z.array(z.coerce.string()).nullish().catch(null),
    isPreorder: z.boolean().nullish().catch(null),
    regionalLimitations: text,
    regionId: num,
    countryLimitation: strings,
    activationDetails: text,
    videos: z.array(z.object({ name: text, video_id: text }).passthrough()).nullish().catch(null),
    languages: strings,
    systemRequirements: z
      .array(z.object({ system: text, requirement: strings }).passthrough())
      .nullish()
      .catch(null),
    tags: strings,
    offers: z.array(esaOfferSchema).nullish().catch(null),
    offersCount: num,
    totalQty: num,
    merchantName: strings,
    ageRating: text,
    metacriticScore: num,
    steam: text,
    updatedAt: text,
    images: z
      .object({ cover: imageSchema.nullish().catch(null), screenshots: z.array(imageSchema).nullish().catch(null) })
      .passthrough()
      .nullish()
      .catch(null),
  })
  .passthrough();
export type EsaProduct = z.infer<typeof esaProductSchema>;

export const esaProductPageSchema = z.object({
  results: z.array(z.unknown()).default([]),
  item_count: z.coerce.number().int().nonnegative().default(0),
});
export type EsaProductPage = { results: EsaProduct[]; itemCount: number; rejected: number };

export const esaOrderCreateSchema = z
  .object({
    orderId: z.coerce.string(),
    orderExternalId: text,
    status: text,
  })
  .passthrough();
export type EsaOrderCreate = z.infer<typeof esaOrderCreateSchema>;

export const esaOrderSchema = z
  .object({
    orderId: z.coerce.string(),
    orderExternalId: text,
    status: z.string().default("processing"),
    totalPrice: num,
    paymentPrice: num,
    totalQty: num,
    createdAt: text,
    products: z.array(z.object({ productId: text, kinguinId: num, qty: num, price: num, name: text }).passthrough()).nullish().catch(null),
  })
  .passthrough();
export type EsaOrder = z.infer<typeof esaOrderSchema>;

export const esaOrderSearchSchema = z.object({
  results: z.array(esaOrderSchema).default([]),
  item_count: z.coerce.number().int().nonnegative().default(0),
});

export const esaKeySchema = z
  .object({
    serial: z.string(),
    type: z.string().default("text/plain"),
    name: text,
    kinguinId: num,
    productId: text,
    offerId: text,
  })
  .passthrough();
export type EsaKey = z.infer<typeof esaKeySchema>;

export const esaKeysSchema = z.array(esaKeySchema);

export const esaWebhookOrderSchema = z
  .object({
    orderId: z.coerce.string(),
    orderExternalId: text,
    status: text,
    updatedAt: text,
  })
  .passthrough();

export const esaWebhookProductSchema = z
  .object({
    kinguinId: z.coerce.number().int(),
    productId: text,
    qty: num,
    textQty: num,
    cheapestPrice: num,
    updatedAt: text,
  })
  .passthrough();

export const esaBalanceSchema = z.object({ balance: z.coerce.number().finite() }).passthrough();
