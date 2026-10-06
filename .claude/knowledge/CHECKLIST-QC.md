# Website Quality Control Checklist (General Requirements)

> Compiled from the review feedback on: ravora, electreia, avontshop, headpay, adswall, macix,
> noirdrop, ferutoys, higherskins, floatline, conskins, nivro, coppedskins, kirosim,
> and the acquiring bank's Merchant Screening Report for keyarcade.
>
> These are **universal requirements** that Claude Code must apply to any website
> (e-commerce store, skins store, game keys store, eSIM, adult products, AI tool, fintech, etc.),
> adapting wording and content to the specific project's niche.
>
> Goal: go through the entire site, close every item and deliver the site in a **"live store, ready for bank review"** state:
> no 404s, no demo content, no false claims, an up-to-date product range.

---

## 0. How to use this checklist

- Go through each section in order and tick off completed items.
- Every item is a **rule**, not a one-off fix: if an issue appears in several places, fix it **everywhere**.
- All content (copy, reviews, photos, FAQ, blog) must **match the niche** of the specific site. Content from other projects is not allowed.
- All numbers, timeframes, prices, percentages and policies must **match everywhere** on the site (pages, footer, FAQ, legal documents, checkout, emails).
- Section 18 contains vertical-specific requirements (e-commerce, eSIM, skins, keys). Apply only the subsection relevant to the project.

### 0.1 Priority labels

| Label | Meaning |
|---|---|
| **[BLOCKER]** | The site cannot be submitted to the bank without this: direct rejection or a risk flag |
| **[MAJOR]** | A frequent cause of client or bank feedback |
| **[MINOR]** | Polish |
| **[BANK-VAR]** | Requirement varies from bank to bank. Implement by default, exact form is confirmed per bank |

### 0.2 Core principle — everything on the site must be true

Banks check not only whether pages exist, but whether **what is written matches reality**. Any claim that cannot be backed up is a "misleading claim" and a reason for rejection.

- [ ] **[BLOCKER]** Every claim about products, stock, delivery times, refunds, taxes, product origin and warranties can be backed up by how the store actually operates.
- [ ] **[BLOCKER]** Marketing copy (hero, About, FAQ, badges) **does not promise more than the policies**. If the Refund Policy has no voluntary 14-day return, the homepage does not mention one either.
- [ ] **[BLOCKER]** No absolute claims that cannot be guaranteed: "delivered in a minute", "always in stock", "100% original", "sold once", "guaranteed", "works on every device", "unlimited" (if a fair-use limit exists). Replace with accurate, honest wording: "usually delivered within minutes of payment confirmation", "delivery time is shown on each product".
- [ ] **[BLOCKER]** The site looks and behaves like a **final, live store**, not a demo, template or "under construction" page.

---

## 1. Automated checks (run first and last)

### 1.1 Crawl the site for 404s

- [ ] Run a crawler against the production URL (or locally via `next start`) and make sure there are **zero 404/500 errors** on pages, links, images and assets:
  ```bash
  npx linkinator https://<domain> --recurse --skip "^(?!https://<domain>)" --verbosity error
  ```
