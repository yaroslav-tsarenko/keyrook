# Keyrook

Storefront and admin for Keyrook (keyrook.com), a store for game keys, DLC, subscriptions, gift cards, top-ups and software, built with Next.js 16. Products come from the Kinguin ESA API (Kinguin for Business). After a card payment is confirmed, the store orders the key from Kinguin, stores it encrypted and shows it to the buyer on their order page.

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- PostgreSQL with Prisma ORM 7 (`@prisma/adapter-pg`)
- Email and password accounts with a JWT session cookie
- Card payments behind a provider interface (`src/lib/payments`); no live provider connected yet
- Key supplier: Kinguin ESA API (`src/lib/esa`)
- next-intl (messages in `messages/en/*.json`), Nodemailer, pdf-lib invoices

## How it works

### Catalogue

`npm run catalog:sync` (`scripts/catalog-sync.ts` → `src/lib/esa/sync.ts`) pages through the whole `GET /v1/products` catalogue (4 pages of 100 in parallel). Each page is classified as it arrives and staged as NDJSON in `.cache/catalog-sync/`, so memory stays flat at any catalogue size and an interrupted run (network error, closed laptop, Ctrl-C) resumes from the last staged page or written chunk when the same command is run again within 24 h (`-- --fresh` starts over). A lock file stops two syncs from running at once. Then it:

