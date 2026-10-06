# Keyrook — Design Brief: "Vault Run"

This is the implementation prompt for the engineer and the source of truth for the motion engineer. Read it top to bottom before touching code. The rules in `.claude/knowledge/DESIGN-MASTER.md`, `.claude/knowledge/WEBGL-3D-KNOWLEDGE.md`, `.claude/knowledge/CHECKLIST-QC.md` (sections 0–17, 19–20 and vertical 18.4) and `/home/claude/devtools/keyrook-common.md` still apply. Where this brief is more specific, follow this brief.

The Patinaskins brief ("Inspection Bay") is retired. Nothing from its visual language survives: no lamp line or light pool, no rarity spine, no float ruler or jaw, no trays, no Sofia Sans Condensed, Source Sans 3 or Martian Mono, no amber, no `ShoppingCart`/`Bookmark` glyphs, no ruler-band footer. Everything CS2-, Steam-trade- and SIH-specific leaves the storefront.

**Scope:** the storefront only:
- `src/app/(store)/**` and `src/components/**` except `admin`;
- `src/styles/variables.css`, `src/styles/globals.css`, `src/styles/animations.css`, `src/styles/motion.css`;
- `src/app/layout.tsx`, `src/app/fonts.css`, `src/components/layout/ThemeScript`;
- `public/` brand assets, `scripts/gen-favicons.mjs`;
- fonts and colours in `src/lib/invoice.ts`;
- the motion engine in `src/lib/motion/**`;
- the new theater in `src/components/theater/**`.

Admin (`src/app/admin/**`, `src/components/admin/**`, `src/styles/admin.css`) runs on its own `--admin-*` variables and keeps its look. After the token swap, open every admin page once in both themes and fix only what became illegible.

**House rules for the code:**
- No comments anywhere, including in the snippets you copy from this brief.
- Reuse what exists and restyle it rather than writing parallel versions: `Button`, `Field`, `Select`, `Choice`, `Plate`, `Chip`, `Tabs`, `Accordion`, `Dialog`, `Stepper`, `Pagination`, `Alert`, `ReadoutLoader`, `EmptyState`, `ConfirmDialog`, `PriceDisplay`, `QuantitySelector`, `Breadcrumbs`, `PaymentLogos`, `CartProvider`, `CurrencyProvider`, `ThemeProvider`, the motion engine and ticker in `src/lib/motion`, `pageMetadata`, `JsonLd`, `POLICY_FACTS`, `STORE_POLICY` and `COMPANY`.
- Reuse the proven game-key logic from `/home/claude/ref/keys/keyarcade` first: `lib/kinguin.ts` normalisation, `lib/catalog.ts`, checkout, the account key display and the legal content.
- Port the theater engine from `/home/claude/ref/keys/allship-ai/src/components/theater` (§12) instead of inventing a new one.
- Tokens only. No hex or rgba values in components.
- Copy lives in `messages/en/*.json` by namespace. Numbers, timings and policy facts come from `STORE_POLICY` / `POLICY_FACTS`.

---

## 1. Direction

### 1.1 Concept statement
Keyrook is a vault. Every key in the catalogue is held in a numbered safe-deposit box behind a machined steel door, and buying one is a short, legible run through that vault:
1. you choose a box;
2. the door's combination dial turns while your bank confirms the payment on a hosted card page with 3-D Secure;
3. the tumblers drop;
4. your key decrypts character by character in your account.

The interface is the hardware around that story:
- steel plates with machined edges;
- engraved labels in a wide grotesk;
- tumbler windows for every number that matters;
- a graduated dial with a green index line, the same signal green as the vault's indicator lamps and its primary actions.

Cover art is the colour of the store; the vault is quiet, cool and exact. The visitor should feel that their purchase is handled by something solid and accountable, and should be able to find a key, check its platform and region at a glance, pay, and redeem it without guessing.

The name carries it: a **rook** is the castle piece, a stronghold that holds its ground. **Key + rook** means the place where keys are kept.

### 1.2 What carries colour, what stays quiet
- **Cover art carries the colour.** Game covers are loud and varied; the vault never competes with them. Covers are never tinted, washed, blurred or overlaid with UI.
- **Signal green** is the vault's indicator lamp. It belongs to:
  - primary actions and focus rings;
  - the dial's index line;
  - lit lamps (8px circles: "in stock", "key ready", the active step);
  - the character that has just settled during a decrypt.

  It never fills a section, never sets a heading and never glows.
- **Platform colours** appear only as a 6px square pip beside the platform's name (§3.3), like a coloured enamel inlay in a brass-free steel plate. **Type colours** appear only as the text of a type tag.
- **Deals** carry no colour. A discount is an inverted plate (ink fill, page-colour text), the way a struck price is cut into a steel tag.
- Everything else is steel: blued gunmetal in the dark theme, satin nickel in the light theme, plus hairlines.