- [ ] Separately check: `sitemap.xml`, `robots.txt`, every menu and mega-menu item, every filter/category, pagination, product pages from different categories, all legal pages, blog pages, `/404` (a custom 404 page in the site's style).
- [ ] Every "category + filter" combination reachable from the UI returns either products or a meaningful empty state. Filters/categories with 0 products must be **hidden** or populated.

### 1.2 Search for forbidden strings in code and content

- [ ] Run a search across the repository (including JSON catalogues, seeds, i18n files, policy texts) and resolve every match:
  ```bash
  grep -rniE "demo|lorem|placeholder|this listing is|coming soon|under construction|TODO|FIXME|COMPANY NAME|youremail@example|\[VAT|\[REG|\[COMPANY|4242 ?4242|test card|bestbuy|best buy|bby|geek squad|kinguin|g2a|vercel\.app" \
    --include=*.{ts,tsx,js,jsx,json,md,mdx,html} --exclude-dir={node_modules,.next,.git} .
  ```
- [ ] Search for names of **other projects** (old brand name, domain, legal entity). They must not appear in code, metadata, OG tags or `<title>`.

---

## 2. Company details (CRITICAL)

- [ ] **[MAJOR]** During development, if company details **have not been provided**, use explicit placeholders: **COMPANY NAME**, **youremail@example.com**, `[COMPANY ADDRESS]`, `[REG_NUMBER]`, `[VAT_NUMBER]`. **Never invent** real-looking details.
- [ ] **[BLOCKER]** Before submission to the bank — **zero placeholders**. Missing company details are a blocker to report to the client, not a reason to ship the site with `COMPANY NAME`.
- [ ] All company details live in **one config** (legal name, registration number, address, email, phone, VAT status, brand) and are pulled from there everywhere.
- [ ] **[BLOCKER]** Company details are **identical everywhere**: footer, `/contact`, legal pages, checkout, emails, invoice. Common mistake: another company's legal name left behind (e.g. `HEADPAY LTD`).
- [ ] Footer shows: legal name, registration number, address, email.
- [ ] `/contact` states explicitly: "<Brand> is a trading name of <Legal Entity>".
- [ ] The same phone number on every page.
- [ ] Remove leaked internal data: geo-bindings, unrelated Telegram channels, random phone numbers, technical URLs (e.g. a Vercel address during Steam login).
- [ ] **[BANK-VAR]** Contacts: email + address + **phone or a working live chat**. Some banks accept email only, others require phone/chat. By default, provide a slot for phone and/or chat in the config and render it when the client supplies a number.
- [ ] Support hours with a time zone (e.g. `Mon–Fri, 09:00–18:00 (EET)`), identical everywhere.

---

## 3. Registration (multi-step form) — CLIENT REQUIREMENT

- [ ] The registration form is **multi-step**.
- [ ] Besides **Email** and **Password**, collect and store: **First name**, **Last name**, **Phone number**, **Date of birth**, **Address** split into 4 fields: **Street**, **City**, **Country** (dropdown), **Postcode**.
- [ ] The excluded-countries list lives in **one config** and is used in registration, checkout and the T&Cs text (see section 16). Minimum: **Russia, Belarus, Iran, North Korea**; recommended also **Syria, Cuba**.
- [ ] Age check by date of birth matches the T&Cs (if the T&Cs say 18+, under-18s cannot register).
- [ ] All data is **saved to the database**.
- [ ] Field hints (e.g. phone code `+44` / `+372`) match the project's region.
- [ ] No stray/broken text next to "Log In".
- [ ] Above the registration button — a checkbox "I read and agree to the Terms and Conditions" (with a link). The button is enabled **only** when the checkbox is ticked.
- [ ] Each project has its **own database**. The same email can register on different projects independently.

---

## 4. Transactional emails

- [ ] Registration confirmation email arrives.
- [ ] Password reset works.
- [ ] After a **confirmed** payment, an order confirmation email with a **PDF invoice** arrives.
- [ ] **[MAJOR]** The email and invoice include: seller's legal name and brand, address, date, order number, description of each item, quantity, amount, **currency**, payment method (no full card number), and a VAT line consistent with the actual VAT status (see 7.4).
- [ ] For digital goods, the email **re-confirms** the customer's consent to immediate delivery and loss of the right of withdrawal (see 7.3).
- [ ] Emails are sent from the project's own domain, not an unrelated/technical domain.

---

## 5. Currencies and conversion

- [ ] The header offers the required currencies (usually **GBP, EUR, USD**; default currency per project requirements).
- [ ] Switching currency **actually changes prices** everywhere (homepage, catalogue, product cards, cart, checkout, emails).
- [ ] **Conversion** works; prices are rounded sensibly (no `£12.3456`).
- [ ] The price filter follows the selected currency.
- [ ] The locale indicator in the header (e.g. `UK | EN | GBP`) matches the selected currency.
- [ ] The list of currencies on the site matches the list in the T&Cs.

---

## 6. Links, buttons, navigation and filters

- [ ] **[BLOCKER]** **No broken links or buttons (404)** — see 1.1.
- [ ] Every CTA in the hero, cards and promo blocks works and leads to a logical page ("View Plans" → pricing, "Join" → registration).
- [ ] Ambiguous CTAs are renamed to clear ones ("Start Free" → "Create Account").
- [ ] **[MAJOR]** **Active state** in menus, tabs and categories matches the selected item. Example (coppedskins): selecting Rifles/Pistols still underlines `ALL` instead of the selected category. Check menus, category tabs, filters, pagination and mobile menu; the active state is synced with the URL (stays correct after a page reload and browser "back").
- [ ] **[MAJOR]** **Empty filters/blocks.** Example (coppedskins): in the "Pick a rarity" block the *Extraordinary* filter is empty. Every filter/chip/tab shown to the user must return products. If there are none — populate the catalogue or hide the item.
- [ ] Every navigation item corresponds to a real service. No section that contradicts the policies (example: a "Pre-orders" section in the menu while the Delivery Policy says "We do not offer pre-orders"; the "Pre-orders" filter returned the entire catalogue).
- [ ] Counters in filters/categories (if any) match the real number of products.
- [ ] Empty states (empty cart, no search results, no orders) are meaningful and offer an action, not a blank page.

---

## 7. Payment and checkout

### 7.1 Payment integration [BLOCKER]

- [ ] **[BLOCKER]** The site has **no native card input fields** (card number/expiry/CVC as plain `<input>`s on the store's own page). Cards are entered only in the payment provider's **hosted payment page / hosted fields / iframe**. Native fields mean full PCI DSS SAQ D scope and a bank rejection.
- [ ] **[BLOCKER]** No test data in the UI: `4242 4242 4242 4242` placeholder, "test mode", provider test keys in production.
- [ ] **[BLOCKER]** An order is fulfilled (keys/codes/eSIMs delivered, status "paid") **only after server-side payment confirmation** from the provider (webhook / server-to-server status check). The order endpoint **must not** deliver goods without a confirmed payment. Verify manually: calling the checkout API directly without paying must not return any goods.
- [ ] If the payment provider is not yet connected at handover, the pay button must not simulate a successful purchase; record it as an open blocker and inform the client.
- [ ] **[BANK-VAR]** 3-D Secure / SCA runs through the provider; checkout mentions that the payment may require confirmation in the customer's banking app.

### 7.2 Checkout display

- [ ] The last page before payment shows: **"Sold by <Legal Entity>"**, address, **"Merchant of Record: <Legal Entity>"** (where applicable), order summary and total with currency.
- [ ] Checkbox agreeing to the T&Cs and Refund Policy (with links), unticked by default.
- [ ] Commission/Service Fee is consistent everywhere.
- [ ] **[MAJOR]** Quantity limits: a sensible maximum per item and per order (especially for gift cards, wallet top-ups and keys). Values live in config.
- [ ] The "Custom" field (custom amount/package) works, never shows `£NaN`, and has min/max.

### 7.3 Digital goods: waiver of the right of withdrawal [BLOCKER for keys, eSIM, skins, subscriptions]

- [ ] In addition to the T&Cs checkbox — a **separate checkbox, unticked by default**: "I request immediate delivery of the digital content and acknowledge that I lose my right of withdrawal once delivery begins". The order cannot be placed without it.
- [ ] The T&Cs withdrawal section explicitly refers to this checkbox, and the checkbox actually exists.
- [ ] The consent is stored with the order (timestamp, text version) and repeated in the confirmation email.

### 7.4 Taxes (VAT)

- [ ] **[BLOCKER]** "incl. VAT" / "VAT included" and the VAT line on the invoice are shown **only if the company is VAT-registered**. VAT status comes from the company config (section 2).
- [ ] If the company is not VAT-registered — no mention of VAT at checkout or on the invoice, and the T&Cs say the same. Never show "Subtotal (incl. VAT)" alongside "we are not registered for VAT".
- [ ] If the VAT status is unknown — ask the client, don't invent it.

### 7.5 Payment logos — source files

The coloured **Visa**, **Mastercard** and **PCI DSS** logos are on my **Desktop** (`~/Desktop`). Use **only these** — do not download from the internet or draw your own.

```bash
ls ~/Desktop | grep -iE "visa|master|mc|pci"
```

- [ ] Copy the files into the project's `public/` (e.g. `public/payments/visa.svg`, `public/payments/mastercard.svg`, `public/payments/pci-dss.svg`); if the project already has an icons folder, use it.
- [ ] Logos are in colour (not grey/black-and-white), not stretched, original proportions, large enough to read, with `alt` text.
- [ ] **Where to show them:** the footer (usually bottom right) on every page + the payment/checkout page.
- [ ] Remove icons of payment methods that are not actually accepted (Apple Pay, PayPal, Crypto, Amex, etc.) if the provider doesn't support them.
- [ ] **[BANK-VAR]** **Visa Secure** and **Mastercard Identity Check** (3DS) logos — add **only once 3DS actually works** through the provider. Don't show them before that.
- [ ] **[BANK-VAR]** PCI DSS — where the provider permits it. Some banks consider that card logos must not be shown before live card acceptance is enabled; if a specific bank says so, follow the bank.

---

## 8. Cookies, legal pages and policies

### 8.1 Cookies

- [ ] Banner on first visit: **Accept / Reject / Customize** (buttons visually equal, Reject not hidden).
- [ ] **[MAJOR]** A **preference centre** with categories (necessary / analytics / marketing) where the choice can be changed.
- [ ] **[MAJOR]** A persistent **"Cookie settings"** link in the footer on every page that opens the preference centre (if the Cookie Policy says such a link exists, it must exist).
- [ ] **[MAJOR]** The Cookie Policy contains a **table**: cookie / localStorage key name, provider, purpose, expiry. Include `localStorage` keys too (cart, theme, wishlist, currency).
- [ ] Instructions on how to withdraw consent.
- [ ] Analytics/marketing scripts do not load before consent.

### 8.2 Legal pages

- [ ] Present and loading (not 404): Terms & Conditions, Privacy Policy, Cookie Policy, Refund/Return/Cancellation Policy, Delivery/Shipping Policy, Payment Policy, Acceptable Use (if there are user accounts), Complaints, and Warranty for physical goods.
- [ ] Links to all policies — in the footer, at registration and at checkout.
- [ ] **[MAJOR]** The "Last updated" date on policies is **realistic**: not earlier than the domain registration / site launch. A policy dated before the domain existed is a red flag.
- [ ] **[MAJOR]** The Refund Policy states an **exact refund timeframe in days** (e.g. "within 14 days of approval, to the original payment method"), the process and the method.
- [ ] The Delivery Policy states real delivery times and costs and matches the marketing copy.
- [ ] **[MAJOR]** The Privacy Policy contains an **unconditional** statement: "We do not store or process full payment card data. All card payments are processed by <PCI DSS compliant provider>". No "normally" or "usually". Name the provider (or a config placeholder if not yet known) and mention 3-D Secure / SCA.
- [ ] T&Cs cover: seller, age, restricted countries, order formation, prices/currencies/taxes, payment, delivery, right of withdrawal, refunds, chargebacks, governing law, complaints.
- [ ] All policies are specific to this project (no other legal entities, domains or products).

---

## 9. Content, copy and niche relevance

- [ ] No content from **other projects**.
- [ ] All blocks, categories and service promises match the niche.
- [ ] Irrelevant blocks removed.
- [ ] Reviews match the niche; photos match the name and gender; the review grid is fully filled.
- [ ] **[BLOCKER]** No demo text on product cards or pages ("This listing is a demo", "In a live store this space holds…", Lorem Ipsum, "Sample product").
- [ ] **[BLOCKER]** No **truncated** descriptions (text cut off mid-sentence).
- [ ] For skins/keys stores: **remove every mention of user selling** (Sell skins, Start selling, Instant payout, sellers, escrow, withdrawal, "Marketplace", B2B/Wholesale) if the model is a store.
- [ ] **[BLOCKER]** No **made-up statistics**: "130,110 keys live right now", "48k customers", "4.9 rating", "$120M/month", "26 countries". Real figures only, or nothing.
- [ ] No fake stock counts next to products ("(12)", "Only 3 left") unless they reflect real stock.
- [ ] No fake partner/media logos, "As seen in", or Trustpilot widgets without a real profile.
- [ ] Copy free of AI filler (seamless, effortless, cutting-edge, unlock, elevate).

### 9.1 Forbidden wording (replace with honest alternatives)

| Don't | Why | Use instead |
|---|---|---|
| "Original keys, sold once", "no re-sold codes" | Supplier provenance cannot be proven | "Every key is checked before delivery. If a key does not work, we replace it or refund you" |
| "Delivered in a minute" / "Instant delivery" as a guarantee | The policy doesn't guarantee a timeframe | "Usually delivered within minutes after payment is confirmed" |
| "In stock" on every product | Stock not verified | Real status from the feed/warehouse |
| "14-day refunds on unused keys" | If this isn't in the Refund Policy | Wording that matches the policy word for word |
| "Subtotal (incl. VAT)" | If the company isn't VAT-registered | "Total" |
| "Works on all devices" (eSIM) | Not true | "Check your device in our compatibility list" |
| "Unlimited data" | If fair-use applies | State the limit / conditions |
| "Official partner of <brand>" | No contract with the brand | Don't write it |

---

## 10. Images and media

- [ ] All images **display** (none broken).
- [ ] No **duplicate** photos across cards/blocks or across hero sections of different pages.
- [ ] Each category in "Shop by category" has its own relevant image.
- [ ] Logo and favicon match in style; the favicon is set.
- [ ] Payment logos only from `~/Desktop` (see 7.5).
- [ ] **[MAJOR]** Product images are **stored by us** (in `public/`, own storage/CDN) and served from our domain, not hotlinked from suppliers' or other stores' sites (a third-party CDN can break, swap the image or return an error).
- [ ] Product images have no watermarks or other stores' logos.
- [ ] Blog and article cards include media.

---

## 11. Data consistency (single values across the site)

Reduce to **one value** everywhere (pages, footer, FAQ, policies, checkout, emails):

- [ ] Return window (14 vs 30 days) and refund timeframe.
- [ ] Return conditions (free vs at customer's cost; what counts as "unused").
- [ ] Warranty.
- [ ] Support (24/7 vs Mon–Fri) and contact channels.
- [ ] Free shipping threshold.
- [ ] Dispatch model (Same-Day Dispatch vs made-to-order vs supplier delivery).
- [ ] Delivery times — **realistic**, reflecting actual logistics.
- [ ] International shipping cost.
- [ ] Fees and percentages.
- [ ] **Pre-orders**: either present everywhere (menu, FAQ, policy with terms) or nowhere.
- [ ] Lists of currencies and countries.
- [ ] VAT status.

---

## 12. Blog

- [ ] Post cards link to post pages (no 404).
- [ ] Text length matches the stated reading time.
- [ ] Media included, no "wall of text".
- [ ] Articles are final, on-topic and factually correct (especially regarding device compatibility, timeframes, laws).
- [ ] Publication dates are realistic (not earlier than the domain launch).

---

## 13. UI / visual defects

- [ ] Buttons are readable with sufficient contrast.
- [ ] No jitter of elements on hover/scroll.
- [ ] Cards and blocks have no overlaps.
- [ ] One consistent font across the site.
- [ ] Duplicate pages reworked with unique blocks.
- [ ] Homepage FAQ is compact; the full FAQ lives on a separate page.
- [ ] Active states of menus/filters are correct (see section 6).
- [ ] Mobile checked: menu, filters, checkout; the cookie banner doesn't cover buttons.

---

## 14. Language and localisation

- [ ] English only unless otherwise required. Language switcher removed.
- [ ] No mixed languages (`/lv`, `/ru`).
- [ ] `/ru` routes and Russian-language content removed unless needed.
- [ ] No products/descriptions in other languages, unless it's an explicit product attribute (e.g. a key's language restrictions — stated as an attribute in English).

---

## 15. Footer

- [ ] **Visa, Mastercard, PCI DSS** logos (coloured, from `~/Desktop`).
- [ ] Full legal entity details and address; "<Brand> is a trading name of <Legal Entity>".
- [ ] Working links to all policies + **"Cookie settings"**.
- [ ] Contact email (+ phone/chat if available).
- [ ] No unverified widgets (Trustpilot without a profile).
- [ ] Social links — only real project profiles; no profiles means no social icons.

---

## 16. Restricted countries and sanctions [BLOCKER]

- [ ] The T&Cs and Acceptable Use Policy list countries/territories where the service is not provided. Minimum: **Russia, Belarus, Iran, North Korea, Syria, Cuba**, and the **temporarily occupied territories of Ukraine (Crimea, Donetsk and Luhansk regions, occupied parts of Zaporizhzhia and Kherson regions)**.
- [ ] The list lives in one config and matches the country dropdown in registration/checkout.
- [ ] **[BLOCKER]** The site has **no products contradicting this list**: "RU Language Only", "Region: CIS / RU", "VPN Required", "Russia only", etc. Such items are filtered out of the catalogue at import (by region, title, attributes).
- [ ] Nowhere on the site is there advice to use a VPN/proxy to bypass regional restrictions.
- [ ] If the T&Cs prohibit VPN use, the site itself does not sell products that require a VPN.

---

## 17. Catalogue data quality (for any imported feed)

- [ ] **[BLOCKER]** Product attributes match the **product type**. Template attributes are not applied to everything (example from the bank report: an Xbox Game Pass subscription showed "Single-player campaign / Cloud saves / Steam achievements" and PC system requirements, and was categorised as "Game / Action").
- [ ] Platform is correct (example: an "EA App CD Key" labelled Steam).
- [ ] Product type (game / DLC / subscription / gift card / wallet top-up / physical product) is detected correctly and drives the product card template.
- [ ] **[MAJOR]** Price anomalies are filtered: products priced far outside the range of comparable items (e.g. an old game at €130 vs comparables at €0.20–€6.49) are hidden or reviewed. The rule lives in the import config.
- [ ] No fake "fallback" catalogue shown when the supplier API is unavailable. If the feed is down — show real unavailability, not an invented range.
- [ ] Stock and prices sync with the supplier; products the supplier doesn't have are not sold.
- [ ] Descriptions are complete (not truncated), in English, free of HTML junk and mentions of the source.

---

## 18. Vertical-specific requirements

### 18.1 E-commerce (physical goods imported from Best Buy)

The supplier's name is **not shown** anywhere on the site. That's normal — a store is not required to disclose its suppliers. But **everything stated about the product, delivery and warranty must be true** for how the store actually operates.

- [ ] **[BLOCKER]** No mentions of Best Buy or its services anywhere on the site: "Best Buy", "BestBuy", "Geek Squad", "My Best Buy", "Best Buy Protection Plan", "Totaltech", "Free shipping on orders $35+", "Store pickup", Best Buy SKUs, links to bestbuy.com. Check titles, descriptions, specs, alt texts, URL slugs, JSON seeds, metadata.
- [ ] **[BLOCKER]** Images are downloaded and stored by us, not hotlinked from Best Buy's CDN (`bbystatic.com`), with no Best Buy watermarks/badges ("Best Buy exclusive", "Deal of the Day").
- [ ] **[MAJOR]** Descriptions are rewritten in our own words (not copied from the source store). Remove the source store's promo phrases, "was/now" prices, "Open-box", "Clearance" unless true for us.
- [ ] **[BLOCKER]** Specs **match the market the product is sold in**. US-market products have US plugs (type A/B), 120V and a US warranty. If the site sells to the UK/EU:
  - don't write "UK plug" / "EU plug" if the product has a US plug;
  - state the actual plug/voltage, or exclude products unsuitable for the target market;
  - the warranty is **our store's warranty** under our Warranty Policy, not "manufacturer's US warranty" or "Best Buy protection".
- [ ] **[BLOCKER]** Delivery times and origin match real logistics. If the product ships from the US — don't write "dispatched from our UK warehouse", "same-day dispatch", "next-day delivery". State real delivery times and customs terms (who pays duties) in the Delivery Policy and on the product page.
- [ ] Prices are converted to the store's currencies without artefacts (`$` in titles, "USD" in descriptions).
- [ ] The range is up to date: discontinued models are not sold as new; new lines are present if the categories claim them.
- [ ] Stock is real (synced with the source); "Sold out" is shown honestly.
- [ ] No products prohibited in the store's country / by the bank's rules (weapons, vapes, medicines, etc. — confirm per bank **[BANK-VAR]**).

### 18.2 eSIM

- [ ] **[BLOCKER]** **The compatible devices list is up to date as of the check date.** Example (kirosim): the device list doesn't change from site to site and lacks new models. Required:
  - every **iPhone 18** model (all versions in the lineup) and **iPhone Duo** — per the client's comment;
  - all new Apple devices with eSIM (iPhone, cellular iPad) released since the last check;
  - the latest Android generations: Samsung Galaxy (S, Z Fold/Flip, eSIM-capable A series), Google Pixel, and other brands already in the list.
- [ ] Source of the list — **manufacturers' official pages** at the time of work (Apple eSIM support, Android manufacturers' pages), not a copy from an old project. Record the last-updated date in the devices config/file.
- [ ] The devices list lives in one file and is used everywhere: compatibility page, device checker, FAQ, blog.
- [ ] Honest caveats are stated: the device must be **unlocked** (not carrier-locked); some models for certain markets (e.g. mainland China, Hong Kong, Macau) may lack eSIM; how to check eSIM support (EID in settings, `*#06#`).
- [ ] Coverage countries, data amounts, validity and speed (4G/5G) are **real**, per the eSIM provider's data. "5G" only where the provider confirms it. "Unlimited" only with fair-use terms stated.
- [ ] Clearly described: when the plan validity starts (on installation / on connecting to a network in the destination), whether top-ups are possible, whether calls/SMS work (usually data only — say so).
- [ ] eSIM Refund Policy: refunds possible for **uninstalled/unactivated** eSIMs — in days; matches the FAQ.
- [ ] Installation instructions are current for the latest iOS/Android versions (menu item names).
- [ ] No plans for countries on the restricted list (section 16).

### 18.3 Skins stores (CS2 / Dota 2 / Rust / multi-game)

- [ ] The model is a **store**, not a marketplace: no Sell / Payout / Withdraw / Sellers (see section 9).
- [ ] Active states of categories and filters are correct (see section 6, coppedskins example).
- [ ] Every rarity/quality/wear filter returns products or is hidden (example: empty *Extraordinary*).
- [ ] Rarity, weapon type, wear (float), StatTrak/Souvenir on the card match the actual item.
- [ ] Honest delivery description: transfer via Steam trade offer, possible Steam trade restrictions (trade protection/hold) — stated in the Delivery Policy and FAQ; no "instant" promises if restrictions apply.
- [ ] Buyer requirements (public inventory, trade link, Steam Guard) are described.
- [ ] Steam login doesn't expose a technical Vercel URL; it returns to the main domain.
- [ ] No mentions of external marketplaces/skin suppliers.

### 18.4 Digital keys / gift cards stores

- [ ] **[BLOCKER]** Keys are delivered **only after confirmed payment** (see 7.1).
- [ ] **[BLOCKER]** Every product card: activation platform, activation region, language restrictions, edition, activation requirements (Steam/EA App/Xbox account…), expiry (for cards/subscriptions). No template attributes (section 17).
- [ ] **[BLOCKER]** No CIS/RU/"VPN Required" items (section 16).
- [ ] System requirements — **only for PC games/DLC**, not for subscriptions and cards.
- [ ] Gift cards and wallet top-ups: quantity limits per order and per customer (config), clear card region.
- [ ] No "original", "sold once", "official" claims (section 9.1). Instead — an honest guarantee: replacement or refund if a key doesn't work, with a clear procedure.
- [ ] Pre-orders — either fully implemented with terms or removed entirely (section 11).
- [ ] No mentions of the key supplier in the UI, image URLs or copy; images stored by us (section 10).

---

## 19. Repository and deployment

- [ ] **[MAJOR]** The client project's GitHub repository is **private**. A public repository exposes the client's code, architecture, integrations and business logic.
- [ ] No secrets in the repository (`.env`, API keys, supplier keys, webhook secrets); `.env*` in `.gitignore`; if a secret was ever committed — rotate it.
- [ ] The README describes the project technically, without template placeholders ("COMPANY NAME OÜ") and without statements contradicting the site (e.g. "fallback catalogue so the store always has stock to show").
- [ ] Production runs on the main domain; the technical `*.vercel.app` address redirects to the main domain (not a separate live mirror), so the site has a single address.
- [ ] `robots.txt` and `sitemap.xml` point to the main domain.
- [ ] Metadata (title, description, OG image, favicon) is project-specific.

---

## 20. Bank-dependent items and out-of-scope work

Different banks give different feedback, and "everything for everyone" can't be closed. This checklist covers what depends on the website. Below is what is **not done in code** and goes to the client if the bank requests it (hand over as a list, don't try to "fix" it on the site):