1. **Classifies** every product (`src/lib/esa/classify.ts`): product type (game, DLC, subscription, gift card, top-up, software), platform (Steam, Epic Games Store, EA app, Ubisoft Connect, GOG, Battle.net, Xbox, PlayStation, Nintendo, Rockstar Games Launcher, other; the product name wins over the supplier's platform field, so "EA App Key" listed under Steam becomes EA app), region, edition, genres and languages. A clean English title is derived from the supplier name.
2. **Rejects** what the store does not list: regions outside `include.regions` (RU/CIS, Asia, LATAM, Turkey, region-locked VPN keys), Russian-only language sets, accounts and gift links, adult and gambling/loot-box products, pre-orders, products without stock, without a cover image or without a usable English name, and excluded platforms. All terms live in `src/config/catalog.ts`.
3. **Deduplicates** by type + title + edition + platform + region (+ card value or duration for prepaid products) and keeps the cheapest in-stock offer of each group.
4. **Drops price anomalies**: prices above the per-type ceiling, above the 95th percentile × 1.6 of comparable products (same type and release age), more than 4× the same title's other offers, or gift cards priced far from their face value.
5. **Selects** a balanced catalogue within `target` (65,000–75,000 by default, ~70,000 quota total) using per-type quotas, a per-platform share cap, genre and price-band interleaving and at most `maxPerTitle` variants of one game. Capacity a type cannot fill (prepaid products are scarcer) spills over to games and DLC. If the supplier has fewer eligible products than the target, all of them are taken and the run ends with a warning; nothing is padded.
6. **Upserts** everything with deterministic ids in transactions of 500 products, so re-running never duplicates. Products that drop out are archived, never deleted. Categories are product type → platform and are hidden when empty. The run ends with `VACUUM (ANALYZE)` on the catalogue tables so the catalogue indexes are used straight away.

Game attributes (genres, release date, developer, publisher, age rating, Metacritic score when supplied) are only stored for games and DLC; system requirements only for PC games and DLC. Subscriptions keep their duration, gift cards their face value.

Images are served through `/media/<id>` (`src/app/media/[id]/route.ts`), so the supplier's image host never appears in the page source. Supplier ids, costs and raw names sit in `SupplyItem`, which is stripped from every Prisma result by `sanitizeSupplierData` unless a supplier module asks for it.

Price history: every sync appends to `SupplyItem.priceLog`. A product shows a struck-through "previously" price only when its price is at least 10% below its lowest price of the previous 30 days; the "Price drop" filter uses the same rule.

`npm run catalog:refresh` (and the daily cron) only re-checks price and stock of listed products in batches of 100 `kinguinId`s (3 in parallel), stalest first, with one SQL update per batch. The cron stops after `refreshBudgetMs` and the next run continues where it stopped; the CLI runs to the end.

Catalogue pages, facets, search and sitemaps are SQL-side: facet counts come from one grouping-sets query per page view (cached for 2 minutes per filter combination), name search uses `pg_trgm` GIN indexes, and product sitemaps are split into files of 5,000 URLs under `/sitemap.xml`. The schema enables `pg_trgm` (`postgresqlExtensions`); `npm run local:setup` creates it before `prisma db push`, and Neon supports it.

### Data model

- `Product` (storefront: name, slug, price, comparePrice, images, categories)
- `KeyItem` (public filter attributes: type, platform, region, languages, genres, release year, developers, publishers, edition, age rating, system requirements, video, face value, validity)
- `SupplyItem` (server only: Kinguin productId and kinguinId, cost, sell price, stock, offers, price log)
- `KeyOrder` (one per order line: status, supplier order id, cost, margin, attempts) → `KeyOrderEvent` (audit trail)
- `KeyCode` (the delivered key, AES-256-GCM encrypted, with a fingerprint against duplicates and reveal tracking)
- `MediaSource` (media id → original image URL)

### Order flow

1. `POST /api/checkout` requires a signed-in account, checks per-product and per-order limits (`src/config/store-policy.ts`: gift cards, top-ups and subscriptions have lower per-order caps, and gift cards and top-ups also have a 24-hour per-customer limit) and re-checks each product's live price. If the total changed beyond `CATALOG_PRICE_TOLERANCE`, the buyer sees the new total before paying (`TOTAL_CHANGED`).
2. One `Order` with one `KeyOrder` per line (`awaiting_payment`) is created with the buyer's request for immediate delivery and withdrawal acknowledgement (timestamp, text and version). The response contains only the order id and the payment link.
3. The payment webhook (`/api/webhooks/payment/<provider>`) re-fetches the payment from the provider and calls `settlePayment`, which checks amount and currency, marks the order paid once, sends the confirmation and invoice, and submits each `KeyOrder` (`src/lib/esa/orders.ts`).
4. Submission is single-flight (`paid → submitted` claim) and idempotent: the `orderExternalId` is the `KeyOrder` id, and an existing supplier order with that id is reused instead of creating a second one. The max price sent is cost × (1 + `orderPriceTolerance`).
5. Keys are collected from `GET /v2/order/{id}/keys`, encrypted with a key derived from `KEY_ENCRYPTION_SECRET` (the ciphertext is bound to its key order) and stored; the line becomes `delivered` and the buyer gets a "your keys are ready" email that links to the order page. The email never contains the key.
6. Supplier errors are retried up to three attempts for transient failures; otherwise the line is parked as `refund_pending`, a critical alert is sent (Telegram when configured, console otherwise) and the buyer sees "Refund pending". `/admin/supply` lists the backlog with Retry delivery and Mark refunded.

Keys are only readable through `POST /api/account/keys/<id>`, which requires the owner's session, a delivered key order and a paid order, is rate limited and answers `Cache-Control: no-store`. The order page shows keys behind Reveal key with a Copy button and platform activation steps.

Keys arrive through three paths: the order webhook from Kinguin (`/api/webhooks/esa`, checked against `KINGUIN_WEBHOOK_SECRET`), an on-view refresh when the buyer opens the order (at most every 20 seconds), and the daily poll cron.

### Sandbox and live orders

`KINGUIN_LIVE_ORDERS=false` (default) sends every order to `KINGUIN_SANDBOX_API_BASE` with `KINGUIN_SANDBOX_API_KEY`, while the catalogue still reads from `KINGUIN_API_BASE`. Set it to `true` only when the payment provider is live and the Kinguin balance is funded.

### Payments

No card provider is connected yet. Everything provider-specific sits behind one interface in `src/lib/payments/provider.ts`:

| Method | Contract |
| --- | --- |
| `createPayment({ order, amount, currency, returnUrl, cancelUrl, webhookUrl, customer })` | Creates the payment and returns `{ redirectUrl, providerRef }`. |
| `parseWebhook(request)` | Verifies the signature and returns `{ providerRef, orderId, status, amount, currency }`, with `status` one of `paid`, `failed`, `pending`. Throws `PaymentWebhookError` to reject. |
| `fetchStatus(providerRef)` | Returns the same shape straight from the provider's API. |

`PAYMENT_PROVIDER` selects the provider:

- `none` (default): `POST /api/checkout` answers `503 { "code": "PAYMENTS_NOT_CONNECTED" }` before creating an order, and checkout says card payments are being connected and nothing has been charged.
- `mock`: local testing only (`NODE_ENV` not `production` and `PAYMENT_MOCK_ENABLED=true`). Checkout redirects to `/checkout/mock-pay`, whose Pay / Fail buttons send an HMAC-signed webhook to `/api/webhooks/payment/mock`, so the whole paid → supplier → delivered path runs locally.

To connect a real provider: add `src/lib/payments/<name>.ts` exporting a `PaymentProvider`, add its variables to `src/lib/env.ts` and `.env.example`, add the id to `PAYMENT_PROVIDER_IDS` and the `PROVIDERS` map, then set `PAYMENT_PROVIDER=<name>`.

### Crons

`vercel.json` runs three daily jobs (Vercel Hobby allows daily schedules only): price and stock refresh, key order poll, and balance/stuck-order monitor. All cron routes require `Authorization: Bearer $CRON_SECRET`. The full catalogue sync is run from the command line, because it takes longer than a serverless function may run.

## Local setup (macOS)

```bash
brew install postgresql@16 && brew services start postgresql@16
npm install
cp .env.example .env         # set JWT_SECRET and KINGUIN_API_KEY
npm run local:setup          # creates the keyrook database, pushes the schema, seeds, generates KEY_ENCRYPTION_SECRET, syncs the catalogue
npm run dev                  # http://localhost:3000
```

`local:setup` writes `DATABASE_URL`/`DIRECT_URL` into `.env` when they are empty (override the server with `LOCAL_PG_URL`). The admin account comes from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

To try a purchase end to end without a card provider, set `PAYMENT_PROVIDER=mock` and `PAYMENT_MOCK_ENABLED=true`. Orders go to the Kinguin sandbox while `KINGUIN_LIVE_ORDERS=false`. Without sandbox access, run the fixture mock server from the dev tools (`node mock-esa-server.mjs`, port 4010) and point `KINGUIN_SANDBOX_API_BASE` at `http://localhost:4010/esa/api`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run local:setup` | Local database, schema, seed and first catalogue sync |
| `npm run catalog:sync` | Full catalogue sync, resumable (`-- --max-pages 20` for a quick trial, `-- --fixture <file>` to read a local `.json` or `.ndjson` file, `-- --fresh` to discard staged pages) |
| `npm run catalog:refresh` | Price and stock refresh of listed products |

## Configuration

- `src/config/catalog.ts`: target size, quotas per type, platform share, region and exclusion lists, margin, price ceilings, anomaly rules, sync paging.
- `src/config/store-policy.ts`: currency, delivery wording, refund and guarantee periods, order and per-customer limits, the withdrawal waiver text. Policy pages, FAQ, emails, checkout and invoices read from here.
- `src/lib/keys/taxonomy.ts`: product types, platforms with activation steps, regions, genres.
- `src/lib/company.ts`: company particulars (placeholders until provided).
- `.env.example`: every environment variable, grouped by service.

## Deployment

Deploy on Vercel with the variables from `.env.example`. Set `APP_URL` and `NEXT_PUBLIC_SITE_URL` to the main domain. Register `https://<domain>/api/webhooks/esa` as the order and product webhook in the Kinguin dashboard with the same secret as `KINGUIN_WEBHOOK_SECRET`. Keep `KEY_ENCRYPTION_SECRET` stable across deploys: delivered keys cannot be decrypted without it.