### 1.3 Signature motifs (repeat with discipline, §10)
1. **The dial.** A graduated combination ring (100 minor ticks, numerals every 10, a green index line at 12 o'clock) and its straightened form, the **dial ruler** (a horizontal tick scale with detents). It appears on:
   - the hero door (WebGL);
   - the price-band explorer (a real rotary control);
   - the checkout and registration progress (the dial ruler with detents);
   - the order timeline track and the price and year sliders;
   - the loader;
   - the 404;
   - the logo and favicon.
2. **Tumbler windows.** Mono characters sitting in recessed slots, like the number wheels of a combination lock. Numbers that matter roll into place in them: live catalogue counts, the cart count, order numbers and, most importantly, the key itself, which decrypts in tumbler windows left to right.
3. **Bolted plates.** Engraved steel plates with a round bolt head in each corner. They appear only where the store holds or proves something:
   - the hero door;
   - the key plate in the account;
   - the security ledger on the home page;
   - the company-credentials plate in the footer.

   Nowhere else.

Engraved labels (wide grotesk caps cut into the steel) are the label system, not a fourth motif.

### 1.4 Moods per theme
- **Strongroom (dark, primary, default).** The room inside the vault, after hours.
  - Blued gunmetal walls with a faint green-grey cast, deeper recesses for covers, short hard-edged ambient shadows.
  - Plates catch a 1px machined highlight on their top edge and a 1px dark lip at the bottom.
  - The signal green is the lit lamp on the door.
- **Counter Hall (light, designed counterpart).** The banking hall at midday.
  - Satin-nickel grey ground (never paper white), near-white counters (raised panels), recessed stages slightly darker than the page so covers sit in a well.
  - The green becomes a deep **banker's green** enamel (#0F7A50) used as a fill with white text, never as a light mint. This keeps it far from Chipwave's porcelain + lime.
  - Engravings flip: a light 1px highlight below the letters instead of a dark one.

### 1.5 Divergence audit (must hold on every page)
| Axis | Keyrook "Vault Run" | Inspection Bay (Patinaskins) | Console Deck / current keyarcade shop-wall | Midnight Arcade | Cartridge Club | Portfolio directions |
|---|---|---|---|---|---|---|
| Base | blued gunmetal #0F1513 dark-first; satin nickel #E3E7E4 light | neutral graphite #121315; grey studio | ice white glass; warm saturated shop wall | violet night #0E0B1E | cream #FFFCF5 | Dresser chalk + chocolate; Drop District concrete; Blueprint drafting paper; Chipwave porcelain; Aurora polar night |
| Accent | signal green #46D39A / banker's green #0F7A50, lamps only | amber indicator | signal blue + coral; saturated multi-colour | cyan + amber | orange + yellow | brass; orange-red/cobalt/yellow; blueprint blue; lime; emerald→violet gradient |
| Type | Hubot Sans (expanded) + Mona Sans + Red Hat Mono | Sofia Sans Condensed + Source Sans 3 + Martian Mono | Manrope + Inter; Anton | Space Grotesk + Inter + Silkscreen | Anton + Archivo + Archivo Black | Gloock + Commissioner; Anton; Space Grotesk; Archivo |
| Geometry | square steel (0px) + round hardware (dial, bolts, lamps, knobs) | 2px controls, 4px trays, jaw pentagon | glass tiles, soft radii; rotated stickers | rounded cards | rounded, outlined | 45° bevels; offset shadows; tight rects; glass |
| Signature | dial, tumbler windows, bolted plates | lamp, rarity spine, float ruler | focus ring, tinted rails; stickers | pixel accents | bargain-bin stickers | shelf/brass; tape/ticker; title blocks/stamps; pad grid; starfield |
| Cart | `Archive` (a deposit box) + word "Cart" | `ShoppingCart` | — | — | — | `Handbag` |
| Header | two steel tiers: search-first tier + nav/status tier | one dark rig | glass bar | top strip + nav row | — | utility line + cornice |
| Footer | vault floor: platform index, four columns, bolted credentials plate, light logo strip | ruler band + mono sheet | — | — | — | chocolate plinth |
| Product card | deposit box: 3:4 recessed cover, engraved label row, tumbler price | tray with spine and lamp | glass tile | 8:7 bordered card | 3:4 outlined | — |

**Banned here because a sibling owns them, or because they would make the store read as a generic gaming template:**
- sticker badges and rotated tags; tape rules, tickers, index numerals as section openers;
- title blocks, stamps, registration/crop marks, millimetre grids;
- glass panels, backdrop blur, blurred cover backdrops (keyarcade's fix);
- gradients as decoration, glow of any kind, neon-on-black;
- hard offset shadows, pills;
- the lamp line or pool, rarity spines, jaws, the ruler band;
- pixel fonts, angled sci-fi panels, scanlines;
- a full-screen "matrix rain" of characters.

The green must never read as a terminal: no green text paragraphs, no green-on-black mono blocks, no blinking cursors.

---

## 2. Token plumbing

### 2.1 Where tokens live
- `src/styles/variables.css` holds the CSS custom properties. It is the single source of colour, radius, shadow, font stacks and motion timings.
- `src/styles/globals.css` holds the Tailwind v4 `@theme inline` block that turns those variables into utilities. Tailwind compiles from this block only.
- `tailwind.config.ts` mirrors the aliases. `globals.css` has no `@config`, so Tailwind does not read it; update it anyway so tools that read it stay in sync.
- `ThemeScript` sets `data-theme="light|dark"` and the `dark` class on `<html>` before paint. `@custom-variant dark ([data-theme="dark"] &)` stays.
- `:root` holds the **dark** values (Strongroom) and `[data-theme="light"]` overrides with Counter Hall, as in Patinaskins. When nothing valid is stored, the fallback stays `"dark"`.

### 2.2 Keep every existing alias name, change what it points to
Approximate storefront usage today:

| Alias | Uses |
|---|---|
| `text-ink*` | ~330 |
| `text-ink-muted` | 233 |
| `border-line` | 143 |
| `data` | ~200 |
| `eyebrow` | 55 |
| `bg-raised` | 34 |
| `bg-brand` | 30 |
| `bg-surface` | 29 |
| `border-control` | 21 |
| `bg-surface-1` | 20 |
| `label-caps` | 12 |
| `border-rule` | 8 |
| `text-on-brand` | 8 |
| `bg-rig` | 5 |
| `bg-floor` | 2 |

The names stay so everything compiles on day one; the values change.

| Existing variable | Utility alias | New meaning |
|---|---|---|
| `--color-bg` | `bg-surface` | the vault room (page canvas) |
| `--color-bg-secondary` | `bg-surface-1` | band (alternating sections, disabled fills) |
| `--color-bg-tertiary` | `bg-surface-2` | inset (wells, skeletons, dial track, tumbler slots) |
| `--color-bg-warm` | `bg-surface-warm` | → `--color-accent-light` (green-tinted note box) |
| `--color-raised` | `bg-raised` | panels, inputs, popovers, the cart drawer |
| `--color-stage` | `bg-stage` | the cover recess (cover wells in cards, PDP, cart rows) |
| `--color-on-stage` | `text-on-stage` | = ink |
| `--color-surface-dark` | — | = inset in dark, ink in light |
| `--color-rig` | `bg-rig` | header tiers and the vault map |
| `--color-floor` | `bg-floor` | footer |
| `--color-text` | `text-ink` | ink |
| `--color-text-secondary` | `text-ink-muted` | muted ink |
| `--color-text-tertiary` | `text-ink-subtle` | faint ink (≥4.5:1 everywhere text may sit) |
| `--color-accent` | `bg-brand`, `border-brand` | signal green (fill) |
| `--color-accent-hover` | `bg-brand-hover` | green hover |
| `--color-accent-light` | `bg-brand-soft` | green tint for hover and selected rows |
| `--color-on-accent` | `text-on-brand` | text on green |
| `--color-accent-ink` | `text-accent-ink` | green as text (links on hover, active counts) |
| `--color-accent-edge` | `border-accent-edge` | 1px edge on green buttons (light theme) |
| `--color-accent-2` | `bg-brand-2` | → `--color-steel-hi` (machined highlight; dial ticks on posters; non-text) |
| `--color-accent-3` | `text-sale` | → `--color-text` (deals are an inverted plate, §8.12) |
| `--color-rule` | `border-rule`, `bg-rule` | strong 1px rule (dial ruler baseline, table heads, active tab) |
| `--color-border` | `border-line` | hairline |
| `--color-border-hover` | `border-line-hover` | stronger hairline |
| `--color-border-control` | `border-control` | control borders (≥3:1) |
| `--color-focus` | `outline-focus` | green focus ring (accent-ink in light) |
| `--radius-*` | `rounded-*` | all `0` (§5.3); `--radius-pill` becomes 0 |
| `--shadow-card`, `--shadow-card-hover` | `shadow-card*` | machined edge at rest; drawer pulled |
| `--shadow-lg`, `--shadow-xl`, `--shadow-panel*` | | popovers, dialogs, drawers |
| `--rarity-*`, `--rarity`, `--mark-*` | `*-rarity-*`, `*-mark-*` | **delete** (no rarity in this store) |
| `--lamp-*`, `--stage-lamp`, `--color-lamp`, `--lamp-catch` | `bg-lamp`, `shadow-lamp-catch` | **delete**; the lamp idea is replaced by the 8px LED (`--color-lamp-on/off`) |
| `--spine`, `--lamp-inset` | | **delete** |
| `--z-tray-item` | | rename to `--z-box-item` (same value) |

### 2.3 New names (add to `variables.css` and `@theme inline`)
| Variable | Utility | Job |
|---|---|---|
| `--color-plate` | `bg-plate` | machined steel plate: buy box, key plate, theater bezel, lockers, bolted plates, product-card body |
| `--color-steel-hi` | `bg-steel-hi`, `text-steel-hi` | non-text machined highlight, dial ticks on the door poster |
| `--color-lamp-on` | `bg-lamp-on` | lit LED (= accent) |
| `--color-lamp-off` | `bg-lamp-off` | unlit LED body (always drawn with a 1px `--color-border-control` ring) |
| `--color-deal` / `--color-on-deal` | `bg-deal`, `text-on-deal` | inverted discount plate (= ink / = bg) |
| `--steel-grain` | `steel-grain` (custom `@utility`, sets `background-image`) | **the only gradient token.** A brushed-steel hairline texture for the three hardware faces: door poster, key plate, credentials plate |
| `--edge-machined` | `shadow-machined` | 1px top highlight + 1px bottom lip, inset (plates, buttons, cards) |
| `--edge-machined-pressed` | `shadow-machined-pressed` | the same inverted (pressed key) |
| `--engrave` | `text-shadow-engrave` (custom utility) | 1px text shadow that makes labels read as cut into steel |
| `--bolt` | | bolt-head diameter (6px; 8px on the door poster and the key plate) |
| `--platform-*` and `--platform` | `bg-platform`, `text-platform` | platform pips (§3.3) |
| `--type-*` and `--type` | `text-type` | type-tag text (§3.3) |
| `--color-success-tint` … `--color-info-tint`, `--color-on-danger` | `bg-*-tint`, `text-on-danger` | status tags, alerts |
| `--color-scrim` | `bg-scrim` | modal and drawer backdrop (no blur) |
| `--color-logo-strip` | `bg-logo-strip` | the light strip behind the coloured payment logos; it does **not** flip with the theme |

The `@theme inline` additions (next to the existing aliases):

```css
@theme inline {
  --color-plate: var(--color-plate);
  --color-steel-hi: var(--color-steel-hi);
  --color-lamp-on: var(--color-lamp-on);
  --color-lamp-off: var(--color-lamp-off);
  --color-deal: var(--color-deal);
  --color-on-deal: var(--color-on-deal);
  --color-logo-strip: var(--color-logo-strip);
  --color-platform: var(--platform);
  --color-type: var(--type);
  --shadow-machined: var(--edge-machined);
  --shadow-machined-pressed: var(--edge-machined-pressed);
  --text-shadow-engrave: var(--engrave);
  --radius-round: 50%;
  --ease-latch: cubic-bezier(0.3, 0, 0.1, 1);
}

@utility steel-grain {
  background-image: var(--steel-grain);
}
```

### 2.4 Platform and type are wired by attribute, never by per-component colour logic

```css
[data-platform="steam"] { --platform: var(--platform-steam); }
[data-platform="epic"] { --platform: var(--platform-epic); }
[data-platform="ea"] { --platform: var(--platform-ea); }
[data-platform="ubisoft"] { --platform: var(--platform-ubisoft); }
[data-platform="gog"] { --platform: var(--platform-gog); }
[data-platform="battlenet"] { --platform: var(--platform-battlenet); }
[data-platform="xbox"] { --platform: var(--platform-xbox); }
[data-platform="playstation"] { --platform: var(--platform-playstation); }
[data-platform="nintendo"] { --platform: var(--platform-nintendo); }
[data-platform="rockstar"] { --platform: var(--platform-rockstar); }
[data-type="game"] { --type: var(--type-game); }
[data-type="dlc"] { --type: var(--type-dlc); }
[data-type="giftcard"] { --type: var(--type-giftcard); }
[data-type="subscription"] { --type: var(--type-subscription); }
[data-type="software"] { --type: var(--type-software); }
```

- `--platform` defaults to `var(--platform-other)` and `--type` to `var(--type-game)` on `:root`.
- One helper in `src/lib/catalog/platforms.ts` maps the supplier platform string to `{ slug, label, launcher, redeemUrl }`. It is the same table that drives §14.13.
- One helper maps the product kind to the type slug.
- Unknown platforms get `other` and the raw label, never a guessed colour.

### 2.5 Mandatory sweeps
1. **CS2 out.** Delete from the storefront:
   - `src/components/skin/*`: `FloatRuler`, `SkinStage`, `SkinTray`, `StarMark`, `SteamAccountBlock`, `TradeUrlField`, `face.ts`. `PurchaseTimeline` is rebuilt as `OrderTimeline` (§8.24). `RecentlyViewed` moves to `src/components/product/`.
   - `src/components/product/*`: `InspectionStage`, `SkinDetailTabs`, `SkinReadout`, `VariantLadder`.
   - `src/components/home/*`: all of it, rebuilt per §14.1.
   - `src/components/account/SteamDelivery`; `src/app/(store)/account/steam`.
   - The motion scenes `hero`, `inspect`, `lamp-gl`, `trays`. `lamp-gl.ts` is the starting point for the WebGL scaffold patterns (context loss, DPR cap, idle boot) used in the door scene.
2. **Rarity and lamp out.** Remove the `[data-rarity]` rules, rarity/mark/lamp tokens and their `@theme` aliases once nothing references them.
3. **Radius to zero.** Every `--radius-*` becomes `0`. Circles are drawn with the new `rounded-round` (`50%`) and only on square elements (§5.3).
4. **Text on green.** Every `text-white` or `#fff` on `bg-brand` becomes `text-on-brand`; on `bg-danger` it becomes `text-on-danger`.
5. **Hex hunt.** No hex or rgba in storefront components, including `BrandMark.tsx`, home components, theater scenes and sample covers.
6. **Copy hunt.** Grep for and remove these words: `skin`, `float`, `trade offer`, `trade URL`, `Steam account linked`, `StatTrak`, `rarity`, `exterior`, `inspect`, `bay`, `lamp`, `SIH`, `Patinaskins`, `Brasmora`.

---

## 3. Colour tokens

### 3.1 `src/styles/variables.css` — replace the colour, shadow, radius, font and motion parts with this

```css
:root {
  --color-primary: #e4ebe7;
  --color-secondary: #19211f;

  --color-bg: #0f1513;
  --color-bg-secondary: #131a18;
  --color-bg-tertiary: #090d0c;
  --color-raised: #19211f;
  --color-plate: #1e2725;
  --color-stage: #0b100f;
  --color-on-stage: #e4ebe7;
  --color-surface-dark: #090d0c;
  --color-rig: #0c110f;
  --color-floor: #080b0a;

  --color-text: #e4ebe7;
  --color-text-secondary: #a2aea9;
  --color-text-tertiary: #87948f;

  --color-accent: #46d39a;
  --color-accent-hover: #72e0b2;
  --color-accent-light: #15291f;
  --color-on-accent: #04120b;
  --color-accent-ink: #46d39a;
  --color-accent-edge: #46d39a;
  --color-bg-warm: var(--color-accent-light);
  --color-steel-hi: #c9d3cf;
  --color-accent-2: var(--color-steel-hi);
  --color-accent-3: var(--color-text);
  --color-lamp-on: var(--color-accent);
  --color-lamp-off: #2b3532;
  --color-deal: var(--color-text);
  --color-on-deal: var(--color-bg);
  --color-logo-strip: #f5f7f5;

  --color-rule: #3a4743;
  --color-border: #26302d;
  --color-border-hover: #3a4743;
  --color-border-control: #6c7a75;
  --color-focus: #46d39a;

  --color-success: #8ed8b6;
  --color-success-tint: #132520;
  --color-warning: #e9b96b;
  --color-warning-tint: #2a2215;
  --color-danger: #ff8b7d;
  --color-danger-tint: #2e1a18;
  --color-on-danger: #140807;
  --color-info: #a0c1d7;
  --color-info-tint: #16212a;

  --platform-steam: #9cc3e6;
  --platform-epic: #d3dad7;
  --platform-ea: #ff8f6b;
  --platform-ubisoft: #62b2f5;
  --platform-gog: #c99bf2;
  --platform-battlenet: #56cfe8;
  --platform-xbox: #8fd16b;
  --platform-playstation: #8ea7ff;
  --platform-nintendo: #ff7a86;
  --platform-rockstar: #f0c95a;
  --platform-other: #a2aea9;
  --platform: var(--platform-other);

  --type-game: #e4ebe7;
  --type-dlc: #b3beff;
  --type-giftcard: #f3a9c6;
  --type-subscription: #86d7e0;
  --type-software: #c9c2a8;
  --type: var(--type-game);

  --steel-grain: repeating-linear-gradient(90deg, rgb(255 255 255 / 0.018) 0 1px, transparent 1px 3px);
  --edge-machined: inset 0 1px 0 rgb(255 255 255 / 0.06), inset 0 -1px 0 rgb(0 0 0 / 0.45);
  --edge-machined-pressed: inset 0 1px 0 rgb(0 0 0 / 0.45), inset 0 -1px 0 rgb(255 255 255 / 0.04);
  --engrave: 0 1px 0 rgb(0 0 0 / 0.55);
  --bolt: 6px;

  --color-scrim: rgb(4 7 6 / 0.74);

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-card: var(--edge-machined);
  --shadow-card-hover: var(--edge-machined), 0 14px 22px -14px rgb(0 0 0 / 0.9);
  --shadow-lg: 0 0 0 1px #26302d, 0 18px 32px -18px rgb(0 0 0 / 0.8);
  --shadow-xl: 0 0 0 1px #26302d, 0 30px 60px -26px rgb(0 0 0 / 0.88);
  --shadow-accent: 0 0 0 2px #46d39a;
  --shadow-panel: -1px 0 0 #26302d, -28px 0 56px -28px rgb(0 0 0 / 0.85);
  --shadow-panel-left: 1px 0 0 #26302d, 28px 0 56px -28px rgb(0 0 0 / 0.85);

  --radius-control: 0px;
  --radius-tray: 0px;
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-2xl: 0px;
  --radius-pill: 0px;

  --max-width: 1360px;
  --header-tier-1: 64px;
  --header-tier-2: 40px;
  --header-height: 104px;
  --header-height-compact: 56px;
  --header-height-mobile: 56px;
  --gutter: 16px;

  --z-base: 0;
  --z-box-item: 1;
  --z-sticky: 40;
  --z-dropdown: 50;
  --z-drawer: 60;
  --z-modal: 70;
  --z-toast: 80;
  --z-cookie: 90;

  --font-sans: var(--font-mona), "Mona Sans Variable", "Mona Fallback", "Segoe UI", sans-serif;
  --font-display: var(--font-hubot), "Hubot Sans Variable", "Hubot Fallback", Verdana, sans-serif;
  --font-mono: var(--font-redhat-mono), "Red Hat Mono Variable", "Red Hat Mono Fallback", ui-monospace, Menlo, Consolas, monospace;

  --ease-latch: cubic-bezier(0.3, 0, 0.1, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-std: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --dur-micro: 120ms;
  --dur-ui: 180ms;
  --dur-panel: 260ms;
  --dur-panel-close: 200ms;
  --dur-reveal: 640ms;
  --dur-tumbler: 520ms;
  --dur-reduced: 120ms;

  --selection-bg: #46d39a;
  --selection-fg: #04120b;

  color-scheme: dark;
}

@media (min-width: 640px) {
  :root {
    --gutter: 24px;
  }
}

@media (min-width: 1024px) {
  :root {
    --gutter: 40px;
  }
}

[data-theme="light"] {
  --color-primary: #0f1513;
  --color-secondary: #f5f7f5;

  --color-bg: #e3e7e4;
  --color-bg-secondary: #d9dedb;
  --color-bg-tertiary: #cdd3d0;
  --color-raised: #f5f7f5;
  --color-plate: #ecefed;
  --color-stage: #d2d8d5;
  --color-on-stage: #0f1513;
  --color-surface-dark: #0f1513;
  --color-rig: #f5f7f5;
  --color-floor: #d5dad7;

  --color-text: #0f1513;
  --color-text-secondary: #3e4945;
  --color-text-tertiary: #505b57;

  --color-accent: #0f7a50;
  --color-accent-hover: #0a6642;
  --color-accent-light: #d2e6dc;
  --color-on-accent: #ffffff;
  --color-accent-ink: #0a6642;
  --color-accent-edge: #0a6642;
  --color-steel-hi: #ffffff;
  --color-lamp-off: #b7c0bc;

  --color-rule: #a3ada9;
  --color-border: #c3cac7;
  --color-border-hover: #a3ada9;
  --color-border-control: #6b7773;
  --color-focus: #0a6642;

  --color-success: #156a49;
  --color-success-tint: #d3e6dc;
  --color-warning: #80500c;
  --color-warning-tint: #f0e2cc;
  --color-danger: #a62a20;
  --color-danger-tint: #f3dcd8;
  --color-on-danger: #ffffff;
  --color-info: #2e5672;
  --color-info-tint: #d6e0e8;

  --platform-steam: #24557f;
  --platform-epic: #2e3533;
  --platform-ea: #a3361a;
  --platform-ubisoft: #14589c;
  --platform-gog: #6e2f9e;
  --platform-battlenet: #0b6478;
  --platform-xbox: #2d6b12;
  --platform-playstation: #2d48b8;
  --platform-nintendo: #b0202f;
  --platform-rockstar: #705500;
  --platform-other: #3e4945;

  --type-game: #0f1513;
  --type-dlc: #3a47a8;
  --type-giftcard: #962e5b;
  --type-subscription: #0e6670;
  --type-software: #5b5236;

  --steel-grain: repeating-linear-gradient(90deg, rgb(15 21 19 / 0.025) 0 1px, transparent 1px 3px);
  --edge-machined: inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -1px 0 rgb(15 21 19 / 0.12);
  --edge-machined-pressed: inset 0 1px 0 rgb(15 21 19 / 0.14), inset 0 -1px 0 rgb(255 255 255 / 0.7);
  --engrave: 0 1px 0 rgb(255 255 255 / 0.8);

  --color-scrim: rgb(15 21 19 / 0.48);

  --shadow-card-hover: var(--edge-machined), 0 16px 24px -16px rgb(15 21 19 / 0.35);
  --shadow-lg: 0 0 0 1px #c3cac7, 0 18px 32px -20px rgb(15 21 19 / 0.3);
  --shadow-xl: 0 0 0 1px #c3cac7, 0 30px 60px -28px rgb(15 21 19 / 0.38);
  --shadow-accent: 0 0 0 2px #0a6642;
  --shadow-panel: -1px 0 0 #c3cac7, -28px 0 56px -28px rgb(15 21 19 / 0.32);
  --shadow-panel-left: 1px 0 0 #c3cac7, 28px 0 56px -28px rgb(15 21 19 / 0.32);

  --selection-bg: #0f7a50;
  --selection-fg: #ffffff;

  color-scheme: light;
}

::selection {
  background: var(--selection-bg);
  color: var(--selection-fg);
}
```

### 3.2 Measured contrast: text, controls and semantics
These are WCAG 2.x relative-luminance ratios (sRGB linearisation, `(L1 + 0.05) / (L2 + 0.05)`), computed by script for these exact hex pairs. Any change to a token must be re-measured the same way. Text needs 4.5:1. Non-text (control borders, focus rings, lamps, pips) needs 3:1.

| Pair | Strongroom (dark) | Counter Hall (light) |
|---|---|---|
| ink / bg | 15.25 | 14.79 |
| ink / band | 14.58 | 13.56 |
| ink / raised | 13.56 | 17.16 |
| ink / plate | 12.63 | 15.95 |
| ink / plate under steel grain (worst case) | 11.83 | 15.21 |
| ink / stage | 15.83 | 12.77 |
| ink / header (rig) | 15.72 | 17.16 |
| ink / footer (floor) | 16.32 | 13.05 |
| ink / accent-light (hover and selected fill) | 12.66 | 14.15 |
| muted / bg | 8.06 | 7.49 |
| muted / band | 7.71 | 6.87 |
| muted / raised | 7.17 | 8.69 |
| muted / plate | 6.68 | 8.08 |
| muted / stage | 8.37 | 6.47 |
| muted / floor | 8.62 | 6.61 |
| muted / accent-light | 6.69 | 7.17 |
| faint / bg | 5.86 | 5.65 |
| faint / band | 5.61 | 5.18 |
| faint / raised | 5.21 | 6.56 |
| faint / plate | 4.86 | 6.10 |
| faint / stage | 6.08 | 4.88 |
| faint / floor | 6.27 | 4.99 |
| faint / inset | 6.20 | 4.65 |
| on-accent / accent (primary button) | 10.07 | 5.36 |
| on-accent / accent-hover | 11.87 | 7.02 |
| accent-ink (green text) / bg | 9.71 | 5.62 |
| accent-ink / band | 9.29 | 5.15 |
| accent-ink / raised | 8.64 | 6.52 |
| accent-ink / plate | 8.05 | 6.06 |
| accent-ink / accent-light | 8.07 | 5.38 |
| deal plate: bg text on ink fill | 15.25 | 14.79 |
| accent fill / bg (non-text) | 9.71 | 4.29 |
| accent fill / plate (non-text) | 8.05 | 4.63 |
| accent-edge / bg (non-text) | 9.71 | 5.62 |
| lamp on / plate (non-text) | 8.05 | 4.63 |
| control border / bg (non-text) | 4.11 | 3.73 |
| control border / band | 3.94 | 3.42 |
| control border / raised | 3.66 | 4.32 |
| control border / plate | 3.41 | 4.02 |
| focus ring / bg | 9.71 | 5.62 |
| focus ring / raised | 8.64 | 6.52 |
| focus ring / plate | 8.05 | 6.06 |
| focus ring / stage | 10.08 | 4.85 |
| focus ring / band | 9.29 | 5.15 |
| success / bg | 11.12 | 5.27 |
| success / tint | 9.63 | 5.05 |
| success / plate | 9.22 | 5.69 |
| warning / bg | 10.22 | 5.48 |
| warning / tint | 8.68 | 5.36 |
| danger / bg | 8.13 | 5.66 |
| danger / raised | 7.23 | 6.56 |
| danger / tint | 7.24 | 5.39 |
| info / bg | 9.77 | 6.25 |
| info / tint | 8.64 | 5.83 |
| on-danger / danger | 8.66 | 7.06 |

Extra checks:
- **Unlit lamp.** The unlit lamp body (`--color-lamp-off`) is only 1.21 (dark) / 1.61 (light) against the plate. It is therefore always drawn with a 1px `--color-border-control` ring (3.41 / 4.02), and the state it shows is always also written in words ("In stock", "Key ready", "Step 2 of 3").
- **Decrypt animation.** Transient characters are `--color-text-secondary` (≥6.68 on the plate in both themes). The character that has just settled flashes `--color-accent-ink` (8.05 / 6.06) for 120ms, then turns ink. Every frame passes AA.

### 3.3 Measured contrast: platform pips and type tags
Pips are non-text (3:1 needed). Every value nevertheless clears 4.5:1 on every surface where a tag can sit, so the same colour may be used for the platform name in the filter list if the lead wants it. Type colours are used as tag text, so 4.5:1 is required.

| Token | Label | Dark hex | on bg | on band | on raised | on plate | on stage | Light hex | on bg | on band | on raised | on plate | on stage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `--platform-steam` | Steam | `#9CC3E6` | 9.99 | 9.56 | 8.89 | 8.28 | 10.37 | `#24557F` | 6.27 | 5.75 | 7.28 | 6.76 | 5.42 |
| `--platform-epic` | Epic Games | `#D3DAD7` | 13.00 | 12.43 | 11.56 | 10.77 | 13.49 | `#2E3533` | 10.05 | 9.22 | 11.66 | 10.84 | 8.68 |
| `--platform-ea` | EA app | `#FF8F6B` | 8.26 | 7.90 | 7.35 | 6.85 | 8.58 | `#A3361A` | 5.42 | 4.97 | 6.29 | 5.85 | 4.69 |
| `--platform-ubisoft` | Ubisoft Connect | `#62B2F5` | 8.10 | 7.75 | 7.20 | 6.71 | 8.41 | `#14589C` | 5.79 | 5.31 | 6.71 | 6.24 | 5.00 |
| `--platform-gog` | GOG | `#C99BF2` | 8.32 | 7.95 | 7.39 | 6.89 | 8.63 | `#6E2F9E` | 6.56 | 6.02 | 7.61 | 7.08 | 5.67 |
| `--platform-battlenet` | Battle.net | `#56CFE8` | 10.10 | 9.66 | 8.98 | 8.37 | 10.49 | `#0B6478` | 5.41 | 4.96 | 6.28 | 5.83 | 4.67 |
| `--platform-xbox` | Xbox | `#8FD16B` | 10.11 | 9.68 | 8.99 | 8.38 | 10.50 | `#2D6B12` | 5.22 | 4.78 | 6.05 | 5.63 | 4.51 |
| `--platform-playstation` | PlayStation | `#8EA7FF` | 8.02 | 7.67 | 7.13 | 6.65 | 8.33 | `#2D48B8` | 6.16 | 5.65 | 7.14 | 6.64 | 5.32 |
| `--platform-nintendo` | Nintendo | `#FF7A86` | 7.37 | 7.05 | 6.55 | 6.11 | 7.65 | `#B0202F` | 5.44 | 4.98 | 6.30 | 5.86 | 4.69 |
| `--platform-rockstar` | Rockstar | `#F0C95A` | 11.62 | 11.11 | 10.33 | 9.63 | 12.06 | `#705500` | 5.63 | 5.16 | 6.53 | 6.07 | 4.86 |
| `--platform-other` | Other / unknown | `#A2AEA9` | 8.06 | 7.71 | 7.17 | 6.68 | 8.37 | `#3E4945` | 7.49 | 6.87 | 8.69 | 8.08 | 6.47 |
| `--type-game` | Base game | `#E4EBE7` | 15.25 | 14.58 | 13.56 | 12.63 | 15.83 | `#0F1513` | 14.79 | 13.56 | 17.16 | 15.95 | 12.77 |
| `--type-dlc` | DLC | `#B3BEFF` | 10.31 | 9.87 | 9.17 | 8.55 | 10.71 | `#3A47A8` | 6.35 | 5.83 | 7.37 | 6.85 | 5.49 |
| `--type-giftcard` | Gift card | `#F3A9C6` | 9.94 | 9.51 | 8.84 | 8.24 | 10.32 | `#962E5B` | 5.92 | 5.43 | 6.87 | 6.39 | 5.12 |
| `--type-subscription` | Subscription | `#86D7E0` | 11.27 | 10.78 | 10.02 | 9.34 | 11.70 | `#0E6670` | 5.33 | 4.89 | 6.19 | 5.75 | 4.61 |
| `--type-software` | Software | `#C9C2A8` | 10.35 | 9.90 | 9.20 | 8.57 | 10.74 | `#5B5236` | 6.22 | 5.70 | 7.21 | 6.70 | 5.37 |

**Why these are not the brands' own colours.** Brand hexes fail on one theme or the other: Xbox `#107C10` measures 3.2 on the Strongroom bg, Steam's `#1B2838` and Epic's black are invisible on it, and Steam's light `#C7D5E0` disappears on Counter Hall. Each token keeps the brand's hue family, lifted for dark and deepened for light.

Where the brand hues collide (Steam, Ubisoft, Battle.net and PlayStation are all blues), the set spreads them apart:
- Steam takes a desaturated steel blue;
- Battle.net takes cyan;
- Ubisoft takes azure;
- PlayStation takes periwinkle.

The platform's **name is always printed next to the pip**, so colour is never the only cue.

**Xbox green and signal green** have the same lightness (ratio 1.04 between them). They are kept apart by shape and role:
- a platform pip is a **6px square** and appears only beside a platform name;
- a lamp is an **8px circle** and appears only as a state indicator;
- green fills appear only on actions.

### 3.4 Colour rules
- **Signal green appears only on:**
  - primary buttons;
  - focus rings;
  - lit lamps;
  - the dial index line and the active detent;
  - the 2px active bar on tabs, nav and filters;
  - the just-settled decrypt character;
  - selection.

  Count the green elements in any viewport: if more than four non-button greens show, remove some.
- **Platform colour appears only as:**
  - the 6px square pip in a platform plate;
  - the pip on a locker door;
  - the pip on a filter row.

  It never appears as a border round a card, a background wash, a tinted cover or a text colour for anything but the platform's own name.
- **Type colour appears only as** the text of a type tag ("DLC", "Gift card", "Subscription", "Software"). Base games carry no type tag on cards; the PDP prints "Base game" in ink.
- **Semantic colours** (success, warning, danger, info) appear only in status contexts, always with an icon and a word: form errors, alerts, the order timeline, key status, toasts. They never sit on product cards, so Nintendo red and danger red never meet.
- **Deals:** the inverted plate (`--color-deal` fill, `--color-on-deal` text) with the percentage in mono. The struck "was" price is `--color-text-tertiary` with `line-through`. Never red, never green.
- **Hairlines:** `--color-border` hairlines are decorative and never the only boundary of a control. Controls use `--color-border-control`.
- **Green on light:** in Counter Hall, green is a fill. Green text uses `--color-accent-ink`, and primary buttons get a 1px `--color-accent-edge` border.
- **Steel grain:** `--steel-grain` is used only on the hero door poster, the key plate and the footer credentials plate. Text on it measured ≥11.8:1. It is the only gradient in the system.

---

## 4. Typography

### 4.1 Packages and loading
Verified with `npm view` (all 5.3.0) and inspected with fontTools in the latin subsets:

- **`@fontsource-variable/hubot-sans`: display and engraved labels.** Axes: `wdth` 75–125, `wght` 200–900.
  - At `wdth` 112.5–125 it is a wide, squared-round grotesk: the lettering cut into vault doors, safe-deposit plates and dial rings. Its O is a rounded rectangle, like a machined slot.
  - It is used only expanded (≥112.5) and heavy (≥600), for headlines, buttons, nav, the wordmark and engraved micro-labels.
- **`@fontsource-variable/mona-sans`: body and UI.** Axes: `wdth` 75–125, `wght` 200–900; only `wdth` 100 is used.
  - A calm industrial grotesk with good 16px legibility.
  - Hubot and Mona were drawn as a pair: same 1000 upm, ascender 1090, descender 320, cap height 729, x-height 515/517. An engraved label and a body line therefore sit on one baseline grid, and swapping faces inside a row costs no vertical shift.
  - Treat Hubot + Mona as **one grotesk superfamily**. Contrast between them comes from width and geometry: expanded and squared for Hubot, normal and humanist for Mona.
- **`@fontsource-variable/red-hat-mono`: the data voice.** Axis: `wght` 300–700.
  - Its default **zero is slashed** and 1/I/l are fully distinct (rendered and checked). That matters more here than anywhere: a customer must never misread `0O` or `1Il` in a key.
  - It is used for prices, keys, counts, order numbers, dates, durations and tumbler windows. It never sets sentences.

Not used, and why:
- Martian Mono, Sofia, Source Sans: Patinaskins owns them.
- JetBrains Mono, Space Grotesk, Inter, Manrope, Archivo, Anton, Silkscreen: siblings own them.
- Science Gothic (Bank Gothic revival): sci-fi connotation.
- Azeret, Chivo, Spline, IBM Plex Mono: their zero is not slashed.

**Install:** `@fontsource-variable/hubot-sans`, `@fontsource-variable/mona-sans`, `@fontsource-variable/red-hat-mono`, plus the static `@fontsource/mona-sans` (400, 600) and `@fontsource/red-hat-mono` (500) for the PDF invoice (verify they exist with `npm view`; if not, convert the variable files with fontTools' instancer in a build script).

**Uninstall:** `@fontsource-variable/sofia-sans-condensed`, `@fontsource-variable/source-sans-3`, `@fontsource-variable/martian-mono` and their static packages. Delete `public/fonts/*` from Patinaskins.

`src/app/layout.tsx` imports:

```ts
import "@fontsource-variable/hubot-sans/wdth.css";
import "@fontsource-variable/mona-sans/wght.css";
import "@fontsource-variable/red-hat-mono/wght.css";
import "./fonts.css";
```

- `hubot-sans/wdth.css` is needed because the display face runs at `font-stretch: 112.5%–125%`. Its latin file is 93 KB.
- `mona-sans/wght.css` is used because body text runs only at width 100. Its latin file is 40 KB instead of 98 KB.
- Red Hat Mono's latin file is 22 KB.
- Preload the Hubot latin `wdth` woff2 only. It sets the hero H1, which is the LCP element. Copy that one file to `public/fonts/hubot-sans-latin-wdth-normal.woff2` and preload it, as Patinaskins did with its display face.

`src/app/fonts.css`:

```css
:root {
  --font-hubot: "Hubot Sans Variable";
  --font-mona: "Mona Sans Variable";
  --font-redhat-mono: "Red Hat Mono Variable";
}

@font-face {
  font-family: "Hubot Fallback";
  src: local("Verdana Bold"), local("DejaVu Sans Bold"), local("Verdana"), local("DejaVu Sans");
  size-adjust: 106%;
  ascent-override: 103%;
  descent-override: 30%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Mona Fallback";
  src: local("Arial"), local("Liberation Sans"), local("Helvetica");
  size-adjust: 102.6%;
  ascent-override: 106%;
  descent-override: 31%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Red Hat Mono Fallback";
  src: local("Menlo"), local("DejaVu Sans Mono"), local("Consolas");
  size-adjust: 100%;
  ascent-override: 102%;
  descent-override: 30.5%;
  line-gap-override: 0%;
}
```

The override values are starting points derived from measured metrics:

| Face | Avg advance (em) | Compared with |
|---|---|---|
| Mona at wdth 100 / wght 400 | 0.497 | Liberation Sans 0.484 |
| Hubot at 112.5 / 700 | 0.575 | DejaVu Sans 0.542 |
| Red Hat Mono | 0.600 | DejaVu Sans Mono 0.602 |

Ascender and descender are 1090/320 for Hubot and Mona, 1018/305 for Red Hat Mono. Tune in Playwright until swapping shifts the hero H1, a body paragraph and a price by less than 2px.

**Weights:**
- Hubot: 600 (engraved micro-labels, H3), 680 (buttons, nav, H2), 760 (H1, hero, wordmark).
- Mona: 400 (body), 560 (UI labels, emphasis), 640 (product titles in cards, table heads).
- Red Hat Mono: 400 (readouts), 500 (keys, tumblers), 600 (prices, totals).

Set `font-synthesis: none` globally.

**Widths:**
- Hubot H1/H2 at `font-stretch: 112.5%`.
- Hubot buttons, nav, micro-labels and the wordmark at `125%`.
- Mona always at `100%`.

**Numbers:**
- Red Hat Mono is monospaced and slashed-zero by default, so prices, keys and counts are tabular.
- Mona and Hubot have `tnum`: add `font-variant-numeric: tabular-nums` (the existing `tabular` utility) where they show numbers in tables.
- Red Hat Mono has `calt`. **Turn it off in keys** (`font-feature-settings: "calt" 0`) so no contextual alternate ever changes a character's shape.

**Glyph coverage** (checked in the latin subset files):
- None of the three has `→`, `↗`, `✓`, `★` or `№`. Arrows are Lucide `ArrowRight` / `SquareArrowOutUpRight`, ticks are Lucide `Check`, and the word "No." replaces `№`.
- `·`, `–`, `—`, `×`, `€`, `£`, `™`, `°` and `…` exist in all three.

**PDF invoices** (`src/lib/invoice.ts`):
- Body: Mona 400/600. Invoice number, keys and amounts: Red Hat Mono 500. Wordmark: Hubot 760 at 125%, embedded as an SVG path instead of a font.
- Colours: ink `#0F1513`, muted `#3E4945`, rule `#A3ADA9`, and the green index line `#0F7A50` in the wordmark.
- Invoices are always light. They never print key codes, only "Key delivered to your account on {date}".

### 4.2 Modular scale: ratio 1.2 (minor third), base 16px
Wide display faces look much bigger than their size, so a modest ratio keeps headings from swallowing the page; the hero takes its drama from a separate display step. Mona's x-height (0.517) reads well at 16px.

```css
@theme inline {
  --text-step--2: 0.75rem;
  --text-step--1: 0.8125rem;
  --text-step-0: 1rem;
  --text-step-1: clamp(1.125rem, 1.08rem + 0.2vw, 1.2rem);
  --text-step-2: clamp(1.25rem, 1.15rem + 0.45vw, 1.44rem);
  --text-step-3: clamp(1.4375rem, 1.25rem + 0.85vw, 1.728rem);
  --text-step-4: clamp(1.625rem, 1.35rem + 1.35vw, 2.074rem);
  --text-step-5: clamp(1.875rem, 1.45rem + 2.05vw, 2.488rem);
  --text-step-6: clamp(2.125rem, 1.5rem + 3.05vw, 2.986rem);
  --text-display-xl: clamp(2.5rem, 0.9rem + 6.4vw, 5.5rem);
  --text-ui-md: 0.9375rem;
  --text-ui-sm: 0.875rem;
  --text-ui-xs: 0.8125rem;
  --text-data: 0.875rem;
  --text-data-sm: 0.75rem;
  --text-key: clamp(1.125rem, 1rem + 0.6vw, 1.5rem);
}
```

| Role | Face | Size token | Leading | Tracking | Case / width |
|---|---|---|---|---|---|
| Home hero H1 | Hubot 760 | display-xl | 0.92 | -0.02em | sentence, wdth 112.5 |
| Landing H1 (how activation works, about) | Hubot 740 | step-6 | 0.98 | -0.015em | sentence, wdth 112.5 |
| Store H1 (catalogue, product title, account) | Hubot 700 | step-5 | 1.04 | -0.01em | sentence, wdth 112.5 |
| H2 section | Hubot 680 | step-4 | 1.06 | -0.01em | sentence, wdth 112.5 |
| H3 / panel title | Hubot 600 | step-2 | 1.15 | 0 | sentence, wdth 112.5 |
| Engraved micro-label, eyebrow, column head | Hubot 600 | data-sm (12px) | 1.2 | 0.12em | UPPERCASE, wdth 125, `text-shadow: var(--engrave)` |
| Product title in a card | Mona 640 | step-0 | 1.3 | 0 | as named, 2 lines max |
| Lead paragraph | Mona 400 | step-1 | 1.5 | 0 | sentence |
| Body | Mona 400 | step-0 (16px) | 1.6 | 0 | sentence |
| UI label, form label | Mona 560 | ui-md (15px) | 1.3 | 0 | sentence |
| Meta, captions, breadcrumbs | Mona 400 | ui-sm (14px) | 1.45 | 0.005em | sentence |
| Navigation links, buttons | Hubot 680 | ui-sm / 15px / 16px | 1 | 0.06em | UPPERCASE, wdth 125 |
| Price in a card | Red Hat Mono 600 | step-1 | 1.1 | -0.01em | — |
| Price in the buy box | Red Hat Mono 600 | step-4 | 1.0 | -0.02em | — |
| Order total | Red Hat Mono 600 | step-2 | 1.05 | 0 | — |
| Key code | Red Hat Mono 500 | text-key | 1.2 | 0.08em | UPPERCASE as issued, `calt` off |
| Readouts (counts, IDs, dates, durations) | Red Hat Mono 400 | data (14px) | 1.4 | 0 | — |
| Tumbler numerals (hero readout, cart count) | Red Hat Mono 500 | step-3 / 12px | 1 | 0 | — |

Rules:
- Mono is for data only, never for sentences.
- Uppercase is for Hubot labels, buttons and nav only. Headings are sentence case.
- Reading blocks (policies, FAQ answers, how activation works, product description) are capped at `68ch`.
- Minimum sizes: body 16px, meta 14px, micro-labels 12px.

### 4.3 Global base rules in `globals.css`
- `body`: `var(--font-sans)`, `1rem`, line-height 1.6, `font-stretch: 100%`, `var(--color-bg)`, `var(--color-text)`.
- `h1–h6`: `var(--font-display)`, `font-stretch: 112.5%`, weights from §4.2, `font-synthesis: none`, `text-wrap: balance`.
- `p`: `text-wrap: pretty`.
- `@utility eyebrow` becomes the **engraved label**: Hubot 600, 0.75rem, uppercase, 0.12em tracking, `font-stretch: 125%`, `--color-text-secondary`, `text-shadow: var(--engrave)`.
- `@utility label-caps`: Hubot 680, uppercase, 0.06em, `font-stretch: 125%`.
- `@utility data`: Red Hat Mono 400, 0.875rem, line-height 1.4.
- `@utility data-compact` is retired, because Red Hat Mono has no width axis. Replace its uses with `data` plus `tracking-[-0.02em]`.
- `@utility price`: Red Hat Mono 600, letter-spacing -0.01em.
- `@utility key-code` (new): Red Hat Mono 500, `--text-key`, 0.08em, `font-feature-settings: "calt" 0`, `font-variant-ligatures: none`, `user-select: all`, `word-break: break-all`.
- `@utility tumbler` (new): Red Hat Mono 500 inside a recessed slot (see §8.21).
- Keep `@utility tabular`, `measure` (68ch), `meta`, `no-scrollbar`.
- `@utility text-shadow-engrave` (new): `text-shadow: var(--engrave)`.
- Scrollbar: thumb `--color-border-hover`, track `--color-bg-secondary`, square.
- `svg.lucide` keeps `flex-shrink: 0`; stroke rules per §7.

---

## 5. Space, layout, geometry, borders, elevation

### 5.1 Spacing
4px base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128 · 160`.

Section rhythm is deliberately uneven, and §14.1 gives every home section its own padding:
- the catalogue grid is dense (16px gaps on desktop, 10px on mobile) because comparison is the job there;
- the security strip and the deal rail are dense;
- the hero, the theater and the security ledger are generous because they are read once.

### 5.2 Layout
| Token | Value | Use |
|---|---|---|
| `--container-container` | 1360px | default content width |
| `--container-wide` | 1560px | home set-pieces, footer inner, the locker wall |
| `--container-narrow` | 1120px | checkout, account, orders |
| `--container-read` | 720px | policies, FAQ answers, activation steps |
| gutters | 16px (<640), 24px (640–1023), 40px (≥1024) | |
| grid | 12 columns, 24px gap (≥1024); 6 columns, 16px (640–1023); 4 columns, 10px (<640) | |

Breakpoints: 390 (mobile design base), 640, 840 (theater switches between phone and desktop layouts), 1024, 1280, 1536.

### 5.3 Geometry language: "square steel, round hardware"
The vault is built from two kinds of shape: plates and doors cut square from steel, and the round hardware mounted on them.
- **0px for everything rectangular:**
  - pages, bands, plates, cards, cover stages, buttons, inputs, selects, chips, tags, dialogs, drawers, toasts, the header, the footer;
  - the theater bezel, lockers, tables and images.

  A machined edge (§5.4) gives plates their finish, not a radius. There is no radius scale; every `--radius-*` is `0`.
- **Circles only for hardware, and only on square boxes:**
  - the dial and the dial loader;
  - bolt heads (`--bolt`);
  - lamps (8px LEDs);
  - radio dots;
  - the switch knob;
  - order-timeline nodes;
  - the theater's play/pause control (a round knob, 44px);
  - the avatar initials in the account header.

  `rounded-round` (`50%`) is the only rounded utility. It is used only on elements with equal width and height.
- **No pills, no chamfers, no bevels, no rotated elements.**
- Third-party payment logos keep their own rounded white cards untouched.

### 5.4 Borders, rules and machined edges
- **Hairline:** 1px `--color-border` (section dividers, table rows, card outlines).
- **Rule:** 1px `--color-rule` (dial ruler baseline, table head underline, active tab baseline).
- **Control:** 1px `--color-border-control`. Hover: `--color-text-secondary`. Focus adds the green ring. Error: 2px `--color-danger`.
- **Machined edge** (`--edge-machined`, applied as `box-shadow` inset):
  - 1px light line on the top inner edge and 1px dark lip on the bottom inner edge;
  - used on every plate, button and card;
  - pressed controls swap to `--edge-machined-pressed`.

  It is the only "3D" a control gets. No outer glow, no drop shadow at rest.
- **Bolts:** 6px circles of `--color-border-control` with a 1px inner `--color-steel-hi` highlight at 25% (top-left), 10px in from each corner. Only on the four bolted plates (§1.3).
- **Engraving:** micro-labels on plates carry `--engrave` (a 1px offset shadow). It never applies to body text or to text on green.

### 5.5 Elevation: light from above, short and hard
| Level | Token | Use |
|---|---|---|
| e0 | none | page, bands, tables, text |
| e1 | `--shadow-card` (machined edge) | cards, plates, inputs, buttons at rest |
| e2 | `--shadow-card-hover` | deposit box with its drawer pulled (hover), sticky buy bar when stuck |
| e3 | `--shadow-lg` | popovers, vault map, search dialog, toasts |
| e4 | `--shadow-xl`, `--shadow-panel` | dialogs, cart drawer, mobile vault map |

No coloured shadows, no glows, no inner glows on green.

### 5.6 Z-index
Unchanged values: `base 0 · box-item 1 · sticky 40 · dropdown 50 · drawer 60 · modal 70 · toast 80 · cookie 90`. The theater cursor and spotlight live inside the stage's own stacking context (`isolation: isolate`).

---

## 6. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 120ms | hover, press, focus, tag swaps, lamp on/off |
| `--dur-ui` | 180ms | accordions, tabs, filter groups, segmented controls, drawer pull on cards |
| `--dur-panel` | 260ms | cart drawer, vault map, dialogs, mobile sheets |
| `--dur-panel-close` | 200ms | closing panels |
| `--dur-tumbler` | 520ms | one tumbler wheel settling (counts, cart count, order number) |
| `--dur-reveal` | 640ms | landing section entrances only |
| `--dur-reduced` | 120ms | the only transition under reduced motion (opacity) |
| `--ease-latch` | cubic-bezier(0.3, 0, 0.1, 1) | anything that moves: it waits, travels, then seats firmly with no overshoot, like a bolt shooting home |
| `--ease-std` | cubic-bezier(0.4, 0, 0.2, 1) | colour and opacity |
| `--ease-in-out` | cubic-bezier(0.76, 0, 0.24, 1) | pinned scenes, door swing, camera moves |
| `--ease-out-expo` | cubic-bezier(0.16, 1, 0.3, 1) | entrances |
| dial detent (JS) | spring stiffness 420, damping 38, max overshoot 0 | price dial, hero dial rotation snapping to numerals |
| tumbler settle (JS) | per-character stagger 28ms, 3–6 intermediate glyphs, 22ms each | decrypt, counts |

Update `src/lib/motion/tokens.ts`:
- `MOTION_DURATION`: micro 120, ui 180, panel 260, panelClose 200, tumbler 520, reveal 640, reduced 120, cartFlight 400, decrypt 900, doorOpen 1800.
- `MOTION_EASE.latch`.
- `MOTION_SPRING` 420/38.
- `MOTION_DEPTH` from §13.1.
- `MOTION_STAGGER`: chars 28, rows 70, lockers 60, words 40, ticks 3.
- `MOTION_LIMITS`: lockerSwing 24°, doorSwing 108°, cardDrawer 6px, dprCap 1.5, pointerDoor 6px, decryptGlyphs 4.
- Delete `LAMP_POSE` and the inspect and tilt limits.

**Philosophy: vault mechanics.** Things move like hardware:
- a short wait, a decisive travel, a firm seat;
- bolts shoot home, tumblers drop, a door swings on a heavy hinge;
- the dial turns and clicks into detents.

Nothing bounces, floats, pulses, wobbles or glows, and nothing loops ambiently, except the theater, which is a pausable demo. Transform and opacity only.

With `prefers-reduced-motion: reduce`:
- every transition becomes an instant state change or a ≤120ms opacity fade;
- tumblers show their final value;
- the decrypt shows the key at once;
- the door poster shows the designed open state, and nothing pins;
- the theater shows still frames with the full step list;
- `scroll-behavior: smooth` is removed.

`src/styles/animations.css`: delete `tray-in`, `lamp-on`, `count-roll` and every keyframe with no consumer. Add:
- `plate-in` (translateY 10px→0 + opacity);
- `panel-in` (translateY −6px→0 + opacity);
- `tumbler-roll` (translateY 100%→0 for the incoming glyph, translateY 0→−100% for the outgoing);
- `bolt-shoot` (translateX ±4px→0, used on the key plate's bolts when a key is issued);
- `lamp-lit` (opacity 0→1 on the LED fill, 120ms).

Durations and easings come from the tokens.

---

## 7. Icons — Lucide (distinct glyph map)

- `lucide-react` 1.52 (installed). Every glyph below was verified to exist in `node_modules/lucide-react/dist/esm/icons`.
- One system: `strokeWidth={1.75}`, `strokeLinecap="square"`, `strokeLinejoin="miter"`. Set this once in a small `Icon` wrapper or in the global `svg.lucide` rule: `stroke-linecap: square; stroke-linejoin: miter; stroke-width: 1.75`. The square caps make Lucide look machined rather than friendly. Inspection Bay used round caps at 1.5.
- Sizes 14, 16, 18, 20 or 24.
- `aria-hidden` unless the icon is the only content (then the parent has an `aria-label`).
- No icon in circles or tinted squares; icons sit in text colour.
- On desktop, header actions pair icon + word.

| Job | Glyph | Job | Glyph |
|---|---|---|---|
| Cart | `Archive` (a deposit box) + the word "Cart" | Search | `Search` |
| Save / saved | `Pin` / `PinOff` ("Pinned") | Account | `UserKey` |
| Menu / vault map (mobile) | `Menu` | Close | `X` |
| Add to cart | `SquarePlus` | Remove | `Trash` |
| Quantity | `SquareMinus` / `SquarePlus` | Filters | `ListFilter` |
| Sort | `ArrowDownWideNarrow` | Disclosure | `ChevronDown` (rotates 180°) |
| Back | `ArrowLeft` | Inline link arrow | `ArrowRight` |
| External (redeem pages, platform help) | `SquareArrowOutUpRight` | Breadcrumb separator | none, a mono "/" |
| Key | `KeyRound` | Reveal / hide key | `Eye` / `EyeOff` |
| Copy / copied | `Copy` / `CopyCheck` | Replacement key | `RotateCcwKey` |
| Keys encrypted at rest | `Vault` | Hosted card page | `CreditCard` |
| 3-D Secure | `ShieldCheck` | PDF invoice | `ReceiptText` (download: `FileDown`) |
| Delivery time | `Timer` | Pending / issuing | `Hourglass` |
| Region | `EarthLock` | Languages | `Languages` |
| System requirements | `Cpu` | Activation steps | `ListOrdered` |
| Gift card | `WalletCards` | Subscription | `CalendarSync` |
| DLC | `PackagePlus` | Success | `BadgeCheck` |
| Error | `OctagonAlert` | Warning | `TriangleAlert` |
| Info | `Info` | Check | `Check` |
| Theme | `SunMoon` | Currency | none (mono "EUR") |
| Sign out | `LogOut` | Email sent | `MailCheck` |
| No cover | `ImageOff` | Help | `CircleHelp` |
| Clock / time | `Clock` | Report a problem | `MessageSquareWarning` |

Type icons (`PackagePlus`, `WalletCards`, `CalendarSync`) are used only in the vault map and on type landing headers, never on cards.

Not used, because Patinaskins or siblings own them or they are decoration:
- `ShoppingCart`, `ShoppingBag`, `ShoppingBasket`, `Handbag`;
- `Bookmark`, `Heart`, `Star`;
- `Plus`, `Trash2`, `ArrowUpRight`, `AlignRight`, `SlidersHorizontal`, `Repeat2`, `Link2`;
- `Gamepad2`, `Joystick`, `Sparkles`, `Zap`, `Flame`, `Crown`, `Gem`;
- `Package`, `Truck` (nothing physical ships);
- any brand logo glyph (Lucide 1.x ships none; platform names are text).

---

## 8. Components (all states)

General states for every interactive component:
- default;
- hover (`hover-device` variant only);
- active/pressed (the machined edge swaps to `--edge-machined-pressed` and the element moves down 1px);
- focus-visible: 2px `--color-focus` outline, 2px offset (3px on cards), square, never removed;
- disabled: `--color-text-tertiary` text, `--color-bg-secondary` fill, no hover, `cursor: not-allowed`, `aria-disabled` or `disabled`;
- loading: `aria-busy="true"`, width locked, the dial loader (§8.22) replaces the label centre.

Minimum touch target: 44×44px on touch devices.

### 8.1 Button (`src/components/ui/Button.tsx` — keep the API, restyle)
Variant mapping:

| Existing variant | New look |
|---|---|
| `primary` | **Key** (a keypad key) |
| `secondary`, `outline`, `bordered` | **Steel** |
| `tertiary`, `ghost`, `light`, `flat` | **Text** |
| `danger` | **Danger** |
| `danger-soft` | Text in danger colour |

Delete the `steam` variant.

| | Key | Steel | Text | Danger |
|---|---|---|---|---|
| Shape | 0px, fill `--color-accent`, `--edge-machined`; light adds 1px `--color-accent-edge` | 0px, fill `--color-plate`, 1px `--color-border-control`, `--edge-machined` | no box; 1px underline offset 4px on hover | 0px, fill `--color-danger`, `--edge-machined` |
| Label | Hubot 680 uppercase 0.06em, wdth 125, `--color-on-accent` | same face, `--color-text` | Mona 560 sentence case, `--color-text` | `--color-on-danger` |
| Hover | fill `--color-accent-hover` | border `--color-text`, fill `--color-raised` | underline draws in from the left (120ms) | `filter: brightness(1.05)` |
| Active | `--edge-machined-pressed`, translateY 1px | same | underline `--color-accent-ink` | same as Key |
| Focus | green ring, offset 2px | same | same | same |
| Disabled | fill `--color-bg-secondary`, text faint, no edge | border `--color-border`, text faint | faint, no underline | as Key disabled |
| Loading | label kept for width (visibility hidden), dial loader 16px centred, `aria-busy` | same | same | same |

Sizes:
- sm: 36px high, 13px label, 14px padding;
- md: 44px, 14px label, 20px padding;
- lg: 52px, 15px label, 28px padding.

Icon-only buttons are 40px square (44 on touch), transparent, hover fill `--color-raised`, required `aria-label`. `startContent`/`endContent` icons are 18px with an 8px gap.

The primary action on a page is the only Key button in its viewport region. A Key and a Steel button may sit together; two Keys may not.

### 8.2 Text inputs, textarea
- 48px high, 0px, fill `--color-raised`, 1px `--color-border-control`, `--edge-machined-pressed` (an input is a recess, not a plate), 14px horizontal padding, Mona 16px.
- Label above: Mona 560 15px, 6px gap. Required: " *" in muted plus `aria-required`.
- Hint below: 14px muted. Placeholder: faint.
- Hover: border `--color-text-secondary`. Focus: green ring (offset 2px), border unchanged.
- Error: 2px `--color-danger` border, message below in danger with `OctagonAlert` 16px, linked by `aria-describedby`, `aria-invalid="true"`.
- Disabled: fill `--color-bg-secondary`, faint text. Read-only: no border, fill `--color-bg-secondary`.
- Password: an inline 40px `Eye`/`EyeOff` button with `aria-pressed`.
- Data inputs use Red Hat Mono 400 15px for the value: price min/max, order number on contact, the key "spell-out" field. Their labels stay Mona.
- Textarea: minimum 140px, vertical resize.

### 8.3 Select
- A native `<select>` styled like an input: 48px (36px in sort, currency and toolbar spots), `appearance: none`, `ChevronDown` 16px placed 14px from the right.
- Country uses the single restricted-countries config.
- A custom listbox only for the language filter search and country search, and then the WAI-ARIA combobox pattern.

### 8.4 Checkbox, radio, switch, segmented control
- **Checkbox:** 18px square, 0px, 1.5px `--color-border-control`.
  - Checked: fill `--color-accent`, 12px `Check` in `--color-on-accent`.
  - Indeterminate: an 8×2 bar.
  - Label 10px to the right. The whole row is the hit area (44px in filter lists).
- **Radio:** 18px circle, 1.5px border. Checked: an 8px green dot (it reads as a lit lamp).
- **Switch** (cookie preferences, "On sale" filter):
  - 40×22 square track, 1px control border, a **round 16px knob** (hardware) that slides 18px.
  - On: track green, knob `--color-on-accent`. Off: track `--color-bg-tertiary`, knob `--color-text-secondary`.
  - Locked "Necessary": on and disabled, with the text "Always on".
  - `role="switch"`, `aria-checked`.
- **Segmented control** (type filter on mobile, theme in the mobile menu, theater tabs on mobile):
  - one 0px frame with a 1px control border; segments 36px high, Hubot 680 12px caps at 125%;
  - selected segment: fill `--color-plate`, `--edge-machined`, an 8px lit lamp before the label, ink text;
  - `role="radiogroup"` with arrow-key movement.

### 8.5 Engraved tags (restyle `Plate`, which replaces HeroUI `Chip` in the storefront)
All tags:
- 22px high, 0px, 0 8px padding;
- Hubot 600 11px→**12px minimum** uppercase 0.1em at `font-stretch: 125%` with `--engrave`;
- never clickable.

| Variant | Look | Use |
|---|---|---|
| `platform` | transparent, 1px `--color-border`, a 6px `var(--platform)` square pip, then the name in ink | "STEAM", "XBOX" (always the platform's own name) |
| `region` | transparent, no border, mono 12px uppercase ink | "GLOBAL", "EU", "UK", "NA" |
| `type` | transparent, 1px `--color-border`, text `var(--type)` | "DLC", "GIFT CARD", "SUBSCRIPTION", "SOFTWARE" (base games: no tag on cards) |
| `edition` | fill `--color-bg-secondary`, ink | "DELUXE EDITION", "GOTY" (only when the title carries an edition) |
| `neutral` | fill `--color-bg-secondary`, ink | "Out of stock", "Sample data" |
| `success` / `warning` / `danger` / `info` | tint fill, semantic text, a lamp-shaped 6px circle before the word | key and order statuses |
| `deal` | the inverted plate (§8.12) | "−32%" |
| `count` | fill `--color-accent`, `--color-on-accent`, mono 12px in a tumbler | cart count only |

Limits:
- at most one platform tag, one region tag and two more tags on a card;
- the label row truncates the region before the platform, never the other way round.

### 8.6 The label row (platform + region + type)
This is the quiet system every key representation carries, in one fixed order:

`[pip] STEAM   ·   GLOBAL   ·   DLC`

- Hubot engraved caps for the platform and type, mono for the region, with `·` separators in faint.
- On cards it sits directly under the cover.
- On the PDP it becomes a larger row (14px) above the H1 with the edition tag appended.
- In compact rows it is the second line.
- It is wrapped in `<p>` with an accessible text "Activates on Steam. Region: Global. Downloadable content."; the visual tokens are `aria-hidden`.

### 8.7 The lamp (LED)
- An 8px circle (`rounded-round`):
  - lit: `--color-lamp-on` fill;
  - unlit: `--color-lamp-off` fill with a 1px `--color-border-control` ring.
- No glow, no pulse, no blinking. A state change fades the fill in over 120ms (`lamp-lit`).
- **Used for:**
  - "In stock" on the buy box;
  - "Key ready" on the key plate;
  - the current node of the order timeline;
  - the selected segment;
  - the active theater tab;
  - the header status line (lit while the store takes orders).
- **Always next to a word.** Never decorative.

### 8.8 Chips (active filters)
- 32px high, 0px, fill `--color-raised`, 1px `--color-border-control`, Mona 560 14px.
- Content is the human value: "Steam", "EU", "DLC", "€10–€20", "Released 2024–2026", "On sale".
- Platform chips carry their pip.
- A 14px `X` sits inside the hit area, with `aria-label="Remove filter: Steam"`.
- Hover: ink border.
- The row ends with the Text button "Clear all".

### 8.9 Cover (`src/components/product/Cover.tsx`, new)
The single component for game art; every surface uses it.
- **Stage:** a fixed aspect box, 0px, `--color-stage`, with a 1px inset dark line on its top edge, so the cover reads as recessed into the plate.
- **Ratio:** **3:4** for cards, cart and order rows, the PDP and the vault map. This is the ratio keyarcade and Cartridge Club already use for these covers; Midnight Arcade's 8:7 wastes the portrait box art that dominates the feed.
- **Fit, decided by the cover's real proportions** (the catalogue sync stores `coverWidth` and `coverHeight` by probing each mirrored image once):
  - portrait art with an aspect between **0.68 and 0.82** fills the stage with `object-cover` (at most ~8% is cropped, from the top and bottom edges);
  - anything else (square art, 16:9 screenshots used as a fallback, unknown size) is `object-contain`, centred, on the stage with `--steel-grain` behind it, so the empty band reads as the inside of a drawer.

  **Never** a blurred, scaled copy of the image behind it (keyarcade's approach is banned here: blur), never a colour wash, never rotation.
- **No cover:** the stage shows `ImageOff` 24px muted and the platform name engraved in Hubot caps. No generated box art, no invented artwork.
- **Images:** mirrored to our own storage at sync (`src/lib/r2.ts`) and served through `next/image` with correct `sizes`:

  | Placement | `sizes` |
  |---|---|
  | card | ≈ 280px |
  | PDP | ≈ 560px |
  | compact row | 80px |

  Never hotlinked from the supplier. No supplier host appears in `remotePatterns`, alt text or metadata.
- **Alt text:** "{title} cover art".

### 8.10 The deposit box (the product card, replaces `SkinTray` and `ShelfTile`)
One `<article data-platform="steam" data-type="game">`.

**Anatomy, top to bottom:**
1. **Box:** 0px, fill `--color-plate`, 1px `--color-border`, `--shadow-card` (machined edge).
2. **Drawer face:** the Cover (§8.9) at 3:4, inset 8px from the box's top, left and right edges, so a steel frame shows around it. The drawer face is the card's main link (`/product/[slug]`), stretched over the box with a pseudo-element; Pin and Add stay separate controls.
3. **Label row** (§8.6), 12px below the cover.
4. **Title:** Mona 640 16px, 2 lines reserved.
5. **Facts line:** mono 12px muted, one line, chosen by type:
   - Game / DLC: languages as up to three codes plus a count ("EN DE FR +9"), or nothing when the feed has no language data. DLC adds "Needs the base game".
   - Gift card: "Value €20" (from the product name or a parsed value).
   - Subscription: "12 months".

   QC 18.4 requires language restrictions and expiry. The card shows what the data holds; the PDP states the rest explicitly (§8.23).
6. **Price row:**
   - left: the price (§8.11); with a discount, the struck was-price in faint above it and the deal plate (§8.12) beside it;
   - right: `Pin` (40px icon button, `aria-pressed`, "Pin {title}" / "Pinned") and **Add** (40px square Steel icon button with `SquarePlus`, `aria-label="Add {title} to cart"`).

**States:**
- **Hover / focus-within (fine pointer): the drawer pull.**
  - The cover slides up 6px inside the frame, revealing a 6px dark slot (`--color-bg-tertiary`) beneath it.
  - The box takes `--shadow-card-hover`.
  - The title gets an underline.
  - Add turns into the Key style (green fill).
  - 180ms on `--ease-latch`.
  - The focus ring wraps the whole box (offset 3px), never the cover alone.
- **In cart:** Add becomes the Text button "In cart" with `Check` 16px, linking to the cart drawer.
- **Adding:** Add shows the dial loader, then M7 (§13).
- **Out of stock:** only possible on pinned items and order history, never in catalogue results. Cover at 55% opacity, neutral tag "Out of stock" in the label row, Add removed, price muted as "Last price €12.40".
- **No cover:** the Cover fallback.
- **Skeleton:** the box with the stage in `--color-bg-tertiary`, three bars (label 72px, title 80% width, price 64px) in `--color-bg-secondary`. No shimmer. Fades to content in 120ms.

**Variants:**
- **Compact row** (cart, search dropdown, orders, vault map preview): a 60×80 cover, the label row as line 2, title 1 line, price right. Rows are separated by hairlines, not boxed.
- **Feature box** (home deal lead, platform page lead): spans 2 columns × 2 rows. The drawer face is the product's first **screenshot at 16:9** with the 3:4 cover set into its bottom-left corner as a second recessed well (34% of the width). Title in Hubot 680 step-3, full label row, facts, price at step-3.
- **Gift card blank:** a plate at 1.586:1 (the ID-1 card ratio) with:
  - the platform pip and name engraved top-left;
  - "GIFT CARD" type text;
  - the value in mono step-4 bottom-left;
  - region bottom-right;
  - no cover art unless the feed's cover is a real card image, in which case it is the drawer face at 1.586:1 with `object-contain`.
- **Subscription row:** a table row (§14.1 section 8), not a card.

**Grid:**
- 5 columns ≥1536, 4 at 1280–1535, 3 at 840–1279, 2 below 840;
- gaps 16px desktop, 10px mobile;
- no extra row gap; the boxes' own frames give rhythm.

### 8.11 Price display (`PriceDisplay` — keep, restyle)
- Red Hat Mono 600. The currency symbol comes from the currency provider at the same size; minor units at the same size (no superscript cents).
- Converted currencies show "≈" only if the charge currency differs from the displayed one. The checkout says which currency is charged (existing logic).
- Loading: a 64×18 block in `--color-bg-secondary`.

### 8.12 Deal plate
- A 22px inverted plate: fill `--color-deal` (ink), mono 600 12px "−32%" in `--color-on-deal`, 0 6px padding, 0px.
- Shown only when a real compare-at price exists and is higher (the `wasPrice` from data, never computed from anything else).
- The struck price is `--color-text-tertiary`, `line-through`, mono 400 13px, with an accessible label "Was €29.99".
- Never red, never green, never "SALE!", never a countdown.

### 8.13 Quantity (`QuantitySelector`)
- Three joined segments in one 0px frame: `SquareMinus` 40×40 | mono value 44px | `SquarePlus` 40×40.
- Maximum: the lower of `STORE_POLICY.limits.maxQtyPerItem` (game keys default 3, gift cards per config) and real stock. At the maximum the hint reads "Up to 3 per order".
- Labels "Decrease quantity" / "Increase quantity". Clamp on blur, with an `aria-live="polite"` announcement.

### 8.14 Filters (`ProductFilters`) — the "vault index"
- **Desktop:** a left column 280px, sticky under the header, on `--color-bg` (no box), groups separated by 1px hairlines.
- **Group header:** a 48px row with the engraved label (e.g. "PLATFORM"), the selected count in mono ink ("2") and `ChevronDown`. It is a button with `aria-expanded`. Panels open via grid-rows 0fr→1fr over 180ms.
- **Open by default:** Type, Platform, Price, On sale.
- Only values present in the current result set are listed, each with its real count (mono 12px muted, right-aligned).
- **Groups and controls, in order:**
  1. **Type:** checkbox rows Games, DLC, Gift cards, Subscriptions, Software, each with its type colour as a 2px underline of the label on hover only. Hidden on type pages.
  2. **Platform:** checkbox rows with the 6px pip and the name. Hidden on platform pages.
  3. **Region:** checkbox rows (Global, Europe, United Kingdom, North America; only regions the store accepts, per `catalog-types`). A one-line help text under the group: "A region-locked key activates only on accounts in that region."
  4. **Genre:** checkbox rows; a search-in-list input appears above 10 values.
  5. **Price:** two mono inputs (Min / Max in the active currency) over a **dial ruler** (§8.22) with two index-line thumbs. Ticks sit at the active currency's band boundaries (5 / 10 / 20 / 40).
  6. **Language:** a combobox with multi-select ("Interface or audio language"), listing languages present in results with counts.
  7. **Release year:** a ruled **year histogram**. One 6px-wide bar per year, height proportional to the real count, years as mono labels every 5 years, two thumbs selecting a contiguous range. Arrow keys move the thumbs by a year; Home/End jump to the ends. Each thumb is `role="slider"` with `aria-valuetext="From 2019"`.
  8. **On sale:** a switch ("Only show discounted keys" + count).
- **Above the grid:** a result sentence in mono 14px ("1,284 keys · Steam · Global · On sale") plus active chips.
- **Mobile:**
  - a sticky toolbar under the header: Steel "Filter" with the count in mono, and the sort select;
  - Filter opens a full-height sheet from the bottom (`--color-raised`, 0px) with the same groups and a sticky footer holding the Key button "Show 1,284 keys" and Text "Clear all".
- Filter state lives in the URL (existing logic); back/forward restores it.

### 8.15 Sort (`ProductSort`)
- A native select, 36px, with the inline label "Sort" as an engraved micro-label.
- Options, only those the API supports:
  - Relevance (search only);
  - Price, low to high;
  - Price, high to low;
  - Biggest discount;
  - Newest release;
  - Recently added (only if `createdAt` reflects real catalogue additions);
  - Title A–Z.

### 8.16 Pagination
- Numbers in 40px squares, mono 14px, 0px. Hover: fill `--color-raised`.
- Current: ink text with a 2px green bar along the bottom, `aria-current="page"`.
- "Previous" / "Next" are Text buttons with `ArrowLeft` / `ArrowRight`. Ellipses after 1 … n.
- Mobile: "Page 2 of 27" in mono with Previous / Next.
- Load more variant: "Showing 48 of 1,284" in mono muted, then Steel md "Load 48 more".

### 8.17 Breadcrumbs
- Mona 14px muted links, separated by a mono " / " in faint (`aria-hidden`). The current page is ink with `aria-current="page"`, inside `nav aria-label="Breadcrumb"`.
- Mobile: only the parent, as a back link with `ArrowLeft` ("Steam").
- `BreadcrumbList` JSON-LD via the existing `JsonLd`.

### 8.18 Tabs and accordion
- **Tabs** (PDP sections on desktop, account keys filter):
  - Hubot 680 uppercase 13px at 125%, 48px high, tablist on a 1px hairline;
  - active tab: ink with a 2px green bar under the full label width, sitting on a 1px `--color-rule` baseline;
  - inactive tabs muted; hover ink;
  - WAI-ARIA tabs. On mobile, PDP tabs become accordions.
- **Accordion** (FAQ, mobile filter groups, mobile footer columns, PDP sections on mobile):
  - 56px header rows, Mona 560 step-1, `ChevronDown` that rotates 180° over 180ms;
  - open panel on `--color-bg` with 20px padding; rows separated by hairlines;
  - the open row's header gets an unlit→lit lamp at its left;
  - several can be open at once.

### 8.19 Toasts
- Position: desktop bottom-right 24px; mobile top under the header, full width minus 32px.
- `--color-raised`, 0px, `--shadow-lg`, max-width 380px, a 2px left bar in the semantic colour (green for cart).
- **Cart toast:** a compact row, "Added to cart", Text "View cart" and Key sm "Checkout".
- **Status toasts:** 16px `BadgeCheck` / `OctagonAlert` / `TriangleAlert` / `Info` in the semantic colour, plus the text.
- Auto-dismiss after 5s, paused on hover/focus, close `X`. `role="status"` (`role="alert"` for errors).
- Entrance translateY 8px→0 + opacity over 180ms; reduced motion: opacity only.

### 8.20 Dialog (`Dialog`, `ConfirmDialog`, preference centre, cover zoom, report-a-problem)
- Centred, 0px, `--color-raised`, `--shadow-xl`, max-width 560px, 32px padding. Title Hubot 600 step-2.
- Close `X` top-right. Scrim `--color-scrim`, no blur.
- Focus trap, Esc, focus return, `role="dialog"`, `aria-modal`, `aria-labelledby`.
- Entrance: rise 8px + fade over 260ms on `--ease-latch`.
- Destructive dialogs: Danger on the right, Steel "Cancel" on the left.

### 8.21 Tumbler window and tumbler counter (new, `src/components/ui/Tumbler.tsx`)
**The window:**
- one glyph per slot: width `1ch + 0.32em`, height `1.45em`;
- fill `--color-bg-tertiary`, `--edge-machined-pressed` (a slot cut into the plate), a 1px `--color-border` hairline between adjacent slots;
- glyph centred in Red Hat Mono 500.

**Tumbler counter** (live counts, cart count, order numbers):
- When the value changes, each digit's wheel rolls through intermediate digits to the new one:
  - the rightmost wheel travels furthest;
  - each wheel takes `--dur-tumbler`, staggered 40ms from right to left;
  - `tumbler-roll` on `--ease-latch`.
- First render shows the value without animation, except where a motion hook (§13) explicitly animates on entering view.
- Accessibility: the container has `role="img"` or plain text with `aria-label="4,812 keys in stock"`; the rolling glyphs are `aria-hidden`; changes are announced only where a live region is specified (cart count).
- Reduced motion: the value swaps instantly.

**Separators** (commas, dashes in keys) sit outside slots as plain mono characters in muted.

### 8.22 The dial family (new, `src/components/ui/Dial*.tsx`)
**Dial loader** (replaces `ReadoutLoader` / `LoadingSpinner`):
- a 24px (16px in buttons) ring of 12 ticks in `--color-border-hover`;
- one tick is lit green and **steps** clockwise every 90ms, a discrete click like a combination dial, never a smooth spin;
- `role="status"` with hidden text "Loading";
- reduced motion: a static ring with the 12 o'clock tick lit, plus the text "Loading…".

**Dial ruler** (checkout progress, price filter, order timeline track, footer platform index underline):
- a 1px `--color-rule` baseline;
- minor ticks every 8px (4px tall, `--color-border-hover`), major ticks every fifth (8px, `--color-text-tertiary`), detents (12px, ink) with labels under them;
- the **index line**: a 2px × 14px green vertical bar standing on the baseline at the active detent. It is the ruler's cursor and every slider thumb in the store. As a thumb it sits in a 24×32 transparent hit box, which carries the focus ring as a clean rectangle;
- `aria-hidden` when decorative. As a slider: `role="slider"`, arrow keys step between detents, `aria-valuetext`.

**Rotary dial control** (home price-band explorer, §14.1 section 11):
- a ring 300px (desktop) / 232px (mobile) with 100 ticks, numerals at the band boundaries, a centre knob plate (a circle in `--color-plate` with 24 radial grip notches and `--edge-machined`), and the green index line fixed at 12 o'clock;
- turning the knob rotates the ring so the chosen band sits under the index line;
- input:
  - drag (angle from the centre, snapping to detents with the detent spring);
  - arrow keys (one detent);
  - Home/End;
  - clicking a band label around the ring;
- `role="slider"`, `aria-valuemin=0`, `aria-valuemax=bands-1`, `aria-valuetext="€10 to €20, 412 keys"`;
- the band labels around the ring are also real buttons (44px targets) for touch and screen-reader users;
- reduced motion: the ring jumps to the detent instantly.

### 8.23 Buy box, edition selector, requirements panel, system requirements (PDP)
**Buy box** (`src/components/product/BuyBox.tsx`), a plate with 24px padding:
1. The label row at 14px with the edition tag.
2. The price at step-4 (mono 600). If discounted, the was-price struck in faint and the deal plate on the same line.
3. Stock line: the lit lamp and "In stock" (from real `qty > 0`), or the unlit lamp and "Out of stock". No counts, no urgency.
4. **Quantity** (only when the max is above 1), then **Key lg "Add to cart"** full width, then **Steel lg "Buy now"** (straight to checkout with this item).
5. A Text button with `Pin`: "Pin for later" / "Pinned".
6. Three ruled rows with 18px icons (copy from `POLICY_FACTS`; each row hidden if its fact is not true in config):
   - `Timer`: "Delivered to your account, usually within minutes after payment is confirmed."
   - `ShieldCheck`: "Card payment on a hosted page with 3-D Secure."
   - `RotateCcwKey`: "Replacement or refund if the key doesn't work." This links to the Refund policy anchor.
7. Visa / Mastercard / PCI DSS at 20px.

**States:** ready; adding (loading); in cart ("In cart · View cart" Text plus Key "Checkout"); out of stock (Add disabled "Out of stock", the line "This key isn't in stock right now.", and links to the same title on other platforms if they exist); price unavailable ("Price unavailable right now", Add disabled).

**Edition selector**, above the buy box price:
- Shown only when ≥2 in-stock products share the normalised base title, platform and region.
- A `role="radiogroup"` list of rows, each a link to the sibling product with `aria-current` on the current one:
  - edition name in Mona 560;
  - what it adds (only if the feed's name carries it, e.g. "+ Season Pass"; otherwise nothing);
  - price in mono on the right.
- The current row: fill `--color-accent-light`, lit lamp at the left.
- Other rows: hairline-separated, unlit lamp.

**Requirements panel: "Before you buy"** (a ruled definition list, not a card; placed directly under the buy box on desktop and above the description on mobile):

| Row | Icon | Content |
|---|---|---|
| Platform | `KeyRound` | "Activates on Steam. You need a Steam account and the Steam app." (sentence from the platform table) |
| Region | `EarthLock` | "Global: no regional lock" / "Europe only: activates on accounts registered in the EU, EEA, UK and Switzerland" (per the region map), then the supplier's verbatim limitation note in mono 12px muted |
| Languages | `Languages` | the full list, or "Not specified by the publisher" |
| Requires | `PackagePlus` | DLC: "The base game {title} on the same platform and region" if the base game is in the catalogue (linked), else "The base game on the same platform" |
| Validity | `CalendarSync` / `WalletCards` | subscriptions: the duration; gift cards: the value and "Expiry set by the issuer, see activation details" unless the feed states a date |
| Age rating | — | only if the feed has one, as given ("PEGI 16") |
| Delivery | `Timer` | "To your account, usually within minutes after payment is confirmed" |

**System requirements:**
- Rendered only when **all three** hold:
  - the platform is a PC launcher (Steam, Epic, EA app, Ubisoft Connect, GOG, Battle.net, Rockstar);
  - the type is Game, DLC or Software;
  - the feed's text is non-empty.
- When the feed is structured into Minimum / Recommended, render a two-column ruled table (labels in engraved caps, values in Mona 15px). Otherwise render the verbatim text as a list.
- Never shown for Xbox, PlayStation, Nintendo, gift cards or subscriptions (QC 18.4).

### 8.24 Order timeline (`OrderTimeline`, rebuilt from `PurchaseTimeline`)
**Happy path:** **Order placed → Payment confirmed → Key issued**. The account adds a fourth, informational node, **Revealed**, with the time of the first reveal (it is not a delivery step).

**Desktop:**
- the dial ruler as the track, nodes 10px circles;
- done nodes: filled ink;
- current node: the lit lamp in its place and a label in ink 600;
- upcoming nodes: hollow `--color-border-hover`, label faint;
- timestamps under done nodes in mono 12px muted, real values only (`createdAt`, `paidAt`, `issuedAt`, `revealedAt`).

**Mobile:** the same as a vertical track.

**"Issuing" state** (paid, key not yet issued): the dial loader at the current node and the line "Usually within minutes after payment is confirmed. We'll email you when it's ready." No countdown.

**Branches** replace the remaining track with a danger or neutral end node and one sentence of copy (§16):
- Payment failed;
- Issuing delayed;
- Refund pending;
- Refunded;
- Replacement issued.

The track never shows a future the order can no longer reach.

While in flight the page polls (existing logic). A change animates once (M8), and `aria-live="polite"` announces it.

### 8.25 Key plate (`src/components/account/KeyPlate.tsx`, new — the core component)
A bolted plate (four bolts), `--color-plate` with `--steel-grain`, 24px padding, max-width 720px.

**Anatomy:**
1. **Header row:**
   - engraved "KEY 1 OF 2" (when the order has several);
   - the label row (platform, region, type);
   - on the right, the key status tag (§8.5): "Ready" (success), "Reported" (warning), "Replaced" (info), "Refunded" (neutral).
2. **Title** in Mona 640 step-1, linked to the PDP.
3. **The key, in tumbler windows** (§8.21):
   - one slot per character, keeping the issued string exactly as delivered (dashes, spaces and case are never reformatted);
   - long keys wrap by group;
   - masked: every slot shows `•` in muted.
4. **Action row:**
   - masked: Key md "Reveal key" with `Eye`;
   - revealed: Steel md "Copy key" with `Copy` (→ `CopyCheck` "Copied" for 2s); Steel md "Redeem on Steam" with `SquareArrowOutUpRight`, opening the platform's own redeem page from `src/config/activation.ts` in a new tab with `rel="noopener noreferrer"`; Text "Hide" with `EyeOff`.
5. **Meta line** in mono 12px muted: "Issued 6 Oct 2026, 14:21 · First revealed 6 Oct 2026, 14:25".
6. **Disclosures:**
   - Text "How to redeem on Steam" opens the steps from §14.13 inline;
   - Text "Activation notes from the publisher" shows the verbatim `activationDetails`;
   - Text "Spell it out" shows a second mono line under the key with every character disambiguated, for reading to a console or a TV keyboard: `7 X K 2 Q – zero O(letter) Q D 9 – …`.
7. **Problem link:** Text "Key not working? Report it" opens the report dialog (reason select: "Already redeemed", "Invalid key", "Wrong region", "Wrong product", "Other"; an optional note; an optional screenshot), which creates a support ticket tied to the order item.

**Security behaviour (the design depends on it):**
- The key is **never in the initial HTML**. "Reveal" calls the server, which:
  - decrypts the stored key (encrypted at rest, AES-256-GCM with a key from env, §17);
  - logs `revealedAt` on the first reveal;
  - returns the plain string to the signed-in owner only.
- Copying uses `navigator.clipboard.writeText`. On failure the key text is selected and the hint reads "Press Ctrl+C / ⌘C to copy".
- The page sets `Cache-Control: no-store`.

**States:**
- **Issuing:** the plate shows empty slots with the dial loader and "Usually within minutes after payment is confirmed".
- **Masked**, then **Revealing:** M6, the decrypt, ≤900ms. Then **Revealed** and **Copied**.
- **Copy failed:** as above.
- **Image key** (the supplier issued an image instead of text): the slots are replaced by the image in a recessed well, "Open full size", and "Download image". Copy is not offered.
- **Code + PIN** (some gift cards): two rows, "Code" and "PIN", each in tumbler slots, each with its own Copy.
- **Reported:** a warning tag plus the line "We're checking it. We reply within 1 business day." (from config).
- **Replaced:** the old key plate collapses to one struck line "Replaced on 7 Oct 2026", and a new plate appears above it with the bolts shooting home (`bolt-shoot`).
- **Refunded:** the plate is neutral, the key slots are removed, and the line reads "Refunded to your card on {date}".

**Accessibility:**
- The key is plain text in the DOM once revealed (inside the slots, with `aria-hidden` on the visual slots and a visually hidden text copy).
- Reveal moves focus to "Copy key". `aria-live` announces "Key revealed" and "Key copied".

### 8.26 Cart drawer (`CartSheet`)
- Right panel 420px (100% on mobile), `--color-raised`, `--shadow-panel`, scrim behind.
- Slides translateX(100%)→0 over 260ms on `--ease-latch`; closes in 200ms. Reduced motion: a 120ms fade.
- **Header:** `Archive` 20px, "Cart" in Hubot 680 step-2, the count in a tumbler, close `X`.
- **Rows:** compact rows (§8.10) with the label row, quantity (§8.13), price in mono, and Text "Remove" with `Trash` 16px. Removing collapses the row over 180ms and is announced.
- **Footer (sticky):**
  - Subtotal in mono;
  - the line "Keys are delivered to your account after your payment is confirmed." (14px muted);
  - "Total", or "Total incl. VAT" only when `COMPANY.vatRegistered`;
  - Key lg full-width "Checkout";
  - Text "View cart";
  - payment logos at 24px.
- **Empty:** the empty deposit box illustration (§8.30), "Your cart is empty", Text links to Games, Gift cards and Deals, and Steel "Browse the catalogue".
- Focus trap, Esc, focus return, `role="dialog"`, `aria-label="Cart"`.

### 8.27 Search dialog (`SearchDialog`)
- Opens from the header field or the `/` key. A full-width panel drops from under tier 1 (`--color-raised`, `--shadow-lg`, max-height 80vh), translateY −6px→0 + opacity over 180ms.
- One input at step-2 in Mona 400 with a leading `Search` 20px, the placeholder "Search 4,812 keys: title, platform or genre" (real count), and Text "Close" with an Esc hint in mono 12px.
- **Live results** (debounced 200ms):
  - "Keys" as compact rows (max 6);
  - "Platforms" and "Genres" as text links with counts ("Steam · 214");
  - Text "See all 318 results".
- Combobox pattern: arrow keys, Enter opens, Esc closes.
- **No results:** "Nothing matches “xyz”." plus platform links and the hint "Try the title without the edition name."

### 8.28 Checkout steps (`Stepper` restyle)
- **Progress:** the **dial ruler** across the top of the checkout column with three detents, **01 ACCOUNT · 02 DETAILS · 03 REVIEW & PAY**.
  - The green index line stands at the current detent; completed detents show `Check` 14px over their tick.
  - Moving forward slides the index line along the ruler (260ms, `--ease-latch`) with the ticks it passes stepping lit→unlit (§13 M11).
  - A visually hidden live region announces "Step 2 of 3, Details".
- **Panel:** one step at a time on `--color-bg`. Completed steps collapse into one-line summaries above the panel (Mona 14px muted, e.g. "Signed in as alex@… · Change").
- **Buttons:** Continue (Key lg) bottom-right; Back (Text) bottom-left except on step 1.
- **Errors:** field messages, plus a summary at the top of the panel ("Check 2 fields") that links to the fields and receives focus.
- **Mobile:** the ruler shortens to three detents with labels under the active one only; the summary sits above as an accordion "Show summary · €29.99".

### 8.29 Cookie banner and preference centre
- **Banner** (first visit, nothing stored):
  - a docked plate at the bottom-left, 420px wide (full width minus 32px on mobile), `--color-raised`, 0px, `--shadow-lg`, 20px padding;
  - it never covers the mobile sticky buy bar or the checkout bar, and docks above them when they exist.
- **Copy:** "We use necessary cookies to run the store. Analytics and marketing cookies load only if you allow them." plus the link "Cookie policy".
- **Buttons:** three **visually identical** Steel sm buttons in one row: "Accept all", "Reject all", "Customise".
- `role="region"`, `aria-label="Cookie consent"`, not modal. Analytics and marketing load only after consent.
- **Preference centre:** the dialog "Cookie settings" with three switch rows:
  - Necessary, locked "Always on";
  - Analytics;
  - Marketing.

  Each has a one-sentence purpose and a "Show cookies" disclosure listing name, provider, purpose and expiry (the same table as the Cookie Policy). Footer: Key "Save choices", Steel "Accept all", Steel "Reject all". It opens from the banner and from the footer's "Cookie settings".
- The storage key becomes `keyrook-consent` (with version and timestamp). Update the Cookie Policy table.

### 8.30 Empty state (`EmptyState` restyle)
- An **empty deposit box**: a 160×104 line drawing in Lucide's style (1.75 stroke, square caps, `currentColor` muted) of a drawer pulled open with nothing inside. One inline SVG component, no illustration library.
- H2 Hubot 600 step-2, one sentence muted, one primary action and at most one Text link.
- **Copy per context:**

  | Context | Copy |
  |---|---|
  | Cart | "Your cart is empty" |
  | Pinned | "Nothing pinned yet" |
  | Keys | "No keys yet" + "Keys you buy appear here after your payment is confirmed." |
  | Orders | "No orders yet" |
  | Search | "Nothing matches “…”" |
  | Filters | "No keys match these filters" (with the three broadest real suggestions) |
  | Platform with no stock | "No Nintendo keys in stock right now" |

- No people, no emoji.

### 8.31 Alert and error
- 0px, tint fill, 1px semantic border, 16px semantic icon, Mona 15px.
- Page fetch error: "Something went wrong loading this page." plus Steel "Try again".
- Payment return error: "Your payment didn't go through. You haven't been charged." plus Key "Try again".

### 8.32 Skeletons
- Page-level loading uses skeletons (card, compact row, PDP, key plate), never spinners.
- Fills are `--color-bg-secondary` on `--color-bg-tertiary` stages. No shimmer. They fade to content in 120ms.

---

## 9. Logo and favicon

### 9.1 Wordmark
- "Keyrook" in Hubot Sans 760 at `wdth` 125, sentence case, tracking −0.01em, converted to outlines (no font dependency).
- **The ownable detail:** the first **o** of "rook" is drawn as a **dial**. Its counter becomes a ring of 12 short ticks cut into the letter's inner edge, and a green **index line** (the same 2px × proportional bar as the dial ruler) sits in the ticks' 12 o'clock gap. Everything else is plain ink.
  - At ≥120px wide the 12 ticks are visible.
  - Below 120px the ticks drop and only the index line remains, as a notch in the top of the o.
- **Files:**
  - `public/logo.svg`: ink `#0F1513`, index `#0F7A50`;
  - `public/logo-dark.svg`: `#E4EBE7`, index `#46D39A`.
- Clear space: the cap height of the "K" on all sides. Minimum width 88px; below that, use the monogram.
- No effects, no glow, never placed on a cover.

### 9.2 Monogram
A square tile (0px, `#0F1513`) holding a **dial ring** (100 ticks drawn as 50 at small sizes, ring diameter 78% of the tile) with a Hubot 760 capital **K** at `wdth` 112.5 in `#E4EBE7`, optically centred inside the ring. The green index line sits at 12 o'clock on the ring.

| Size | Drawing |
|---|---|
| ≥180px (apple-touch, android, OG) | full ring with numerals 0 / 25 / 50 / 75 in Red Hat Mono at 7% of the tile |
| 32px | ring reduced to 24 ticks, K strokes thickened to ≥2px, index 2×5px |
| 16px | no ticks; a 1.5px solid ring, a heavier K (stem ≥2px) and a 2×4px green index |

- The tile stays dark on both light and dark browser chrome. `public/favicon.svg` declares a 1px `#26302D` edge so it does not vanish on dark tabs.
- The chess-piece reading of the name (rook = castle) is deliberately **not** drawn. A crenellation would be clip-art; the dial is the brand.

### 9.3 Files and code
- Regenerate `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png` and `android-chrome-512x512.png` with `scripts/gen-favicons.mjs`. Replace its inline SVGs with the monogram (full and small) and keep its target list.
- `src/app/icon.svg`.
- `public/manifest.json`: `theme_color: #0C110F`, `background_color: #0F1513`, name "Keyrook".
- `viewport.themeColor` in `layout.tsx`: dark `#0C110F`, light `#F5F7F5`.
- `src/components/layout/BrandMark.tsx`: monogram + wordmark via `currentColor` for letters and `var(--color-accent)` for the index; no hex.
- **Root metadata:**
  - title template: "%s · Keyrook";
  - description: "Game keys, DLC, gift cards and subscriptions for Steam, Epic, Xbox, PlayStation, Nintendo and more. Pay on a hosted card page; your key is delivered to your account, usually within minutes after payment is confirmed.";
  - OG image: the Strongroom bg, the closed vault door poster (SVG) at the right, the wordmark and the H1 at the left. No covers in OG images: covers are third-party art and change.

---

## 10. Motif usage rules

### 10.1 The dial
- **Is:** the graduated ring (door, price explorer, monogram, wordmark o, 404) and its straightened form, the dial ruler (checkout progress, price slider, order timeline track, filters). The **index line** is its cursor.
- **Used on:**
  - the hero door;
  - the price-band explorer;
  - checkout;
  - the order timeline;
  - price and year sliders;
  - the dial loader;
  - the 404;
  - the logo.
- **Never:** as decoration with no value behind it; as a progress bar for anything other than checkout steps, order status or a price/year range; spinning continuously.

### 10.2 Tumbler windows
- **Are:** mono glyphs in recessed slots that roll to their value.
- **Used on:**
  - the hero catalogue readout;
  - the cart count;
  - order numbers (order page, account);
  - the key plate (the key itself);
  - the theater's decrypt scene;
  - the price-band count;
  - the 404 ("4 0 4").
- **Never:** on prices in grids (prices must be read instantly; they are plain mono); on body text; with invented numbers. Every tumbler shows a real value or sample data inside the theater, labelled "Sample data".

### 10.3 Bolted plates
- **Are:** plates with four 6–8px bolt heads, 10px in from the corners.
- **Used on exactly four objects:**
  - the hero door poster;
  - the key plate;
  - the home security ledger;
  - the footer credentials plate.
- **Never:** on product cards, buttons, dialogs, the buy box or the theater bezel. The point is that bolts mean "held" or "proved here".

### 10.4 Material rules
- Plates are square, hardware is round (§5.3).
- Plates get the machined edge; recesses (inputs, cover stages, tumbler slots) get the pressed edge.
- `--steel-grain` is used only on the three hardware faces named in §3.4.
- There is no other texture: no noise, carbon fibre, grid paper or scanlines.
- Depth comes from recess versus plate, never from outlines stacked on outlines.

---

## 11. Header, vault map, mobile menu, footer

### 11.1 Header — two steel tiers (≥1024px)
**Tier 1, the counter** (64px, `--color-rig`, 1px bottom hairline, inner `max-w-container`):
- **Left:** the wordmark (22px cap height) linking to "/".
- **Centre:** **search is the primary action of a key store**, so the field is wide and early.
  - Width: flex up to 640px, 44px high, `--color-raised`, `--edge-machined-pressed`, 1px control border.
  - `Search` 18px and the placeholder "Search 4,812 keys" (real count, rounded down to the nearest 10 when over 1,000 to avoid flicker between syncs).
  - The `/` key hint sits in a mono tumbler slot at the right edge.
  - It opens the search dialog.
- **Right:**
  - account: `UserKey` + "Account", or "Sign in";
  - cart: `Archive` + "Cart" + the count in a tumbler (§8.5 `count`) when above 0.

**Tier 2, the rail** (40px, `--color-rig`, 1px bottom hairline):
- **Left:** nav in Hubot 680 13px caps at 125%, 0.06em:
  - **CATALOGUE** with `ChevronDown` (opens the vault map, §11.2);
  - GAMES;
  - DLC;
  - GIFT CARDS;
  - SUBSCRIPTIONS;
  - DEALS;
  - NEW RELEASES.

  Active: a 2px green bar under the full label. Hover: ink (from muted) over 120ms.
- **Right:**
  - the status line (Mona 13px muted): a lit lamp and "Keys delivered to your account, usually within minutes after payment is confirmed"; the copy comes from `POLICY_FACTS` and the line is hidden if not configured;
  - a hairline;
  - the currency select (mono "EUR", 32px);
  - the theme toggle (`SunMoon`, "Switch to Counter Hall" / "Switch to Strongroom").

**Behaviour:**
- Sticky. After 120px of scroll down, tier 2 slides up behind tier 1 (translateY −40px, 200ms) and tier 1 compacts to 56px. Scrolling up 40px brings tier 2 back.
- Header height is reserved: no layout shift.
- 1024–1279px: tier 2 nav keeps CATALOGUE, GAMES, GIFT CARDS and DEALS; the status line collapses to the lamp + "Delivery" with a tooltip-free link to the delivery policy.

### 11.2 Vault map (the mega-menu)
- A full-width panel under tier 2: `--color-rig`, `--shadow-lg`, 32px padding, max-height 76vh, 1px top hairline. Laid out as a floor plan.
- **Left block (8 columns): Platforms.** A grid of **lockers** in 3 rows. Each locker is a tall plate showing:
  - the pip and the platform name engraved;
  - the real count ("1,940 keys");
  - "from €1.49" (real minimum, active currency).

  Only platforms with stock appear. Locker widths follow count rank (the largest platform spans 2 columns). Hover or focus lights the locker's lamp and shows its 3 most-bought or newest covers in the preview column.
- **Middle block (2 columns): Types and price.** Games, DLC, Gift cards, Subscriptions, Software (each with an icon and count), then a hairline, then the price bands for the active currency ("Under €5", "€5–€10", "€10–€20", "€20–€40", "€40 and up") with counts.
- **Right block (2 columns): Preview.** For the hovered locker or type, three compact covers (3:4) with title and price, plus the link "All Steam keys · 1,940" with `ArrowRight`. Real data only; omitted if nothing has a cover.
- Below the blocks, a full-width row of genre text links with counts (top 12 by count) and "All genres".
- **Behaviour:**
  - opens on click and on hover-intent (150ms); closes on leave (250ms grace), Esc, or focus leaving;
  - the trigger has `aria-expanded` and `aria-controls`;
  - arrow keys move within and across blocks;
  - animation `panel-in` 180ms.

### 11.3 Mobile header (<1024px)
- A 56px rig: the wordmark on the left (18px cap height); on the right, the `Search` icon button, `Archive` with the tumbler count, and the `Menu` icon button labelled "Catalogue".
- **Search** opens a full-screen search sheet: the input at the top, then "Platforms" as a 2-column grid of mini lockers, then recent searches (local only).
- **Menu** opens a **bottom sheet** rising to 92vh (`--color-rig`, 0px, `--shadow-panel`), the vault map composed for thumbs:
  - Platforms as a 2-column locker grid (largest full width);
  - Types as large rows with counts and `ArrowRight`;
  - Deals and New releases rows;
  - Account rows (Keys, Orders, Pinned, Profile, or Sign in);
  - Help (How activation works, FAQ, Contact);
  - the currency select;
  - the theme as a segmented control (Strongroom / Counter Hall).

  It has a drag handle (a 32×4 bar, 0px) plus a close `X`, a focus trap and Esc.
- The status line moves into the sheet's top.

### 11.4 Footer — the vault floor
Inside `max-w-wide`, on `--color-floor`, ink text:
1. **Platform index:** a full-width row of the platforms with stock as engraved caps links, each with its pip, separated by the dial ruler's minor ticks drawn as a hairline baseline. It is the footer's top edge and a real navigation row. After it, 56px of space.
2. **Four columns** (desktop; hairline-separated):
   - **Shop:** Games, DLC, Gift cards, Subscriptions, Deals, New releases, All keys.
   - **Your keys:** Account, Keys, Orders, Pinned, Cart.
   - **Help:** How activation works, Delivery, Key not working?, FAQ, Contact us.
   - **Legal:** Terms & conditions, Privacy policy, Refund policy, Cookie policy, All policies, and the button "Cookie settings".

   Heads are engraved micro-labels in muted. Links are Mona 15px ink with an underline on hover.
3. **Credentials plate:** a **bolted plate** with `--steel-grain`, holding a ruled two-row definition grid:
   - labels as engraved micro-labels; values in Mona 15px; identifiers in mono 14px;
   - rows: Company `COMPANY.name` · Company number `COMPANY.companyNumber` · VAT number (only when `COMPANY.vatRegistered`) · Registered office `COMPANY.registeredOffice` · Email (mailto) · Phone (only when not null) · Support hours `COMPANY.supportHours`;
   - above it, the line "Keyrook is a trading name of {COMPANY.name}.";
   - all values from `src/lib/company.ts`.
4. **Disclaimer** (Mona 14px muted): "Keyrook is an independent store. It is not affiliated with or endorsed by Valve, Epic Games, Electronic Arts, Ubisoft, CD PROJEKT, Blizzard Entertainment, Microsoft, Sony Interactive Entertainment, Nintendo or Rockstar Games. Game titles, platform names and cover art belong to their respective owners."
5. **Bottom row** (1px top hairline, 24px padding):
   - left: "© {year} Keyrook" in 14px muted;
   - right: a **light logo strip**, a 0px plate in `--color-logo-strip` (`#F5F7F5` in both themes) holding `/payments/visa.svg`, `/payments/mastercard.svg` and `/payments/pci-dss.svg` via `next/image` at 28px high, width auto, **in colour as supplied**, with alts "Visa", "Mastercard", "PCI DSS compliant" and 12px gaps;
   - social text links only if env URLs are set.
6. **Mobile:**
   - the platform index becomes a horizontal scroller;
   - the columns become accordions;
   - the credentials plate is one column (the bolts stay);
   - the logo strip is centred at 24px;
   - the copyright comes last.

The checkout uses a compact footer: policy links, the credentials one-liner and the logo strip.

---

## 12. The theater: code-rendered product demos instead of videos

### 12.1 What it is and where it lives
The theater plays short scripted scenes inside a steel bezel:
- a cursor moves;
- real Keyrook components respond (search, deposit boxes, buy box, checkout, key plate);
- captions explain each step.

Scenes are React views driven by a timeline, not recordings. They stay sharp at any size, follow the theme, cost a few KB, and can never drift from the real UI, because they **use the real components in demo mode**.

| Surface | Use |
|---|---|
| Home §14.1 section 5 | `TheaterTabs` with all five scenes, auto-advancing |
| How activation works (§14.13) | `FeatureSpotlight` with **Decrypt** and **Redeem** (per platform) |
| Home §14.1 section 9 | `MiniStill` of **Redeem** for the selected platform (static, no engine) |
| Home §14.1 section 10 | `MiniStill` of **Pay** at its "challenge" state |

There is no theater on catalogue, product, cart, checkout or account pages. Store surfaces stay quiet.

### 12.2 Port from allship-ai (reuse, don't reinvent)
Copy `/home/claude/ref/keys/allship-ai/src/components/theater` to `src/components/theater/` and adapt:

| File | Keep | Change |
|---|---|---|
| `types.ts` | `Step`, `Patch`, `SceneDef`, `SceneViewProps`, `StringKeys`/`NumberKeys` | `SceneId = "pick" \| "pay" \| "decrypt" \| "redeem" \| "support"`; `DeviceKind = "desktop" \| "phone"`; drop the `device` step kind (no device morphing here) |
| `define.ts` | `defineScene`, `scriptBuilder`, `foldStep`, `resolveEnd`, `captionsOf`, `urlFor`, `erase` | remove `morphs` and the device branch |
| `engine/runner.ts` | segment compiler, cursor travel, press/release, type/stream/tween/highlight/caption, background tweens, loop fade | delete the `device` case |
| `engine/geometry.ts` | `eases`, `cursorEase`, `arcControls`, `bezierPoint`, `aimPoint`, `travelMs`, `charDelay`, `timing` | presets: desktop 1200×720, phone 390×720; no tablet, no island, no status bar |
| `engine/engine.tsx` | stage API, `flushSync` commits, `data-demo` targeting, auto-scroll | replace the private `rafTicker` with `addTick` from `src/lib/motion/ticker.ts` (one heartbeat for the whole site); cursor, spot and tip restyled (below) |
| `stage.tsx` | the exclusive "election" (only the most visible theater plays), lazy load on near/idle/first interaction, `visibilitychange` pause, reduced-motion still, finish/replay | controls restyled (§12.5); `afterLoadIdle` and `onFirstInteraction` move to `src/lib/motion/idle.ts` (create them there if the project has no equivalent) |
| `still.tsx` | `Still`, `boxFor`, `Poster` | `Poster` becomes the bezel with three skeleton bars in our tokens |
| `frame.tsx` | structure | rebuilt as the **bezel** (§12.4); no traffic lights, no browser chrome, no phone hardware |
| `tabs.tsx`, `tabs-client.tsx` | server meta + client tablist, keyboard, auto-advance on finish (900ms) | restyled (§12.5) |
| `sync.tsx` | `TheaterSync`, `TheaterSteps` | restyled step list (§12.5) |
| `spotlight.tsx` | `FeatureSpotlight` 5/7 grid with synced steps | headings and spacing from our scale |
| `scenes/loaders.ts`, `scenes/index.ts` | lazy per-scene loaders | five scenes |
| `pages/home/mini-still.tsx` | `MiniStill` (IntersectionObserver, end-state still) | moves to `src/components/theater/mini-still.tsx` |
| `theater.css` | container sizing (`.th-box` aspect + container queries), frame scaling via `--k`, cursor and spotlight layers | moves to `src/styles/theater.css` (imported by `globals.css`), all colours from tokens |

**Timing constants** stay as in allship: `lead 450`, `press 120`, `release 240`, `char 55`, `stream 16`, `scroll 560`, `highlight 1700`, `highlightGap 260`, `tail 2200`, `fade 380`. Cursor travel is `340 + distance × 0.55`, clamped to 420–950ms.

**Demo mode for real components:**
- `DepositBox`, `BuyBox`, `KeyPlate`, `OrderTimeline`, `Field`, `Button`, `Choice`, `Plate`, `PriceDisplay` and `Tumbler` accept `demo?: boolean`. In demo mode, links render as `<span>`, nothing fetches, and the engine targets elements via `data-demo="…"` attributes passed through props.
- Components never import theater code.

**Sample data** lives in `src/components/theater/scenes/data.ts`:
- fictional titles only ("Lantern Coast", "Ironvale Tactics", "Night Ferry", "Saltmarsh Run", "Orbit Freight", "Hollowstone") with sample prices, so no real product is shown with a made-up price;
- real platform names, because those are facts.

**Sample covers** are `SampleCover`: a deterministic flat composition from the title's seed (two large geometric masses and the title set in Hubot at 125%, from six duotone pairs defined as `--sample-*` tokens in `theater.css`). No gradients, no images. Every stage shows the neutral tag **"Sample data"**.

### 12.3 Scene definition (the contract)
```ts
export const decrypt = defineScene<DecryptState>({
  id: "decrypt",
  title: "Decrypt",
  summary: "After payment is confirmed, the key is issued to your account, stays masked until you reveal it, and can be copied or taken straight to the platform's redeem page.",
  url: "/account/keys",
  device: "desktop",
  initial: { issue: 0, status: "paid", masked: true, decrypt: 0, copied: false },
  end: { decrypt: 1, copied: false },
  View: DecryptView,
  script: ({ caption, tween, set, highlight, click, wait }) => [
    caption("Payment confirmed: your key is issued to your account"),
    tween("issue", 1, 1400),
    set({ status: "issued" }),
    caption("It stays masked and encrypted until you reveal it"),
    highlight("plate", "Stored encrypted. Decrypted only when you choose Reveal."),
    click("reveal", { masked: false }),
    tween("decrypt", 1, 1600, { ease: "out" }),
    caption("Copy it, or open the platform's redeem page"),
    click("copy", { copied: true }),
    wait(900),
    highlight("redeem", "Opens Steam's own redeem page in a new tab"),
    wait(800),
  ],
});
```

- **Views are pure functions of state** (`SceneViewProps<S>`): no timers, no effects, no randomness. Every frame can be rendered as a still, and `resolveEnd` produces the reduced-motion frame.
- **Decrypt glyphs** come from a pure function `decryptGlyph(key, i, progress)`:
  - character `i` of `n` settles at `t_i = 0.08 + 0.84 × i / (n − 1)`;
  - before `t_i − 0.18` it shows `•`;
  - between `t_i − 0.18` and `t_i` it shows a glyph from `0123456789ABCDEFGHJKLMNPQRSTUVWXYZ`, picked by `hash(i, floor(progress × 48))`;
  - for 0.04 after `t_i` it is the real character in `--color-accent-ink`;
  - after that it is ink.

  Separators never scramble. The account's real KeyPlate uses the same function with the same visual, over 900ms (M6).
- Scenes are responsive through container queries (`@container`), as in allship's `@3xl` variants. Below 840px the stage uses the **phone** preset, and the View composes a single column.

### 12.4 The bezel (`frame.tsx`)
The bezel is a steel monitor plate, not a browser window:
- **Outer plate:** 0px, `--color-plate`, `--edge-machined`, 12px border on desktop (10px on phone), `--shadow-card`.
- **Top strip** (36px, inside the border):
  - left: an **address slot**, a recessed mono 12px field (`--edge-machined-pressed`) showing the scene's URL path as `keyrook.com/account/keys`;
  - right: the engraved neutral tag "SAMPLE DATA".
  - When the Pay scene moves to the hosted page, the slot text changes to "secure payment page · your payment provider" and a 2px `--color-info` bar appears along the slot's left edge. This shows that the visitor has left Keyrook's own pages. Use the real provider's name only once `STORE_POLICY.payment.providerName` is set.
- **Screen:** `--color-bg` of the current theme, with the scene inside.
- **Cursor:**
  - an inline SVG arrow, 0px corners, square-tipped, ink fill with a 1px `--color-bg` outline;
  - in text mode, a 2px ink I-beam;
  - on the phone preset, a 28px **tap ring**: a 2px `--color-accent` circle that scales 0.6→1 and fades over 240ms on press. No glow.
- **Spotlight:** a 2px `--color-accent` outline rectangle (0px) around the target with 6px padding. The rest of the screen dims with `box-shadow: 0 0 0 100vmax var(--color-scrim)`, clipped by the screen's `overflow: hidden`.
- **Tip:** a plate tooltip (max 300px, `--color-raised`, `--shadow-lg`) with the engraved label "NOTE" and Mona 14px text, placed above or below the target as in allship.

### 12.5 Controls and steps
**Tabs** (`tabs-client.tsx`):
- A row of engraved toggles on a plate, each 52px high, laid out as "01 PICK", "02 PAY", "03 DECRYPT", "04 REDEEM", "05 SUPPORT". The number is in a tumbler slot; the label is Hubot 680 caps at 125%.
- **Active tab:** the lit lamp before the number, ink label, a 2px green bar under the full tab, and **a mini dial ruler** along its bottom edge with one tick per caption. Ticks light as chapters pass, so the tab doubles as a progress meter.
- **Keyboard:** WAI-ARIA tabs (arrows, Home, End), as allship.
- **Auto-advance:** 900ms after a scene finishes. Choosing a tab plays that scene from the start, and auto-advance continues after it.
- **Mobile:** tabs become a horizontal scroller of the same toggles, with the active one scrolled into view.

**Under the stage:**
- the chapter counter "02/04" in mono tumblers;
- the current caption (Mona step-0, ink, `aria-hidden`);
- the neutral tag "Sample data" (≥840px);
- the **knob**: a 44px **round** play/pause/replay control (`rounded-round`, `--color-plate`, `--edge-machined`, Lucide `Play` / `Pause` / `RotateCcw` 18px), `aria-label` "Play demo" / "Pause demo" / "Replay demo".

**`TheaterSteps`:** an ordered list.
- Each row has a mono number in a tumbler slot, then the caption.
- Done rows show `Check` in the slot. The current row shows the lit lamp and ink text. Upcoming rows are muted.
- No coloured left bars.

### 12.6 Accessibility and reduced motion
- The stage is a `<figure aria-label={summary}>`. The animated box is `aria-hidden` and `inert`.
- A visually hidden `figcaption` carries the summary plus "Illustration with sample data."
- The full caption list is an `<ol>`: visually hidden while playing, visible under reduced motion.
- Auto-play runs only when the stage is ≥20% visible **and** elected (the most visible theater on the page), and pauses when the tab is hidden. There is always a pause control (WCAG 2.2.2). No sound.
- **Reduced motion:** the engine is never loaded. Each scene renders as a `Still` of `resolveEnd(scene)` merged with `scene.end`, and the step list is visible. Tabs switch the still instantly.
- Nothing flashes more than three times a second across a large area. The dial loader inside scenes steps a single 2×5px tick.
- The cursor and spotlight are decorative and never take focus.

### 12.7 Performance
- The engine chunk (runner + engine + geometry, ≈12 KB gzip) loads only when a theater is near the viewport (300px margin), after load-idle or on the first interaction, as in allship.
- Each scene is its own lazy chunk.
- Scenes render ≤150 DOM nodes and no raster images (sample covers are inline SVG).
- The frame scales by a single transform from container units (`--k`), so the layout never thrashes.
- Only one theater plays at a time. It unsubscribes from the ticker when paused, finished or off-screen.

### 12.8 Scene scripts, frame by frame
Times are start times in ms from scene start, computed with the timing constants and a nominal 650ms cursor travel. A `click` is travel + press 120 + release 240 (≈1,010). A `highlight` is 1,700 + 260 (≈1,960). The tail is 2,200 after the last step. When a scene runs alone with `loop`, a 380ms fade follows.

#### S1 — Pick (`pick`, url `/search?q=…` → `/product/lantern-coast-deluxe-steam`, ≈14.2s)
State: `{ q: "", results: false, open: false, edition: "standard", added: false, cart: 0, cartRoll: 0 }`.

| # | Start | Step | Target | ms | Effect | Chapter caption |
|---|---|---|---|---|---|---|
| 0 | 0 | lead | — | 450 | cursor appears at its home point (lower right) | |
| 1 | 450 | caption | — | 0 | chapter 1 | Search by title or browse by platform |
| 2 | 450 | wait | — | 400 | | |
| 3 | 850 | type | `search` | ≈1,740 | header search fills "lantern coast" | |
| 4 | 2,590 | set | — | 0 | `results: true`; six deposit boxes rise in (`plate-in`, 70ms stagger inside the View) | |
| 5 | 2,590 | wait | — | 500 | | |
| 6 | 3,090 | caption | — | 0 | chapter 2 | Every card shows platform, region and type |
| 7 | 3,090 | highlight | `card-1-label` | 1,960 | tip: "Steam · Global · Base game. Global means no regional lock." | |
| 8 | 5,050 | click | `card-1` | 1,010 | `open: true`; the PDP view replaces results (translateX 24px→0 + fade, 260ms) | |
| 9 | 6,060 | caption | — | 0 | chapter 3 | Choose the edition and check the requirements |
| 10 | 6,060 | click | `edition-deluxe` | 1,010 | `edition: "deluxe"`; the selected row lights its lamp; price swaps to the Deluxe price | |
| 11 | 7,070 | wait | — | 400 | | |
| 12 | 7,470 | highlight | `requirements` | 1,960 | tip: "Needs a Steam account. Languages: EN, DE, FR, ES. Delivered to your account." | |
| 13 | 9,430 | caption | — | 0 | chapter 4 | Add it to your cart |
| 14 | 9,430 | click | `add` | 1,010 | `added: true, cart: 1`; Add becomes "In cart" | |
| 15 | 10,440 | tween | `cartRoll` → 1 | 320 | header cart tumbler rolls 0→1 | |
| 16 | 10,760 | wait | — | 1,200 | | |
| — | 11,960 | tail | — | 2,200 | | |

End/still: the PDP with the Deluxe edition selected and "In cart". Phone: results 2-up, the PDP single column, the buy box below the cover.

#### S2 — Pay (`pay`, url `/checkout` → hosted page → `/order/KR-…`, ≈17.2s)
State: `{ terms: false, consent: false, step: "review", card: "", exp: "", cvc: "", approving: 0 }`.
Shown only when `STORE_POLICY.payment.hostedPage` and `STORE_POLICY.payment.threeDSecure` are both true; otherwise it is dropped from the tabs.

| # | Start | Step | Target | ms | Effect | Chapter caption |
|---|---|---|---|---|---|---|
| 0 | 0 | lead | — | 450 | | |
| 1 | 450 | caption | — | 0 | chapter 1 | Confirm the order and the delivery terms |
| 2 | 450 | click | `terms` | 1,010 | `terms: true` | |
| 3 | 1,460 | click | `consent` | 1,010 | `consent: true`; the checkbox text is the exact `STORE_POLICY.waiver.text` | |
| 4 | 2,470 | click | `pay` | 1,010 | `step: "hosted"`; the address slot changes to the hosted-page label with the info bar | |
| 5 | 3,480 | wait | — | 700 | | |
| 6 | 4,180 | caption | — | 0 | chapter 2 | Card details go into the payment provider's hosted page |
| 7 | 4,180 | type | `card` | ≈2,200 | "4000 0000 0000 4821" (sample) | |
| 8 | 6,380 | type | `exp` | ≈1,270 | "09/29" | |
| 9 | 7,650 | type | `cvc` | ≈1,160 | "123", rendered as "•••" | |
| 10 | 8,810 | click | `submit` | 1,010 | `step: "challenge"`; the bank dialog opens over the hosted page | |
| 11 | 9,820 | caption | — | 0 | chapter 3 | Your bank confirms it's you with 3-D Secure |
| 12 | 9,820 | tween | `approving` → 1 | 2,000 | the dial loader steps; "Approve this payment in your banking app"; at 1, `Check` + "Approved" | |
| 13 | 11,820 | set | — | 0 | `step: "confirmed"`; back on Keyrook, order page with "Payment confirmed" | |
| 14 | 11,820 | caption | — | 0 | chapter 4 | We receive the payment confirmation, never your card number |
| 15 | 11,820 | highlight | `confirmation` | 1,960 | tip: "Keyrook receives: payment confirmed, amount, order number. The card number stays with the payment provider." | |
| 16 | 13,780 | wait | — | 1,200 | | |
| — | 14,980 | tail | — | 2,200 | | |

End/still: `step: "confirmed"`. The `MiniStill` on the home security ledger uses the override `{ step: "challenge", approving: 0.6 }`.

#### S3 — Decrypt (`decrypt`, url `/account/keys`, ≈13.3s)
State and script as in §12.3.

| # | Start | Step | Target | ms | Effect | Chapter caption |
|---|---|---|---|---|---|---|
| 0 | 0 | lead | — | 450 | | |
| 1 | 450 | caption | — | 0 | chapter 1 | Payment confirmed: your key is issued to your account |
| 2 | 450 | tween | `issue` → 1 | 1,400 | the order timeline's segment draws from "Payment confirmed" to "Key issued"; sample times appear | |
| 3 | 1,850 | set | — | 0 | `status: "issued"`; the key plate's bolts shoot home (`bolt-shoot`), the lamp lights, tag "Ready" | |
| 4 | 1,850 | caption | — | 0 | chapter 2 | It stays masked and encrypted until you reveal it |
| 5 | 1,850 | highlight | `plate` | 1,960 | tip: "Stored encrypted. Decrypted only when you choose Reveal." | |
| 6 | 3,810 | click | `reveal` | 1,010 | `masked: false` | |
| 7 | 4,820 | tween | `decrypt` → 1 (ease out) | 1,600 | tumblers scramble and settle left to right (`decryptGlyph`) | |
| 8 | 6,420 | caption | — | 0 | chapter 3 | Copy it, or open the platform's redeem page |
| 9 | 6,420 | click | `copy` | 1,010 | `copied: true`; "Copied" with `CopyCheck` | |
| 10 | 7,430 | wait | — | 900 | | |
| 11 | 8,330 | highlight | `redeem` | 1,960 | tip: "Opens Steam's own redeem page in a new tab" | |
| 12 | 10,290 | wait | — | 800 | | |
| — | 11,090 | tail | — | 2,200 | | |

Sample key: `7XK2Q-0OQD9-H1LMP`, chosen to contain both `0` and `O`, so the slashed zero is visible. End/still: revealed, not copied.

#### S4 — Redeem (`redeem`, url label "Steam app", ≈10.5s)
State: `{ platform: "steam", menu: false, dialog: false, key: "", agreed: false, done: false, added: 0 }`.

The launcher is a **generic neutral window** (plate, title bar with the platform name as text, a left column of library rows). There are no platform logos and no imitation of their UI chrome. Only the real menu labels appear, as words from `src/config/activation.ts`. The same View renders every platform from config, which is how the activation selector shows Epic, EA, Ubisoft, Xbox, PlayStation and Nintendo.

| # | Start | Step | Target | ms | Effect | Chapter caption |
|---|---|---|---|---|---|---|
| 0 | 0 | lead | — | 450 | | |
| 1 | 450 | caption | — | 0 | chapter 1 | Open Steam: Games, then Activate a Product on Steam |
| 2 | 450 | click | `menu-0` | 1,010 | `menu: true`; menu shows the config's path items | |
| 3 | 1,460 | click | `menu-1` | 1,010 | `menu: false, dialog: true` | |
| 4 | 2,470 | caption | — | 0 | chapter 2 | Paste your key |
| 5 | 2,470 | click | `key-field` | 1,010 | field focused | |
| 6 | 3,480 | set | — | 0 | `key: "7XK2Q-0OQD9-H1LMP"` (a paste, not typing) | |
| 7 | 3,480 | wait | — | 500 | | |
| 8 | 3,980 | click | `agree` | 1,010 | `agreed: true` (only when the platform's config lists an agreement step; otherwise skipped by the script builder) | |
| 9 | 4,990 | click | `confirm` | 1,010 | `done: true`; "Activation complete" | |
| 10 | 6,000 | caption | — | 0 | chapter 3 | The game is added to your library |
| 11 | 6,000 | tween | `added` → 1 | 900 | a library row slides in at the top of the left column | |
| 12 | 6,900 | wait | — | 1,400 | | |
| — | 8,300 | tail | — | 2,200 | | |

#### S5 — Support (`support`, url `/account/orders/KR-…`, ≈13.6s)
State: `{ open: false, reason: "", note: "", sent: false, review: 0, outcome: "none" }`.

| # | Start | Step | Target | ms | Effect | Chapter caption |
|---|---|---|---|---|---|---|
| 0 | 0 | lead | — | 450 | | |
| 1 | 450 | caption | — | 0 | chapter 1 | Key not working? Report it from the order |
| 2 | 450 | click | `report` | 1,010 | `open: true`; the report dialog | |
| 3 | 1,460 | click | `reason` | 1,010 | select opens | |
| 4 | 2,470 | click | `reason-redeemed` | 1,010 | `reason: "Already redeemed"` | |
| 5 | 3,480 | type | `note` (char 22ms) | ≈1,970 | "Steam says this key was already used." | |
| 6 | 5,450 | click | `send` | 1,010 | `sent: true`; dialog closes; tag "Reported" | |
| 7 | 6,460 | caption | — | 0 | chapter 2 | We check it and reply within 1 business day (from `STORE_POLICY.support.replyTime`) |
| 8 | 6,460 | tween | `review` → 1 | 1,800 | status "Received" → "Checking" with the dial loader | |
| 9 | 8,260 | set | — | 0 | `outcome: "replaced"`; old plate collapses to "Replaced on …", the new plate's bolts shoot home | |
| 10 | 8,260 | caption | — | 0 | chapter 3 | A faulty key is replaced, or refunded |
| 11 | 8,260 | highlight | `outcome` | 1,960 | tip: "Sample outcome. A key that doesn't work through no fault of yours is replaced, or refunded if no replacement is available." | |
| 12 | 10,220 | wait | — | 1,200 | | |
| — | 11,420 | tail | — | 2,200 | | |

All five scenes back to back, with 900ms gaps, take ≈72s.

---

## 13. Motion hooks for the motion engineer

Use the data-attribute engine (`src/lib/motion/engine.ts`; `WEBGL-3D-KNOWLEDGE.md` §4.2) and the single ticker (`src/lib/motion/ticker.ts`):
- the implementing engineer leaves the markup hooks and the static end state of every moment;
- the motion engineer adds behaviour;
- remove the `bay-hero`, `inspect`, `trays` and `lamp-gl` registrations from `SCENES` and register the new ones.

### 13.1 Depth layers (pointer amplitudes are maxima at the viewport edge, fine pointers only)
| Layer | Content | Pointer offset | Scroll speed |
|---|---|---|---|
| D0 | vault wall: section bands, the door frame recess, the locker wall back | 0 | 0 |
| D1 | dial rulers, tick bands, locker frames, the release ruler | 3px | ±0.04 |
| D2 | plates: door, locker doors, deposit boxes in set-pieces, the security ledger | 6px + swing | ±0.08 |
| D3 | covers inside plates (parallax inside the drawer face, moving 4px against their plate) | 10px | ±0.12 |
| D4 | engraved readouts attached to plates (the hero's tumbler readout, locker counts) | 12px | ±0.05 |
| GL | the door scene: camera and uniforms only | — | scene-driven |
| L0 | headlines, body, CTAs, prices, filters, search | 0 | 0 |

Readable text, prices and CTAs never move with parallax.
- Catalogue, product, cart, checkout, account and policy pages get only the drawer pull (M5), the key decrypt (M6), add to cart (M7), the timeline (M8) and the index slide (M11).
- They get no scroll parallax.

### 13.2 Named moments
| ID | Name | Where | What it communicates | Static / reduced-motion state |
|---|---|---|---|---|
| M1 | The door | home hero | your keys are held behind real security; it opens for you | the door poster ajar at 35°, covers visible, readout shown |
| M2 | Tumbler readout | hero catalogue numbers, cart count, order numbers, price-band count | these numbers are counted, not claimed | final values |
| M3 | Lockers | home platform vault, vault map | each platform has its own locker; look inside | doors ajar at 14° |
| M4 | Theater | home, how activation works | this is exactly what happens, step by step | stills + full step lists |
| M5 | Drawer pull | every deposit box on fine pointers | the box opens toward you | rest |
| M6 | Decrypt | the key plate on Reveal, theater S3 | the key was locked; now it's yours | key shown at once |
| M7 | Into the box | add to cart from any card or the buy box | it went into your cart | count updates, toast |
| M8 | Next node | order timeline status change | your order moved on | new state shown |
| M9 | Release ruler | home new releases | recent releases, placed on a time scale | horizontal snap scroller |
| M10 | Wire packets | home security ledger | where your card data goes, and where it doesn't | static diagram with labels |
| M11 | Index slide | checkout progress, price dial, sliders | you moved one detent on | instant |
| M12 | Directory peek | home genre directory | what's behind this word | none |
| M13 | Door ajar | home final CTA | the door's open; come in | static ajar |
| M14 | Plate in | landing section headings and plates | this section arrived | visible |

#### M1 The door (home hero, the signature moment)
**Markup:**
- section `data-scene="vault-door"`;
- right 6 columns: `<div data-door>` with the **poster** (`DoorPoster`, an inline SVG generated from the same geometry constants in `src/lib/motion/door/geometry.ts`) and a `<canvas data-door-gl aria-hidden="true">`;
- a DOM list `data-door-contents` of the same 12 covers (real links, visually hidden until the door is open on desktop, visible on mobile).

**Library: `ogl` 1.0.11** (verified with `npm view`). It provides `Renderer`, `Camera`, `Transform`, `Program`, `Mesh`, `Cylinder`, `Box`, `Plane` and `Texture` at roughly 12 KB gzip for the modules used.
- It is dynamically imported in an idle callback after LCP.
- Why not raw WebGL: the door needs procedural cylinders, a perspective camera, a scene graph for hinge and bolts, and 13 textures, so hand-rolled matrices would cost more code than OGL.
- Why not three.js 0.186.1 (also verified): ≥150 KB gzip would break the budget.
- Reuse `lamp-gl.ts`'s scaffold patterns: context-loss handling, DPR cap, idle boot, pause on hidden.

**Geometry** (procedural, no model files):
- **Wall and frame:** a plane at z 0 with an open cylinder recess (r 1.12, depth 0.22) for the door frame, plus two hinge barrels on the left.
- **Door:** a cylinder (r 1.0, thickness 0.2, 96 segments) with a 0.02 chamfer ring. The front face has a **turned finish**: concentric micro-rings (`sin(r × 620) × 0.015` on albedo) plus an anisotropic highlight along the tangent, which reads as machined steel without any texture file.
- **Dial:** a cylinder (r 0.32, thickness 0.06) at (0, 0.18). Its face texture (1024²) is drawn at boot with Canvas2D after `document.fonts.ready`: 100 ticks, numerals every 10 in Red Hat Mono, a knurled rim. The **green index line** is fixed on the door face at 12 o'clock above the dial (the dial turns beneath it).
- **Handle:** a hub and three spokes at (0, −0.34).
- **Bolts:** 8 instanced cylinders (r 0.045, length 0.24) around the rim at 22.5° + 45°·k, reaching into the frame.
- **Status lamp:** an 8px-equivalent disc at 3 o'clock on the door face; unlit, then lit `--color-accent` (flat emissive, **no bloom, no glow**).
- **Interior:** a back wall at z −1.2 with a 4×3 grid of deposit-box niches (instanced boxes) holding 12 cover planes at 3:4.
  - The covers are the 12 most-ordered in-stock products with covers, or the newest when there is no order data, recomputed on revalidate.
  - They load through `/_next/image?w=256` (same origin) and are `decode()`d before upload.

**Light and colour:**
- a key light from the upper left, a weak fill, hemispheric ambient;
- Blinn-Phong with a brushed term;
- colours read at boot from tokens (`--color-plate` lifted 30% for steel, `--color-steel-hi`, `--color-accent`) and re-read on theme change. Counter Hall gets a brighter, softer key light and lighter steel.

**Timeline** (desktop, pinned 200vh, progress p):

| p | What happens |
|---|---|
| 0.00–0.08 | Rest. On fine pointers the door shifts ±6px and the camera ±1.5° (D2). |
| 0.08–0.40 | The dial turns three times, alternating direction, seating in three detents with the detent spring (no overshoot). The tumbler readout beside the door stays on its **real** numbers; the dial's position is mechanism, not data. |
| 0.40–0.52 | The bolts retract 0.16 units, staggered 30ms around the rim. The handle turns 90°. The door lamp lights. |
| 0.52–0.86 | The door swings open on its hinge 0→108° (`--ease-in-out`). Interior exposure rises 0.2→1. |
| 0.86–1.00 | The camera dollies 0.6 units into the interior, covers parallax (D3), and the `data-door-contents` list fades in as an overlay of real links on the right edge. |

- **On load:** after the first rendered frame the canvas crossfades in over 600ms and the dial makes one 36° settle into position 0 (500ms). Nothing else moves until scroll.
- **Poster first:** the SVG poster shows the closed door and paints instantly. LCP is the H1 text, never the canvas.

**Mobile and fallbacks:**
- Mobile (<1024px or coarse pointer): no WebGL, no pin. The poster door (88vw) sits under the search field. When it is 50% in view, a **CSS 3D swing** plays once (rotateY 0→−28° on the left edge, perspective 1200px, 1,200ms `--ease-in-out`) to reveal a 3×2 recessed grid of real covers behind it (`next/image`).
- The same CSS swing is the desktop fallback for:
  - software renderers (`WEBGL_debug_renderer_info` matching swiftshader, llvmpipe or software);
  - `deviceMemory < 4`;
  - `saveData`;
  - context loss.
- Reduced motion: the poster rendered ajar at 35° with covers visible, no pin, no swing.

**Budgets:**
- ≤18 draw calls (bolts and niches instanced);
- textures: 12 × 256×341 plus one 1024² dial;
- DPR ≤1.5; GPU ≤6ms per frame on desktop;
- door JS ≤45 KB gzip including OGL;
- paused off-screen and on hidden tabs;
- fully disposed on route change (`WEBGL_lose_context`).
- `?t=` freezes time and `?p=0.6` freezes progress for screenshots (§16 of the manual).

#### M2 Tumbler readout
- `data-tumbler` on a `Tumbler` (§8.21). On first entering view (once per page load), each number rolls from 0 to its value, with 120ms between numbers.
- Cart count: rolls on change, with `aria-live` on the cart button's hidden label.
- Order numbers: roll once when the confirmation page loads.

#### M3 Lockers
- `data-scene="lockers"`. Entrance: lockers rise 16px with a 60ms stagger (D2).
- Hover or focus on a locker:
  - its door plate swings open on its left edge to −24° (rotateY, perspective 900px, 260ms `--ease-latch`);
  - the 3 covers inside slide forward 8px (D3);
  - the locker lamp lights;
  - leaving closes it in 200ms.
- Each locker is one link; motion never blocks navigation.
- Touch: no swing (the first two lockers sit permanently ajar at −14°, so the idea reads).
- Reduced motion: all doors ajar at −14°.

#### M5 Drawer pull
- `data-drawer` on deposit boxes; fine pointers only (§8.10).
- On home set-pieces it adds D3 pointer parallax of ±4px inside the drawer face. On catalogue grids, the pull only.

#### M6 Decrypt
- `data-decrypt` on the KeyPlate.
- On a successful reveal, `decryptGlyph` (§12.3) runs over 900ms on the ticker, with 4 intermediate glyphs per slot.
- Focus moves to Copy at the end. Reduced motion: instant.

#### M7 Into the box
- On add: a FLIP ghost of the cover (40px wide, opacity 0.9) flies to the header `Archive` along a gentle arc in 400ms on `--ease-latch`.
- The Archive glyph's lid nudges up 2px and back (120ms), the cart tumbler rolls, then the toast appears.
- Reuse `cart-flight.ts` with `data-cart-target`. If the header is off-screen, skip the ghost.

#### M8 Next node
- The track segment draws from the previous node to the new one (scaleX, 420ms) and the lamp moves to the new node.
- Once per transition, never on first render.

#### M9 Release ruler
- `data-pin="releases"`, desktop only, pinned ≤140vh.
- A long dial ruler spans the track, one major tick per week for the last 8 weeks of real release dates, with "Today" as the green index line at the right end.
- Covers hang below their release tick, with the date in mono. Scroll moves the track right to left (D1 ruler, D2 boxes, D3 covers).
- Mobile and reduced motion: a horizontal snap scroller with the same ruler drawn statically.

#### M10 Wire packets
- `data-scene="ledger"`. An SVG mechanism diagram (manual §7.8) with nodes: You → Hosted card page → Your bank (3-D Secure) → Payment provider → Keyrook → Your account.
- Small square packets travel along the wires (SMIL `animateMotion`):
  - **card-data packets** (outlined squares) travel only You → Hosted page → Bank → Provider and **stop** there;
  - at the provider they become a **confirmation token** (a filled square), which travels to Keyrook;
  - Keyrook then sends a **key token** (a filled square with the key glyph) to Your account.

  The geometry itself says "card data never reaches us".
- Paused off-screen (`pauseAnimations()` via IntersectionObserver).
- Reduced motion: static, with each packet type drawn at rest in its segment and the legend visible.

#### M11 Index slide
- The green index line moves to the new detent (260ms `--ease-latch`) and the ticks it passes step lit→unlit (3ms stagger).
- Used by checkout, the price dial and the sliders.

#### M12 Directory peek
- Hover or focus on a genre row slides three real covers in from the right (translateX 16px→0 + opacity, 180ms).
- Fine pointers only; rows are plain links on touch.

#### M13 Door ajar
- The final CTA's small door poster (SVG, ajar at 22°). On fine pointers it rotates ±4° with pointer X, and the covers behind move 6px against it.
- No WebGL (one context per page, and the hero holds it).

#### M14 Plate in
- `data-anim="plate"` on landing section headings and plates: `plate-in` once at 640ms when 20% in view.
- Never on store surfaces.

### 13.3 Budgets and rules
- **WebGL:** only M1 (home). One context per page, DPR ≤1.5, paused off-screen or on hidden tabs, initialised after LCP via idle callback, never created on coarse pointers, `deviceMemory < 4`, `saveData` or reduced motion. The SVG poster plus CSS swing looks complete on its own.
- **Home motion JS:** ≤45 KB gzip before interaction (engine scan, tumblers, lockers, door + OGL loaded after LCP). The theater engine (≈12 KB) and scenes load lazily when near. GSAP and Lenis are **not** needed: the existing ticker plus CSS scroll-driven animations (`@supports (animation-timeline: view())`) cover M3, M9 and M14. Pin progress for M1 and M9 comes from one scroll listener feeding the ticker.
- **CLS 0.** Exactly two pins on the home page on desktop (M1, M9). Every scene reverts on route change.
- **Store surfaces:** functional motion only.

---

## 14. Pages — layout specs

**Global skeleton:** the two-tier header → breadcrumbs (everywhere except home, checkout and auth) → main → the vault-floor footer. The page H1 is the first heading in `main`. Every page has a unique title and description.

Suggested routes are below. If the lead keeps different paths, apply the same specs there.
- `/`, `/catalog`, `/platform/[slug]`, `/type/[slug]`, `/genre/[slug]`, `/deals`, `/new-releases`;
- `/product/[slug]`, `/search`, `/cart`, `/checkout`, `/order/confirmed`;
- `/account`, `/account/keys`, `/account/orders`, `/account/orders/[id]`, `/account/pinned`, `/account/profile`;
- `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/reset`;
- `/how-activation-works`, `/about`, `/faq`, `/contact`, `/policies/*`.

### 14.1 Home — a rich landing with thirteen set-pieces
Every count, minimum price, ranking and list is computed from the database at request time (revalidated). A section whose data is empty, or below its stated minimum, is **omitted**, not padded. No product appears twice on the home page; keep the existing claimed-set logic in `getHomeData`. There are no stats tiles, testimonials, ratings or partner logos.

| # | Section | Composition | Density | Padding top / bottom (desktop) | Background |
|---|---|---|---|---|---|
| 1 | The door (hero) | 6 / 6 split, pinned WebGL | medium | 0 / 0 | `--color-bg` |
| 2 | Security strip | 5 ruled cells, one row | dense | 0 / 0 (80px tall) | `--color-rig`, hairlines top and bottom |
| 3 | Platform vault | unequal locker wall | medium | 112 / 96 | `--color-bg` |
| 4 | Price cuts | 3-col intro + feature box + rail | dense | 80 / 80 | `--color-bg-secondary`, full bleed |
| 5 | The theater | 4 / 8 spotlight with tabs | sparse | 128 / 112 | `--color-bg` |
| 6 | Genre directory | 3-column ruled directory | dense | 96 / 96 | `--color-rig`, full bleed |
| 7 | New releases | pinned horizontal ruler | medium | 96 / 80 | `--color-bg` |
| 8 | Gift cards & subscriptions | 5 / 7 split: card blanks + timetable | dense | 96 / 96 | `--color-bg` |
| 9 | How activation works | 4 / 8 selector + steps + still | medium | 96 / 96 | `--color-bg-secondary`, full bleed |
| 10 | Security ledger | bolted plate, 3-column ledger + diagram | sparse | 112 / 112 | `--color-bg` |
| 11 | Set a budget | 5 / 7 dial + grid | medium | 96 / 96 | `--color-bg` |
| 12 | Questions | 4 / 8 accordion | medium | 80 / 112 | `--color-bg`, hairline top |
| 13 | The door's open | 7 / 5 asymmetric CTA | sparse | 0 / 0 (min 72vh) | `--color-bg-tertiary` |

#### 1. The door (M1, M2)
**Desktop:** 12 columns, height 100svh minus the header; the section pins for 200vh.

**Left, columns 1–6 (L0):**
- the engraved eyebrow "GAME KEY STORE";
- H1 at display-xl, **"Game keys, kept under lock until they're yours."**;
- the lead (step-1, muted): "Games, DLC, gift cards and subscriptions for Steam, Epic, Xbox, PlayStation, Nintendo and more. Pay on a hosted card page with 3-D Secure; your key is delivered to your account, usually within minutes after payment is confirmed." Each clause comes from config and is dropped if false;
- **the primary action is search**: a 56px field (Mona 17px, `Search` 20px) with the placeholder "Search {liveCount} keys", plus Key lg "Search";
- under it, platform plates for the top six platforms by stock as links ("[pip] STEAM 1,940").

**The readout** (D4): a plate row of tumbler numbers under the links. Only true values from the database, each shown only when greater than 0:
- "**4,812** keys in stock" (active, `qty > 0`);
- "**9** platforms";
- "**312** on sale" (a valid compare-at price exists, §17);
- "Catalogue updated **14:20 UTC**" (the last successful `CatalogSyncRun.finishedAt`; if older than 48h, show the date too).

Labels are engraved micro-labels; numbers are tumblers (M2).

**Right, columns 7–12:** the door (poster → WebGL), about 620px square, sitting in a recessed circular frame cut into the D0 wall.

**Mobile (390):**
- eyebrow, H1 at its clamp minimum (40px, three lines), lead, the search field full width, the platform plates as a horizontal scroller;
- then the poster door (88vw) with the CSS swing revealing six covers;
- then the readout as a 2×2 grid of tumbler numbers.

#### 2. Security strip
A single row of five ruled cells, each 18px icon + one line (Mona 15px) + a Text link to the ledger or policy anchor:
1. `CreditCard`: "Card details go on a hosted payment page"
2. `ShieldCheck`: "3-D Secure confirmation by your bank"
3. `Vault`: "Keys encrypted at rest"
4. `ReceiptText`: "PDF invoice with every order"
5. `RotateCcwKey`: "Replacement or refund if a key doesn't work"

- Each cell renders only if its config fact is true (§17).
- Mobile: a 2-column grid; the fifth cell spans both columns.

#### 3. Platform vault (M3)
**Desktop:**
- H2 on the left: "Pick your platform".
- Lead on the right, columns 7–12: "Each locker shows how many keys are in stock for that platform and today's lowest price."
- The **locker wall** in `max-w-wide`: a 12-column grid of tall lockers (300px).
  - Width by stock rank: rank 1 spans 4 columns, ranks 2–3 span 3 columns, all others 2 columns. They wrap; the last row is left-aligned and never stretched.
- **Each locker** is one link (`/platform/[slug]`):
  - a plate door with the engraved platform name (Hubot 680 step-2 caps at 125%) and its pip;
  - the real count in a tumbler ("1,940 keys") and "from €1.49" (real minimum, active currency) in mono;
  - an unlit lamp at the top right;
  - behind the door, three real covers of that platform (most ordered, or newest).
- Platforms with no stock are absent.

**Mobile:** a 2-column grid; rank 1 full width; the first two lockers permanently ajar.

#### 4. Price cuts
**Desktop:**
- **Columns 1–3:** H2 "Price cuts", the lead "Keys priced below their recent price. The earlier price shown is the lowest price in the 30 days before the cut.", and Text "All deals · 312" with `ArrowRight`.
- **Columns 4–12:**
  - one **feature box** (2×2) for the largest real percentage cut that has a screenshot;
  - then a **rail** of 10 deposit boxes ordered by discount, with scroll-snap, Steel icon buttons `ArrowLeft`/`ArrowRight` at the top right, and a mono position readout "1–4 of 10".

Only products with a valid compare-at price (§17). The section is omitted if fewer than 4 qualify.

**Mobile:** H2 and lead, the feature box full width, then the rail as a native horizontal scroller with 72vw cards.

#### 5. The theater (M4, §12)
**Desktop (`FeatureSpotlight` layout extended with tabs):**
- **Columns 1–4:**
  - the engraved eyebrow "HOW IT WORKS";
  - H2 **"Watch a key leave the vault"**;
  - the lead: "Five short demos of the store, played with sample data: choosing a key, paying on the hosted page, revealing the key, redeeming it, and getting help if it doesn't work.";
  - the synced `TheaterSteps` for the active scene;
  - a Text link "Read how activation works".
- **Columns 5–12:** `TheaterTabs` (five scenes), the bezel at 1200:720 plus the controls row.

**Mobile:** H2 and lead, the tab scroller, the stage at the phone preset (max 380px, centred), then the steps list.

#### 6. Genre directory (M12)
A lobby directory board on the `--color-rig` band.

**Desktop:**
- H2 "Browse by genre" on the left, with a one-line lead and "All genres".
- Below: a **3-column ruled directory** of the top 18 genres by real count. Each row (56px) has:
  - the genre name in Hubot 680 step-1 caps at 125% (navigation);
  - a hairline;
  - the count in mono, right-aligned.

  Hover reveals three covers (M12) at the row's right end.

**Mobile:** one column of 48px rows, the top 12, then "All genres".

#### 7. New releases (M9)
- H2 "New releases" with the lead "Released in the last eight weeks and in stock now."
- **Desktop:** the pinned release ruler (§13 M9) with up to 16 deposit boxes hung under their release-week ticks.
- **Mobile:** a snap scroller with the ruler drawn above the boxes.
- **Data:** `releaseDate` within 56 days of today and not in the future. Pre-orders are not listed at all (QC 18.4).
- **Fallback:** if fewer than 4 qualify, the section becomes "Recently added" (by `createdAt`) with a plain rail, and the ruler is dropped (it would show a time scale that means something else). If `createdAt` only reflects sync time rather than real catalogue additions, omit the section instead.

#### 8. Gift cards & subscriptions
**Desktop split:**
- **Columns 1–5: "Gift cards".** H2 and a lead ("Store credit for the platform you play on. Check the card's region before you buy."), then a 2×2 grid of **gift card blanks** (§8.10), one per platform with gift-card stock.
  - Each blank lists its real denominations as Steel sm buttons ("€10", "€20", "€50"), each a link to that product.
  - The blank shows the card's region tag.
- **Columns 7–12, offset 48px down: "Subscriptions".** H2 and a lead, then a **timetable**: a ruled table with one row per service and one column per duration.
  - Services come from data (for example Xbox Game Pass Ultimate, PlayStation Plus Essential, Nintendo Switch Online, EA Play, Ubisoft+).
  - Durations come from data (1, 3, 6, 12 months).
  - Cells are mono price links, or "—" where we have no stock.
  - The last column shows the region.
  - Table heads are engraved labels. It reads like a bank's rate board, not like cards.

**Mobile:** gift card blanks as a horizontal scroller; subscriptions as one block per service with duration buttons ("1 month · €9.99").

**Data:** product kind gift card / subscription, durations parsed from the name or attributes. Either half is omitted without stock.

#### 9. How activation works (selector)
**Desktop:**
- **Columns 1–4:** H2 "How activation works", the lead "Every key activates on the platform named on its page. Pick yours to see the steps.", and a vertical `role="radiogroup"` of platform rows (pip + name; the selected row is lit), listing Steam, Epic Games, EA app, Ubisoft Connect, Xbox, PlayStation and Nintendo, plus GOG and Battle.net if stocked.
- **Columns 5–8:** for the selected platform:
  - "You need: a Steam account and the Steam app";
  - the ordered steps from `src/config/activation.ts`, with step numbers in tumbler slots;
  - code format if known ("Xbox codes have 25 characters");
  - Steel sm "Steam's redeem page" (the platform's name from config) with `SquareArrowOutUpRight`;
  - a Text link "Full guide for Steam" (to `/how-activation-works#steam`).
- **Columns 9–12:** a `MiniStill` of the Redeem scene with `platform` set (static, no engine).

**Mobile:** the platform choice becomes a horizontal segmented scroller; the steps follow; the still sits below at the phone preset.

**`src/config/activation.ts`** (the single source; used here, on the PDP Activation tab, in the KeyPlate disclosure and on the guide page; every entry carries `verifiedAt` and must be re-checked against the platform's own help page before launch):

| Platform | You need | Steps | Platform's own page |
|---|---|---|---|
| Steam | a Steam account and the Steam app | Open Steam and sign in → **Games** menu → **Activate a Product on Steam…** → enter the key and follow the prompts → the game appears in your Library | store.steampowered.com/account/registerkey |
| Epic Games | an Epic Games account | Sign in to the Epic Games Launcher or epicgames.com → open your account menu → **Redeem Code** → enter the key → **Redeem** | Epic's redeem page (URL in config, verify) |
| EA app | an EA account and the EA app | Open the EA app and sign in → open the menu (☰) → **Redeem code** → enter the key → **Next** | in-app only |
| Ubisoft Connect | a Ubisoft account and Ubisoft Connect for PC | Open Ubisoft Connect and sign in → open the menu (☰) → **Activate a key** → enter the key → confirm | in-app (or the Ubisoft Store account page, verify) |
| Xbox | a Microsoft account | Go to redeem.microsoft.com and sign in with the account you play on (or on console: Microsoft Store → **Redeem**) → enter the 25-character code → confirm | redeem.microsoft.com |
| PlayStation | a PlayStation Network account in the key's region | On PS5: PlayStation Store → **…** (more) → **Redeem Code**; or store.playstation.com → your profile → **Redeem Codes** → enter the 12-character code → confirm | store.playstation.com |
| Nintendo | a Nintendo Account (Nintendo Switch) | Nintendo eShop → select your user → **Redeem Code** → enter the 16-character code → confirm | Nintendo's redeem page (URL in config, verify) |
| GOG | a GOG account | Go to gog.com/redeem → sign in → enter the key → confirm | gog.com/redeem |
| Battle.net | a Battle.net account and the Battle.net app | Open Battle.net → your account menu → **Redeem a Code** → enter the key → confirm | in-app or account.battle.net (verify) |

Menu names are rendered as UI words in bold Mona, never as logos or screenshots.

#### 10. Security ledger (M10)
**One bolted plate** (`--color-plate`, four bolts) in `max-w-container`, 48px padding:
- the engraved eyebrow "SECURITY";
- H2 **"What's in the vault, and what never is"**.

**A three-column ledger** (ruled columns, engraved heads):
- **KEPT, ENCRYPTED.**
  - "Your keys. Stored encrypted (AES-256) and decrypted only when you choose Reveal in your account."
  - "Your orders and PDF invoices, for as long as the law requires ({retention} years)."
- **NEVER STORED BY US.**
  - "Your card number, expiry date and security code. You type them on the payment provider's hosted page, not on Keyrook."
  - "Your bank's 3-D Secure confirmation happens between you and your bank."
- **IF SOMETHING GOES WRONG.**
  - "A key that doesn't work is replaced, or refunded if no replacement is available."
  - "If a payment fails, you aren't charged."
  - "We reply within 1 business day."

  Each line links to the policy that says it.

**Below, inside the plate:**
- columns 1–8: the **wire diagram** (M10) with its legend: "Card details (outlined squares) stop at the payment provider. Keyrook receives only the confirmation (filled squares).";
- columns 9–12: a `MiniStill` of the Pay scene at the challenge state, captioned "The 3-D Secure step, shown with sample data".

Every sentence is rendered only when its fact is true in config (§17). If the hosted page or 3-D Secure is not live, those lines and the Pay still are removed, not reworded.

**Mobile:** the ledger stacks into three blocks, then the diagram turns vertical (nodes top to bottom), then the still.

#### 11. Set a budget (M11)
**Desktop:**
- **Columns 1–5:**
  - H2 "Set a budget";
  - the lead "Turn the dial to a price band. Bands are in your currency.";
  - the **rotary dial** (§8.22, 300px) with detents at the active currency's bands (from `src/config/merchandising.ts`: EUR/GBP/USD each 5 / 10 / 20 / 40 and up);
  - under it, a tumbler count "412 keys" and Text "See all 412 keys from €10 to €20".
- **Columns 6–12:** a 4×2 grid of deposit boxes from the selected band (mixed platforms, most ordered first, or newest).

All five bands are rendered on the server (40 boxes, hidden bands `hidden`) and swapped on the client, so turning the dial never waits for a request. A band with fewer than 4 products is disabled on the dial (its label faint, not a detent).

**Mobile:** the dial at 232px centred, the count and link, then a 2×2 grid.

#### 12. Questions
- **Desktop:** columns 1–4 hold H2 "Questions", Steel "All questions" and the line "Can't find it? Contact us" (link). Columns 5–12 hold six accordion items, word for word from the FAQ page:
  - "How fast do I get my key?"
  - "What does the region on a key mean?"
  - "Where do I redeem my key?"
  - "My key doesn't work. What now?"
  - "Is my card information safe?"
  - "Can I cancel or get a refund?"
- **Mobile:** stacked.

#### 13. The door's open (M13)
**Desktop:** asymmetric on `--color-bg-tertiary`, min 72vh.
- **Columns 1–7:** H2 at step-6 "The door's open.", one line "Search the catalogue, or start with your platform.", the same search field as the hero, and the platform plates.
- **Columns 9–12:** the small door poster ajar at 22° with six covers behind it (real, distinct from the hero's).

**Mobile:** the text and search first, the door below at 72vw.

### 14.2 Catalogue (`/catalog`)
- **Opener:** H1 "All keys" (Hubot step-5) with the tumbler count beside it and one sentence on what's in stock. On the right (desktop), a type index row: "Games 3,920 · DLC 610 · Gift cards 140 · Subscriptions 96 · Software 46", in Hubot 600 caps for names and mono for counts, with a green bar on hover.
- **Body:** the filter panel (280px) on the left, results on the right, the toolbar (result sentence + chips left, sort right), the deposit-box grid, then pagination or Load more.
- **Empty results:** the empty state "No keys match these filters", the active chips with "Clear all", and the three broadest real suggestions ("Remove Europe to see 214 more").
- **Mobile:** the sticky toolbar (Filter, Sort), a 2-up grid with 10px gaps.

### 14.3 Platform landing (`/platform/[slug]`, e.g. Steam)
- **Opener:** a full-width **locker plate** band (`--color-plate`, machined edge):
  - the pip and H1 "Steam keys" (step-5);
  - the tumbler count, and "from €0.99" (real minimum);
  - the sentence from the platform table ("Activates on a Steam account. You need the Steam app.");
  - Text "How to redeem on Steam" with `ArrowRight` (to the guide anchor);
  - on the right, the type index for this platform with counts.
- **Then:** one feature box (the most ordered title on this platform) beside the first row of the grid, then the standard filter + grid (Platform group hidden).
- **Empty platform:** "No Nintendo keys in stock right now" with links to the other platforms' lockers.

### 14.4 Type landings (`/type/[slug]`)
| Type | Opener icon | Page |
|---|---|---|
| Games | — | the standard catalogue |
| DLC | `PackagePlus` | the standard catalogue; every card shows "Needs the base game"; a line under the H1: "DLC needs the base game on the same platform and region." |
| Gift cards | `WalletCards` | gift card blanks grouped by platform (one row per platform: blanks with denominations), then the standard grid with filters |
| Subscriptions | `CalendarSync` | the timetable (§14.1 section 8) at full width first, then the grid |
| Software | — | the standard catalogue; system requirements apply on the PDP |

### 14.5 Genre (`/genre/[slug]`), Deals (`/deals`), New releases (`/new-releases`)
- **Genre:** H1 with the tumbler count, then a platform split row ("Steam 412 · Xbox 88 · …"), then filter + grid.
- **Deals:** H1 "Price cuts" with the count, and one ruled note: "The earlier price is the lowest price this key had in the 30 days before the cut." Default sort is biggest discount. Filter + grid.
- **New releases:** a static release ruler (the last 8 weeks) as the opener, then the grid sorted by release date, newest first. Only released titles.

### 14.6 Product page (`/product/[slug]`)
**Desktop, 12 columns:**
- **Media (columns 1–5):**
  - the cover at 3:4 inside an 8px plate frame (the drawer face, large);
  - under it, a strip of 16:9 screenshot thumbnails (4 visible, horizontal scroll) that open a gallery dialog with arrow-key navigation;
  - if the feed has a trailer ID, Steel sm "Watch trailer" opens a click-to-load facade dialog (nothing third-party loads before the click).
- **Purchase column (columns 6–12, sticky from 120px while the media column scrolls):**
  - breadcrumbs ("Catalogue / Steam / Action");
  - the label row (14px) with the edition tag;
  - H1 = title (Hubot step-5);
  - a facts line in muted ("Developer · Publisher · 2024");
  - the **edition selector** (§8.23, if any);
  - the **buy box**;
  - the **requirements panel** "Before you buy".
- **Below the fold, full width:**
  - Tabs: **About** (the sanitised description at 68ch, collapsed after 12 lines with "Read more"), **Activation** (the platform steps from config, the verbatim `activationDetails`, the platform's own redeem link), **System requirements** (PC only, §8.23), and **Details**.
  - The **Details** ruled table lists Platform, Region (with the verbatim note), Type, Edition, Languages, Developer, Publisher, Release date, Genres, and "Keyrook catalogue no." (our own SKU, quoted in support).
  - "Also on other platforms": compact rows for the same title on other platforms (real only).
  - "More for Steam": one row of 5 deposit boxes (same genre, same platform, distinct).
  - Recently viewed.
- **JSON-LD:** Product + Offer (active currency, availability) and BreadcrumbList. No AggregateRating (there are no reviews).

**Mobile:**
- the top row: the cover at 40% width beside the label row, the H1 (step-4) and the price;
- then the edition selector, the buy box, "Before you buy", and the tabs as accordions;
- a sticky bottom bar (64px, `--color-raised`, top hairline) with the price in mono and Key "Add to cart", which appears once the buy box's button leaves the viewport.

### 14.7 Search (`/search`)
- H1 is the query, `“lantern”` (Hubot step-5), with the tumbler count. The large search input is above it, prefilled.
- Platform and genre matches appear as text links with counts, then the standard filter + grid.
- **No results:** "Nothing matches “xyz”." with the suggestions: check spelling, search without the edition name, browse by platform (lockers as links).

### 14.8 Cart (`/cart`)
- H1 "Cart" with the count in a tumbler.
- **Desktop:**
  - rows in columns 1–8: a 90×120 cover, the label row, title, facts, quantity, price, Remove; hairlines between rows;
  - the **summary** in columns 9–12: a sticky plate with 24px padding, holding Subtotal, Total (label per the VAT rule) in mono step-2, the line "Keys are delivered to your account after your payment is confirmed.", Key lg "Checkout", Text "Continue shopping", logos at 24px, and the merchant line (legal name + support email) in 14px.
- **Mobile:** stacked rows, the summary at the end, and a sticky bar "Checkout · €29.99".
- **Empty:** the drawer's empty state at page scale.

### 14.9 Checkout (`/checkout`), three steps (§8.28)
**Frame:** a minimal header (wordmark, `ShieldCheck` "Secure checkout", Text "Back to cart") and the compact footer, in `max-w-narrow`. The dial ruler progress runs across the top.

**Desktop:** steps in columns 1–7; the **summary** in columns 8–12, sticky, with compact rows, subtotal, total, the charge-currency note, and policy links (Terms, Refunds, Privacy) at 14px.

**Step 1 — Account.**
- Signed in: a one-line summary ("Signed in as alex@example.com") with Text "Not you? Switch account".
- Signed out: the sentence "Your keys are kept in your account, so you'll need one to receive them." and two tabs, "Sign in" and "Create account". Create account is a short inline form (email, password, Terms) that completes the full profile later.
- Continue.

**Step 2 — Billing details.**
- Full name, email for receipts (prefilled), country (restricted list excluded via config), address line, city and postcode (used on the invoice).
- Continue.

**Step 3 — Review and pay.**
- A read-only summary of steps 1–2 with "Change" links.
- The items as compact rows. Each row carries a **region line** in Mona 14px ("Region: Europe. Activates only on accounts registered in Europe.").
- **Checkboxes:**
  - (required unless `STORE_POLICY.checkout.requireRegionCheck` is false) "I've checked the platform and region of each key.";
  - (required) "I have read and agree to the Terms and Conditions" (link);
  - (required) the **digital-delivery consent**, word for word from `STORE_POLICY.waiver.text`, rewritten for keys: "I ask for my keys to be delivered straight after payment and I understand I lose my right to cancel once a key is delivered." This links to the Refund policy, and the wording must match the Terms and Refund policy exactly.
- Key lg "Pay €29.99", enabled only when all required boxes are ticked.
- Under it: Visa / Mastercard / PCI DSS at 28px, and the line "You'll enter your card details on {provider}'s hosted payment page with 3-D Secure. We never see or store your card number." This is gated by config and matches the Privacy Policy.
- On submit: the loading state, then the existing provider redirect.

**Mobile:** the summary collapses into a top accordion ("Show summary · €29.99"), the steps follow, and Pay is full width.

**Payment failed on return:** an alert above step 3: "Your payment didn't go through. You haven't been charged." with "Try again".

### 14.10 Order confirmed (`/order/confirmed`)
- A narrow column. H1 "Payment received" (and "Payment confirmed" once the server confirms it; it never claims the key is delivered before it is).
- The order number in tumblers (M2) with a `Copy` icon button.
- The **order timeline**, live (polling, M8).
- "We've sent a receipt to {email}. Your keys appear in Account → Keys as soon as they're issued."
- Once issued, the **key plate(s)** render inline, masked; Reveal works here too.
- Buttons: Key "Go to my keys", Steel "Continue shopping". Text "Download invoice (PDF)" with `FileDown` once the invoice exists.

### 14.11 Auth
- **Sign in (`/auth/login`):**
  - Desktop has two columns (max 960px) separated by a 1px vertical hairline.
  - **Left:** H1 "Sign in"; email; password (show/hide); Text "Forgot your password?"; Key lg "Sign in"; the error summary "Email or password is incorrect."
  - **Right:** H2 "New to Keyrook?" (step-3) and three true points as a plain list:
    - "Your keys are kept in your account, encrypted";
    - "Reveal and copy them when you're ready to play";
    - "Every order comes with a PDF invoice".

    Then Steel "Create an account".
  - Mobile: the form first.
- **Register (`/auth/register`):**
  - A 560px column with the **dial ruler** progress across four detents: **01 ABOUT YOU · 02 CONTACT · 03 ADDRESS · 04 PASSWORD**.
  - It keeps the existing required fields and the T&C gate:
    1. first name, last name, date of birth (minimum age from `STORE_POLICY.minAge`, with the error naming the rule);
    2. email, phone (with country prefix, optional per config);
    3. country (restricted list excluded), street, city, postcode;
    4. password with the strength hint "At least 8 characters, one number", confirm password, the required Terms checkbox, and an **unticked** marketing opt-in. Key lg "Create account" stays disabled until Terms is ticked.
  - Moving between steps follows §8.28 (focus to heading, live region).
- **Forgot / reset password:** a single 480px column, restyled.

### 14.12 Account (`/account/**`)
**Layout:**
- Desktop: a 240px left nav of text rows (Overview, Keys, Orders, Pinned, Profile, then a hairline and Sign out). The active row is ink with a lit lamp; the others are muted.
- Mobile: a horizontal scroller of the same rows under the H1.

**Overview:**
- H1 "Hello, {first name}".
- One line with real counts: "2 keys not revealed yet · 5 orders", with links.
- The latest order as a compact row with its status tag and "View".
- No stat tiles.

**Keys (`/account/keys`)**, the account's heart:
- H1 "Keys" with the count.
- Tabs: All · Not revealed · Revealed · Reported.
- KeyPlates, newest first, grouped by order. Each group has a mono header row with the order number and date.
- Empty: "No keys yet. Keys you buy appear here after your payment is confirmed." with Key "Browse the catalogue".

**Orders:**
- H1 "Orders". A ruled list, not cards. Each order block has:
  - a header row: order number (mono), date (mono muted), total (mono) and status tag;
  - compact rows of the items;
  - the compact timeline;
  - Text "Invoice (PDF)" with `FileDown`, and "View order".
- In-flight orders come first. The page polls while any order is in flight.

**Order detail:**
- H1 "Order KR-…" with a status tag.
- The timeline (large).
- The key plates.
- The payment summary: amount, currency, card brand and last four digits **only if the provider returns them**.
- Invoice download.
- "Need help with this order?", linking to contact with the order number prefilled.

**Pinned:** a deposit-box grid, 3-up (2-up on mobile). Out-of-stock items use the card's out-of-stock state.

**Profile:** accordion groups (Personal details, Address, Password, Delete account), each with its own Save button and a success toast.

### 14.13 How activation works (`/how-activation-works`) — landing surface
1. **Hero:** H1 (Hubot step-6) "How activation works" and the lead "Your key is delivered to your account after payment is confirmed. You redeem it on the platform named on the product page." Then the platform plates as jump links.
2. **"From payment to key":** a `FeatureSpotlight` with the **Decrypt** scene (the page's only playing theater).
3. **One section per platform** (`id="steam"` etc.), each holding:
   - H2 with the pip;
   - "You need";
   - the steps;
   - the code format;
   - the platform's own redeem link;
   - "Common problems" as ruled rows: "The key is for another region", "The key says it was already used", "The platform asks for a different account type";
   - a `MiniStill` of Redeem for that platform beside the steps (desktop, columns 8–12).
4. **"If a key doesn't work":** ruled rows explaining the report flow and the replacement-or-refund rule, with the reply time.
5. Key "Browse the catalogue".

Reading blocks are capped at 68ch. No invented guarantees.

### 14.14 About, FAQ, Contact, Policies
- **About (`/about`):**
  - H1 "A store for game keys" with a step-1 lead;
  - "What we offer": games, DLC, gift cards and subscriptions for the listed platforms; our prices, shown in your currency;
  - "How an order works": three ruled rows linking to the activation guide;
  - "How we keep your keys": a link to the home ledger anchor;
  - the credentials plate;
  - Key "Browse the catalogue".

  No founder stories, no pull-quotes, no numbers that aren't data.
- **FAQ (`/faq`):**
  - H1 "Questions";
  - desktop: a left sticky group index (Buying, Delivery, Activation & regions, Payment & security, Refunds & key problems, Account) with a lit lamp on the active group, and accordion groups on the right;
  - answers match the policies word for word on numbers;
  - "Still need help?" with Steel "Contact us";
  - FAQPage JSON-LD.
- **Contact (`/contact`):**
  - Left, columns 1–5: H1 "Contact us", one line with the real support hours and reply time from config, the credentials plate, and "Have your order number ready", with links to the activation guide and the Refund policy.
  - Right, columns 7–12: the form, with fields:
    - name;
    - email;
    - order number (optional, mono);
    - subject select: Order, Key not working, Payment, Account, Other;
    - message.

    Submit is Key "Send message".
  - Success replaces the form.
- **Policies (`/policies`, `/policies/*`, `/pages/[slug]`), `PolicyLayout`:**
  - The index: H1 "Policies" and a ruled list, each row with the title (Hubot 600 step-2), a one-line scope and "Last updated {date}" in mono muted.
  - A policy page: a desktop left 240px sticky index (the active row lit) plus "On this page" from the H2s; a main column at 68ch with H1 (step-5), a neutral "Last updated" tag, numbered H2s at step-3, body 16px at 1.7, and ruled tables.
  - The Cookie table lists the localStorage keys: cart, theme, pinned, currency, `keyrook-consent`.
  - The shipping policy becomes a **Delivery policy** (digital delivery to the account; no carriers, no addresses).
  - Mobile: a "Jump to policy" select and an "On this page" accordion.
  - Print: header and footer hidden, black on white.

### 14.15 404 (`src/app/(store)/not-found.tsx`)
- A 200px **dial** (SVG) whose index line points at a tumbler readout **4 0 4** beside it. The tumblers roll in once (M2).
- H1 (step-5) "This door doesn't open", with the line "The page doesn't exist, or the key is no longer listed."
- The search field, the platform plates as links, and Text "Back to home".
- A real 404 status.

### 14.16 Error states
- Inline form errors per §8.2. Page fetch errors use the Alert.
- `global-error.tsx`: H1 "Something went wrong", one line, Key "Try again", and the support email.
- Price unavailable: the card and buy-box states (§8.10, §8.23).
- Key issuing delayed: the timeline branch "Issuing is taking longer than usual. We'll email you as soon as your key is ready. You can also contact us with your order number."

---

## 15. Imagery rules for game covers and screenshots

1. **Covers carry the colour; the UI never competes.** Every cover sits in a recessed stage (`--color-stage`) inside a plate frame. Covers never sit directly on the page colour.
2. **Ratios are fixed per placement:**

   | Placement | Ratio |
   |---|---|
   | cards, rows, PDP, vault map, door interior | 3:4 |
   | screenshots and the feature box | 16:9 |
   | gift card blanks | 1.586:1 |
3. **Fit by real proportions** (§8.9): `object-cover` only for portrait art between 0.68 and 0.82; everything else `object-contain` on the steel-grain stage. Never stretch, never rotate, never mirror.
4. **No blur, tint, duotone, colour wash, gradient overlay or text overlay on covers.** No badges or stickers on covers. The only things allowed on top of a cover are the hover drawer movement and the out-of-stock opacity.
5. **Storage:** covers and screenshots are **mirrored to our storage** at sync and served from our domain through `next/image` with correct `sizes` (QC §10, 18.4). No supplier host appears anywhere: not in `remotePatterns`, alt text, structured data or feeds.
6. **Alt text:**

   | Image | Alt |
   |---|---|
   | cover | "{title} cover art" |
   | screenshot | "{title} screenshot {n}" |
   | decorative (door interior, locker previews, peeks) | `alt=""`, with the same products available as real links nearby |
7. **Screenshots:** used on the PDP gallery and the feature box only, never as page backgrounds.
8. **Trailers:** only behind a click-to-load facade. No autoplay, no third-party embed before consent and a click.
9. **What the store never shows:**
   - stock photography, gamer lifestyle photos, controllers, headsets or neon rooms;
   - AI-generated art, platform logos (names are text), console hardware renders;
   - mock "key cards" printed with fake codes outside the theater.
10. **The hero, lockers, door interior and directory peeks** pick covers by real data rules (most ordered, newest, in stock, has a cover). They are never hand-picked files that may go out of stock.
11. **Inside the theater only:** fictional sample titles with generated flat covers (`SampleCover`), always labelled "Sample data".

---

## 16. Copy and content rules

- **English UI, British spelling** ("catalogue", "licence", "colour" in prose), with the existing currency formatting. Plain, specific, true.
- **Store model only.** Customers buy keys from Keyrook. Never use these words in UI copy, metadata or emails:
  - "sell", "seller" (use "offer", "in stock", "available");
  - "marketplace", "payout", "withdraw", "withdrawal", "deposit" (as money), "balance", "escrow", "P2P", "list your key", "trade".

  The legal cancellation wording is "right to cancel" (§14.9).
- **No authenticity or speed claims that the store cannot prove:**
  - no "official", "original", "authorised", "legit", "100%", "sold once", "guaranteed", "instant", "within seconds", "no risk";
  - this includes links: write "Steam's redeem page" or "the platform's own redeem page", never "official redeem page";
  - delivery wording is exactly "**Delivered to your account, usually within minutes after payment is confirmed.**" (from `POLICY_FACTS`);
  - the guarantee wording is exactly "**Replacement or refund if a key doesn't work**", with the detail in the Refund policy.
- **Security claims** appear only when true in config (§17) and match the Privacy Policy:
  - "Card details are entered on {provider}'s hosted payment page."
  - "3-D Secure confirmation by your bank."
  - "Keys are encrypted at rest."
  - "We never see or store your full card number."
- **The supplier is invisible.** No supplier name, domain, ID, "marketplace price", "vs retail", price comparisons with other stores, or supplier-related discounts. Prices are our prices.
- **Honest deals.** A "was" price is the lowest price of that product in the 30 days before the reduction, from our own price history (EU price-indication rules). Without history there is no deal display. No countdowns, no "ends soon", no "hot", no "trending", no "best seller" unless ranked by real order data and labelled "Most ordered this month".
- **No pressure.** No stock counts on cards, no "only 2 left", no timers.
- **Region honesty.**

  | Region | Sentence |
  |---|---|
  | Global | "No regional lock" |
  | Others | "Activates only on accounts registered in {region}" |

  The supplier's verbatim limitation note always follows in mono. Items restricted to sanctioned markets, or requiring a VPN, are never listed (QC 16, 18.4).
- **Key and order status copy** (tightened from keyarcade; one sentence each):

  | Status | Copy |
  |---|---|
  | Awaiting payment | "Waiting for your payment to be confirmed." |
  | Payment confirmed | "Payment received. Your key is being issued." |
  | Key issued | "Your key is ready in your account." |
  | Issuing delayed | "Issuing is taking longer than usual. We'll email you as soon as your key is ready." |
  | Reported | "We're checking your key. We reply within {replyTime}." |
  | Replacement issued | "We've issued a replacement key." |
  | Refund pending | "Your refund is being processed." |
  | Refunded | "Refunded to your card." |
  | Payment failed | "Your payment didn't go through. You haven't been charged." |
- **The key email** says "Your key is ready" and links to Account → Keys. **It does not contain the key** (config `KEY_IN_EMAIL=false`, the default), which keeps the security story true. If the lead turns that on, remove "Decrypted only when you choose Reveal" from the ledger and the theater tip.
- **Buttons are verbs:** Search, Add to cart, Buy now, Checkout, Continue, Pay €29.99, Reveal key, Copy key, Redeem on Steam, Report it, Send message, Save choices, Create account.
- **Section titles** may use the vault voice lightly ("Watch a key leave the vault", "What's in the vault, and what never is", "The door's open"). Navigation, filters and labels always use the plain names (Steam, DLC, Gift cards, Region, Europe).
- **Banned words:** "elevate", "seamless", "effortless", "unleash", "level up", "epic deals", "gamers", "next-level", "premium", "curated", "ultimate" (except in a real product name), "GG", "loot".

---

## 17. Data and config the design depends on (for the lead)

The design shows only what these provide. If a field is missing, the UI element is omitted, never faked.

**Product (from the sync, keyarcade's normaliser extended):**
- `platform` (raw) → platform slug via `src/lib/catalog/platforms.ts`;
- `region` code plus the verbatim `regionNote`;
- `kind` (game / dlc / giftcard / subscription / software);
- `genres[]`, `languages[]`, `releaseDate`;
- `edition` and a normalised `baseTitle` (for the edition selector and "other platforms");
- `developers[]`, `publishers[]`, `ageRating?`, `systemRequirements`, `activationDetails`;
- `coverUrl` (mirrored), `coverWidth`, `coverHeight` (probed once at sync), `screenshots[]` (mirrored), `trailerId?`;
- `qty`, `price`, `currency`;
- `sku` (our catalogue number);
- `createdAt` (first seen in the catalogue, not touched by re-syncs);
- an order count for rankings.

Pre-orders and sanctioned-region or VPN items are filtered out at sync.

**Price history:** a `PriceHistory` model (`productId`, `price`, `currency`, `recordedAt`) written when a price changes. `compareAtPrice` = the lowest price in the 30 days before the current reduction. A deal exists only when the price is below it by at least `STORE_POLICY.deals.minPercent` (default 5).

**Key storage:** a `KeyDelivery` per issued key holding:
- `ciphertext`, `iv`, `authTag` (AES-256-GCM, key from `KEY_ENCRYPTION_KEY`, rotated per the security runbook);
- `format` (text | image), optional `pin`;
- `issuedAt`, `revealedAt`, `reportedAt`;
- `status`, `replacedById`.

The reveal endpoint decrypts for the signed-in owner only and logs the first reveal.

**`STORE_POLICY` facts that switch copy on and off:**

| Fact | Effect |
|---|---|
| `payment.hostedPage`, `payment.threeDSecure`, `payment.providerName` | security strip cells 1–2, ledger lines, the checkout note, theater S2 |
| `security.keysEncryptedAtRest` | true only once `KeyDelivery` encryption ships; strip cell 3, ledger, theater S3 tip |
| `invoices.pdf` | strip cell 4, order pages |
| `guarantee.faultyKey` | strip cell 5, buy box row, ledger, theater S5 |
| `delivery.method` = "to your account", `delivery.usualTime` = "usually within minutes after payment is confirmed" | header status line, buy box, cart, FAQ |
| `support.replyTime` | report flow, ledger, theater S5 caption |
| `checkout.requireRegionCheck` | step 3 checkbox |
| `limits.maxQtyPerItem`, `limits.giftCardMaxPerOrder` | quantity stepper |
| `waiver.text` | the key wording in §14.9 |
| `deals.compareWindowDays` (30), `deals.minPercent` (5) | deal display |
| `retention.orderRecordsYears` | ledger |

Remove the CS2 delivery fields (trade offer, trade protection, Steam requirements) from `STORE_POLICY` and `POLICY_FACTS`.

**Home data (`getHomeData`):**
- live in-stock count;
- platforms with count, minimum price, top covers and rank;
- on-sale count; last successful sync time;
- the deal list, genre counts, recent releases;
- gift cards grouped by platform with denominations;
- subscriptions grouped by service and duration;
- price-band lists for the active currency;
- the hero door's 12 covers and the final CTA's 6.

All of it is distinct by the claimed set and cached with revalidation.

---

## 18. Accessibility and quality floor

- **WCAG 2.2 AA:** contrast as measured in §3.2–3.3 in both themes; every control has a visible square focus ring; touch targets ≥44px.
- **Landmarks:** `header`, `nav` (main, breadcrumb, footer, account), `main`, `footer`. One H1 per page, then H2/H3 in order.
- **ARIA patterns:**
  - disclosure (filter groups, vault map, accordions);
  - tabs (theater, PDP, account keys);
  - combobox (search, language filter);
  - dialog (cart, gallery, report, preference centre, mobile sheets);
  - slider (price, year, rotary dial, checkout ruler when interactive);
  - radiogroup (segmented controls, edition selector, activation selector);
  - switch (cookies, on sale);
  - live regions (cart, steps, order status, key reveal/copy, quantity clamp).
- **Never colour alone:** platform and type are always named in text; lamps always sit next to a word; deals carry the percentage and "Was" in text.
- **Keys:**
  - slashed zero and distinct 1/I/l by font choice;
  - "Spell it out" for console entry;
  - copy with a keyboard fallback;
  - focus to Copy after reveal.
- **Keyboard:** everything reachable and operable, including lockers, the rotary dial (arrows, Home/End), the theater tabs and the play/pause knob. Esc closes every overlay and returns focus.
- **`prefers-reduced-motion`:** every moment shows its static state (§13.2). No pin, swing, roll, decrypt animation or WebGL. The theater shows stills plus step lists.
- **Performance:**
  - LCP ≤2.5s on mid-tier 4G (the hero LCP is the H1 text); CLS 0; INP ≤200ms;
  - covers lazy below the fold;
  - fonts latin + latin-ext only, with one preloaded file;
  - WebGL only on the home hero, after LCP.
- **Theme parity:** every screen checked in Strongroom and Counter Hall.
- **SEO:** unique titles and descriptions; Product (with Offer), BreadcrumbList, FAQPage, Organization and WebSite + SearchAction JSON-LD; OG image per §9.3.
- **QC items that touch design:**
  - payment logos in the footer and at checkout; credentials in the footer;
  - the platform disclaimer; "Cookie settings";
  - multi-step registration with required fields and the T&C gate;
  - the digital-delivery consent checkbox at payment;
  - platform, region, languages, edition, requirements and validity on the product page;
  - system requirements only for PC titles;
  - no pre-orders, no supplier traces, no fake stock, ratings or claims.

---

## 19. Implementation order

1. **Tokens:**
   - `variables.css` (dark in `:root`, Counter Hall in `[data-theme="light"]`);
   - `@theme inline` additions (plate, steel-hi, lamp, deal, platform and type colours, the type scale, `rounded-round`, the machined shadows, the new utilities);
   - the `tailwind.config.ts` mirror;
   - fonts (install/uninstall, `fonts.css`, preload);
   - global base rules;
   - animations clean-up;
   - `tokens.ts`;
   - `theater.css`.
2. **Sweeps** (§2.5).
3. **Primitives:** Button, Field, Select, Choice (checkbox, radio, switch, segmented), Plate (tags), Chip, Tabs, Accordion, Dialog, Toasts, Alert, EmptyState (empty deposit box), Breadcrumbs, Pagination, QuantitySelector, PriceDisplay, **Tumbler**, **Dial family**, **Lamp**.
4. **Key-store components:** `platforms.ts` mapping, label row, Cover, DepositBox (standard, compact, feature, gift card blank), deal plate, buy box, edition selector, requirements panel, system requirements, OrderTimeline, **KeyPlate** (with the reveal endpoint contract), report dialog.
5. **Layout:** header (two tiers, vault map, mobile sheet, search dialog), footer (vault floor, credentials plate, logo strip), cookie banner and preference centre.
6. **Pages:** catalogue → platform → type → genre → deals → new releases → product → search → cart drawer and page → checkout → order confirmed → account (keys first) → auth → how activation works → about, FAQ, contact, policies → 404 → home. Build the static end states of every home section first.
7. **Theater:** the port (§12.2), the bezel and controls, `SampleCover`, the five scenes, `MiniStill`, demo mode on the real components.
8. **Brand:** logo, favicon, manifest, metadata, invoice fonts and colours.
9. **Hand-off** to the motion engineer with the hooks from §13 in place (door poster, data attributes, static states).
10. **Verify:** `npm run build`; check every page at 390 / 768 / 1280 / 1536, in both themes and with reduced motion; run the theater with `?t=` frozen frames for screenshots.

---

## 20. Slop self-audit — the result must pass every line

**Visual**
- [ ] Rectangles are 0px everywhere. Circles appear only on hardware (dial, bolts, lamps, radio dots, switch knobs, timeline nodes, the theater knob, avatar initials) and only on square boxes. No pills, bevels, chamfers or rotated elements.
- [ ] `--steel-grain` is the only gradient, and it appears only on the door poster, the key plate and the credentials plate. No glow, glass, blur (including blurred cover backdrops), blob, mesh, neon or gradient text.
- [ ] Green appears only on actions, focus, lamps, the index line, active bars and the settling decrypt character. Count the greens in any viewport: no more than four that aren't buttons.
- [ ] Platform colour appears only as square pips beside platform names; type colour only as type-tag text; deals are an inverted ink plate, never red.
- [ ] Not everything is a card. The header, filters, directory, timetable, ledger, account nav, orders, FAQ, policies and spec tables are typography plus hairlines. Boxed objects are deposit boxes, plates (buy box, key plate, lockers, bezel, ledger, credentials) and dialogs.
- [ ] Importance varies: unequal lockers, feature boxes, a lead deal, one hero door. No grid of identical components where importance differs.
- [ ] Hubot Sans (expanded), Mona Sans and Red Hat Mono are the only families. No Sofia, Source Sans, Martian, Inter, Manrope, Space Grotesk, Anton, Archivo, JetBrains Mono, Silkscreen or system-ui as identity. Mono never sets sentences.
- [ ] Type-scale tokens everywhere, with no stray sizes. Uppercase only on Hubot labels, buttons and nav.
- [ ] Section padding differs per section as in §14.1.
- [ ] Icons are Lucide only, 1.75 stroke with square caps, never in circles, never decorative. The cart is `Archive`, save is `Pin`, account is `UserKey`. No gamepads, joysticks, sparkles or flames.
- [ ] Covers are never blurred, tinted, overlaid or rotated, and always sit in a recessed stage.

**Content and honesty**
- [ ] Every number on the home page and in the header is from the database (counts, minimum prices, sync time) or omitted. Tumblers never show invented values outside the theater, and the theater always shows "Sample data".
- [ ] No "official", "original", "instant", "sold once", "guaranteed" or marketplace words. Delivery and guarantee wording match §16 exactly.
- [ ] Security statements render only when true in config, and match the Privacy Policy. The key email does not contain the key unless the copy was changed accordingly.
- [ ] Deals use the 30-day lowest price from our own history. No countdowns or pressure.
- [ ] No supplier mention anywhere: UI, image URLs, alt text, metadata, feeds.
- [ ] The footer has credentials from `COMPANY`, the trading-name line, the platform disclaimer, coloured Visa/Mastercard/PCI DSS on the light strip, and "Cookie settings".
- [ ] No CS2, Patinaskins or Brasmora leftovers (copy, components, metadata, rarity, lamp, float, trade offer).

**Function and accessibility**
- [ ] Both themes are designed and verified; no `text-white` on green.
- [ ] Focus rings are visible on every control, including lockers, dial thumbs and the theater knob.
- [ ] Filters, sliders, the rotary dial, segmented controls, tabs, dialogs, the theater and the timeline follow their ARIA patterns and work by keyboard.
- [ ] Reduced motion shows complete static designs; the theater shows stills and step lists.
- [ ] Mobile is composed, not desktop stacked:
  - search-first hero with the door below;
  - the locker grid with rank 1 full width;
  - the bottom-sheet vault map;
  - the bottom filter sheet;
  - sticky buy and checkout bars;
  - the phone-preset theater;
  - the accordion footer.
- [ ] Product pages state platform, region (with note), languages, edition, requirements and validity. System requirements appear only for PC titles.

**Distinctness**
- [ ] Side by side with Inspection Bay: two steel tiers vs one dark rig; deposit boxes with covers vs trays with spines; 0px keypad keys with machined edges vs 2px amber buttons; `Archive` vs `ShoppingCart`; vault floor with bolted plate vs ruler band; dial and tumblers vs lamp and ruler; different faces and a different home order.
- [ ] Nothing reads as Console Deck (ice glass, signal blue, tinted rails), the keyarcade shop-wall (stickers, rotation, warm saturation), Midnight Arcade (violet night, pixel type), Cartridge Club (cream, Anton, bargain-bin outlines), Chipwave (porcelain + lime) or Aurora Signal (gradients, starfield).
- [ ] Could a stranger mistake this for a generic dark gaming store or a hacker terminal (neon green on black, glowing edges, angled panels, mono paragraphs, matrix rain)? If yes, find the section and bring it back to steel, engraving, the dial, the tumblers and the covers.