- VAT registration / VAT position (OSS) — determines the wording in 7.4.
- Proof of the actual business address.
- Company activity code in the register matching the business.
- Supplier agreement, proof of product provenance.
- UBO documents, source of wealth, business plan and projected volumes.
- Payment provider agreement, PCI DSS SAQ/AOC, ASV scan.
- Billing descriptor (the name on the customer's statement — must be recognisable, usually contains the brand).
- Answers to the bank about the developer and connected websites — provided by the client, truthfully.

**[BANK-VAR] requirements encountered so far — implement by default where it does no harm:**

| Requirement | Default |
|---|---|
| Phone or live chat in addition to email | Slot in config and layout, shown when available |
| 3DS logos (Visa Secure / Mastercard ID Check) | Only once 3DS works |
| Card logos before live payment acceptance | Show unless the bank explicitly forbids it |
| Exact refund timeframe | Always in days |
| Separate withdrawal-waiver checkbox | Always for digital goods |
| Cookie table + preference centre | Always |

---

## Final pre-handover check

- [ ] Crawler: **zero 404/500** on pages, links, images, filters (1.1).
- [ ] Forbidden-strings search: **zero matches** (1.2) — demo, placeholders, test cards, supplier names, other projects.
- [ ] Every claim on the site is true and matches the policies (0.2, 9.1, 11).
- [ ] All numbers/prices/timeframes/percentages/VAT match everywhere.
- [ ] Company details identical everywhere, no placeholders.
- [ ] Registration is multi-step, all fields saved; country dropdown driven by the restricted-countries config.
- [ ] Emails (registration, password reset, order + PDF invoice with full details) arrive.
- [ ] Currency switches and converts everywhere.
- [ ] Payment only via the provider (hosted page/fields), no native card fields, goods delivered only after confirmed payment.
- [ ] Digital goods — separate withdrawal-waiver checkbox.
- [ ] Visa / Mastercard / PCI DSS logos from `~/Desktop` — in the footer and on payment, in colour.
- [ ] Cookies: banner, preference centre, "Cookie settings" in the footer, cookie table.
- [ ] Policies: exact refund timeframe in days, unconditional card-data statement, realistic "Last updated" dates.
- [ ] No products for restricted regions, no "VPN Required"; occupied territories of Ukraine on the restricted list.
- [ ] Catalogue: correct attributes, no price anomalies, no fake fallback catalogue.
- [ ] Vertical requirements (18.x) closed: current devices for eSIM; no supplier traces and truthful specs/delivery for e-commerce; correct filters for skins; key attributes.
- [ ] Repository private, no secrets; `*.vercel.app` redirects to the main domain.
