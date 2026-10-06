# Patinaskins — Design Brief: "Inspection Bay"

This is the implementation prompt for the engineer and the source of truth for the motion engineer. Read it top to bottom before touching code. The rules in `.claude/knowledge/DESIGN-MASTER.md`, `.claude/knowledge/CHECKLIST-QC.md` and `/home/claude/devtools/patina-common.md` still apply. Where this brief is more specific, follow this brief. The previous Brasmora brief ("The Dresser") is retired: nothing from its visual language survives (no bevels, no shelf lines, no brass plates, no cornice, no plinth, no cupboard doors, no Gloock, no Commissioner, no Handbag).

Scope: the storefront only (`src/app/(store)/**`, `src/components/**` except `admin`, `src/styles/variables.css`, `src/styles/globals.css`, `src/styles/animations.css`, `src/app/layout.tsx`, `src/app/fonts.css`, `src/components/layout/ThemeScript`, `public/` brand assets, `scripts/gen-favicons.mjs`, `src/lib/invoice.ts` fonts and colours). Admin (`src/app/admin/**`, `src/components/admin/**`, `src/styles/admin.css`) is isolated on `--admin-*` variables and keeps its own look; after the token swap, open every admin page once in both themes and fix only what became illegible.

House rules for the code: no comments anywhere; reuse existing utilities and patterns (`PriceDisplay`, `QuantitySelector`, `Breadcrumbs`, `EmptyState`, `ConfirmDialog`, `CartProvider`, `CurrencyProvider`, `ThemeProvider`, `Button`, `Field`, `Select`, `Choice`, `Tabs`, `Accordion`, `Dialog`, `Stepper`, `Pagination`, `Alert`, `Plate`, the motion engine in `src/lib/motion`) and restyle them rather than writing parallel ones; reuse coppedskins' proven CS2 logic (`src/lib/skins/shared.ts` exteriors and rarity tiers, `src/lib/sih/parse.ts`, `src/lib/sih/status-labels.ts`) instead of re-deriving it; tokens only, no hex values in components.

---

## 1. Direction

### 1.1 Concept statement
Patinaskins is an inspection bay. Every skin is brought into a dark graphite studio and set on a tray under a single overhead lamp, the way CS2's own inspect view isolates a weapon against a dark backdrop. The lamp is the only light in the room: it rakes across the render, follows your cursor and lets the finish catch it. Beside each tray sits a calibrated float ruler showing the exterior band the skin belongs to, and along the tray's edge runs a thin spine in its rarity colour. The UI is the instrument around the specimen: narrow condensed labels, a wide mono data voice, hairline rules and one amber indicator light that marks what you can act on. The visitor should feel they are looking closely at a real object with nothing hidden, and should be able to find a skin, read its wear and rarity at a glance, and buy it in a few clicks.

The name carries the idea: a patina is the surface a thing earns through wear. Float and exterior are the store's real subject.

### 1.2 What carries colour, what stays quiet
- **Skin renders carry the colour.** CS2 finishes are loud; the room is not.
- **Rarity** carries the second layer of colour, always as a 3px spine, a 2px rule or a tag's text. Never a fill, a wash, a glow or a tinted background.
- **Amber** is the indicator light: primary actions, focus rings, selected states, the ruler's jaws and the cart count. Nothing else.
- **The lamp** is warm white light, never a colour: a 1px lamp line at the top of a stage, a soft light pool on the stage floor, a specular highlight on the render. It is never behind text.
- Everything else is graphite, ink and hairlines.

### 1.3 Signature motifs (repeat with discipline, §10)
1. **The lamp** — a 1px warm-white line at the top edge of every stage, with a soft pool of light under it that moves with the pointer on hover devices. On the home hero and the skin page it becomes a real WebGL specular highlight.
2. **The rarity spine** — a 3px vertical bar along the left edge of every skin tray, tag and rarity filter row, in the rarity token colour.
3. **The float ruler and its jaw** — a calibrated 0.00–1.00 scale with zone boundaries at 0.07, 0.15, 0.38 and 0.45, where the skin's exterior band is lit. The amber jaw (a narrow pentagon pointing down at the scale) is the ruler's cursor and the thumb of every slider in the store.

### 1.4 Moods per theme
- **Inspection Bay (dark, primary, default).** Graphite room, warm tungsten lamp, deep short shadows straight below lifted trays (the light is overhead). Header is the dark rig, footer is the bay floor (darker than the room).
- **Daylight Bay (light, designed counterpart).** The roller door is up. The room becomes a mid-light neutral grey studio with a grey seamless sweep under each skin (the stage is darker than the page, like a recessed sweep), the lamp becomes cool daylight (a brighter, wider pool and softer, longer shadows), panels are near-white. Header is light, footer is a slightly darker grey floor. Amber stays the indicator but as a fill only; amber text uses the darker `--color-accent-ink`.

### 1.5 Divergence audit (must hold on every page)
| Axis | Patinaskins "Inspection Bay" | The Dresser (Brasmora) | Sibling CS2 / portfolio directions |
|---|---|---|---|
| Base | graphite #121315 dark-first; grey studio #E4E5E6 light | chalk + chocolate, light-first | Drop District light concrete; Blueprint drafting paper; Chipwave porcelain; Aurora polar night + gradient; Console Deck ice white |
| Accent | amber indicator #F39A2E | chocolate paint + brass | orange-red, cobalt, safety yellow; blueprint blue; lime; emerald-violet; signal blue |
| Type | Sofia Sans Condensed + Source Sans 3 + Martian Mono | Gloock + Commissioner | Anton / Space Grotesk / Archivo + Inter + JetBrains Mono |
| Geometry | square planes, 2px machined controls, 4px trays, the jaw pentagon | 0px + 45° bevels | 2–6px with hard offset shadows; 0–3px then 10–12px; tight rectangles; glass |
| Signature | lamp, rarity spine, calibrated ruler with lit band | shelf line, contact shadow, brass plate | sticker badges, tape, ticker, index numerals; title blocks, stamps, registration marks; pad grid; starfield |
| Cart | `ShoppingCart`, word "Cart" | `Handbag`, word "Bag" | — |
| Header | single dark rig with weapon-type nav and loadout board | utility line + chocolate cornice | — |
| Footer | bay floor: ruler band, four columns, mono credentials sheet, Valve disclaimer | chocolate plinth with brass plaque | — |

Banned here because a sibling owns them: sticker badges, rotated tags, tape rules, tickers, index numerals as section openers, title blocks, stamps, registration/crop marks, millimetre grids, callout leader lines, glass panels, gradients as decoration, hard offset shadows, pills, tinted zone fills on a wear gauge.

---

## 2. Token plumbing

### 2.1 Where tokens live
- `src/styles/variables.css` holds the CSS custom properties. This is the single source of colour, radius, shadow, font stacks and motion timings.
- `src/styles/globals.css` holds the Tailwind v4 `@theme inline` block that turns those variables into utilities. Tailwind compiles from this block only.
- `tailwind.config.ts` mirrors the aliases. `globals.css` has no `@config`, so Tailwind does not read it; update it anyway so tools that read it stay in sync.
- `ThemeScript` sets `data-theme="light|dark"` and the `dark` class on `<html>` before paint; `@custom-variant dark ([data-theme="dark"] &)` stays.
- **Structural change:** `:root` now holds the **dark** values (Inspection Bay) and `[data-theme="light"]` overrides with Daylight Bay. A visitor without JavaScript therefore gets the brand's primary mood. In `ThemeScript`, when nothing valid is stored the fallback becomes `"dark"` instead of the OS preference. The toggle persists the choice as today.

### 2.2 Keep every existing alias name, change what it points to
Current storefront usage counts: `text-ink` 248, `text-ink-muted` 208, `border-line` 115, `bg-raised` 35, `text-ink-subtle` 35, `shelf-rule` 28, `eyebrow` 28, `text-on-paint` 23, `bg-shelf` 18, `border-shelf` 15, `border-control` 15, `bg-surface-1` 13, `bg-brand-soft` 13, `bg-brand` 10, `border-brand` 10, `bg-surface-2` 8, `bg-paint` 8, `bevel-xs` 8, `bevel-sm` 9. The names stay so everything compiles on day one; the values change. Legacy furniture names are aliases of the new semantic names, then removed in the sweep (§2.4).

| Existing variable | Utility alias | New meaning |
|---|---|---|
| `--color-bg` | `bg-surface` | room (page canvas) |
| `--color-bg-secondary` | `bg-surface-1` | band (alternating sections, disabled fills) |
| `--color-bg-tertiary` | `bg-surface-2` | inset (wells, skeletons, ruler track) |
| `--color-bg-warm` | `bg-surface-warm` | amber-tinted note box |
| `--color-raised` | `bg-raised` | panels, inputs, popovers, tray data strip |
| `--color-stage` | `bg-stage` | the skin stage under the lamp |
| `--color-on-stage` | `text-on-stage` | text on stage (= ink) |
| `--color-text` | `text-ink` | ink |
| `--color-text-secondary` | `text-ink-muted` | muted ink |
| `--color-text-tertiary` | `text-ink-subtle` | faint ink (still ≥4.5:1) |
| `--color-accent` | `bg-brand`, `text-brand`, `border-brand` | amber indicator |
| `--color-accent-hover` | `bg-brand-hover` | amber pressed/hover |
| `--color-accent-light` | `bg-brand-soft` | amber tint for hover/selected fills |
| `--color-on-accent` | `text-on-brand` | text on amber |
| `--color-accent-2` | `bg-brand-2` | lamp warm white (non-text only) |
| `--color-accent-3` | `text-sale`, `bg-sale` | = `--color-accent-ink` (no sale styling exists in this store, see §15) |
| `--color-paint` | `bg-paint` | → `--color-rig` (header) |
| `--color-plinth` | `bg-plinth` | → `--color-floor` (footer) |
| `--color-on-paint`, `--color-on-paint-muted`, `--color-on-paint-line` | `text-on-paint`, … | → ink, muted, hairline (rig and floor follow the theme) |
| `--color-brass`, `--color-on-brass`, `--color-brass-tint`, `--color-brass-on-paint` | `bg-brass`, … | → accent, on-accent, accent-light, accent-ink |
| `--color-shelf` | `bg-shelf`, `border-shelf` | → `--color-rule` (1px strong rule) |
| `--color-shelf-hairline` | `bg-shelf-hairline` | → `--color-border` |
| `--color-border` | `border-line` | hairline |
| `--color-border-hover` | `border-line-hover` | stronger hairline |
| `--color-border-control` | `border-control` | control borders (≥3:1) |
| `--color-focus`, `--color-focus-on-paint` | `outline-focus` | amber focus ring (accent-ink in light) |
| `--radius-sm…2xl`, `--radius-pill` | `rounded-*` | 2px controls / 4px trays (§5.3); pill becomes 2px |
| `--bevel-*` | `.bevel*` | `0`; utilities neutralised then deleted |
| `--shadow-card`, `--shadow-card-hover` | `shadow-card*` | tray at rest / lifted |
| `--shadow-contact` | `.contact-shadow` | cast shadow ellipse under a render on the stage floor |

### 2.3 New names (add to `variables.css` and `@theme inline`)
| Variable | Utility | Job |
|---|---|---|
| `--color-rig` | `bg-rig` | header and loadout board |
| `--color-floor` | `bg-floor` | footer |
| `--color-rule` | `border-rule`, `bg-rule` | strong 1px rule (ruler baseline, active tab, table head) |
| `--color-accent-ink` | `text-accent-ink` | amber as text (links on hover, counts in active states) |
| `--color-accent-edge` | `border-accent-edge` | 1px edge on amber buttons in Daylight (non-text ≥3:1) |
| `--color-lamp` (rgb triplet `--lamp-rgb`) | `bg-lamp` | lamp line, light pool, specular colour |
| `--stage-lamp` | `bg-stage-lamp` | the named light-pool gradient, stages only |
| `--lamp-catch` | `shadow-lamp-catch` | 1px inner top highlight on lit surfaces |
| `--rarity-consumer`, `--rarity-industrial`, `--rarity-milspec`, `--rarity-restricted`, `--rarity-classified`, `--rarity-covert`, `--rarity-gold` | `text-rarity-*`, `bg-rarity-*`, `border-rarity-*` | CS2 rarity tiers |
| `--mark-stattrak`, `--mark-souvenir` | `text-mark-*`, `border-mark-*` | StatTrak™ and Souvenir marks |
| `--color-success-tint` … `--color-info-tint`, `--color-on-danger` | `bg-*-tint`, `text-on-danger` | status tags, alerts |
| `--color-scrim` | `bg-scrim` | modal and drawer backdrop |

Rarity is wired by attribute, never by per-component colour logic:

```css
[data-rarity="consumer"] { --rarity: var(--rarity-consumer); }
[data-rarity="industrial"] { --rarity: var(--rarity-industrial); }
[data-rarity="milspec"] { --rarity: var(--rarity-milspec); }
[data-rarity="restricted"] { --rarity: var(--rarity-restricted); }
[data-rarity="classified"] { --rarity: var(--rarity-classified); }
[data-rarity="covert"] { --rarity: var(--rarity-covert); }
[data-rarity="gold"] { --rarity: var(--rarity-gold); }
```

`--rarity` defaults to `var(--color-border-hover)` on `:root` (unknown rarity: a neutral spine and no rarity label). Components use `var(--rarity)` only. Map the data with one helper next to the existing skins helpers (`rarityFromColor` already reverses the SIH colour): Consumer Grade → `consumer`, Industrial Grade → `industrial`, Mil-Spec Grade → `milspec`, Restricted → `restricted`, Classified → `classified`, Covert → `covert`, Extraordinary → `gold`, Contraband → `gold`. ★ knives keep their real rarity spine (Covert) and additionally show the ★ mark (§7.10).

### 2.4 Mandatory sweeps
1. **Furniture names out.** Rebuilt components use the new names (`bg-rig`, `bg-floor`, `border-rule`, `text-accent-ink`, `bg-brand`). When the storefront no longer references `paint`, `plinth`, `brass`, `shelf`, delete those aliases from both files.
2. **Bevels out.** Set `--bevel-*` to `0` and `.bevel*` to `clip-path: none` on day one so nothing is clipped, then remove every `bevel*` class and the utilities themselves.
3. **Shelf out.** `.shelf-rule`, `.shelf-rule-solid` and the shelf weights are deleted; their call sites become a hairline, a `border-rule`, or the lamp line, as each component spec says.
4. **Text on amber.** Every `text-white` or `#fff` on `bg-brand` becomes `text-on-brand`; on `bg-danger` it becomes `text-on-danger`.
5. **Hex hunt.** No hex or rgba in storefront components (including `BrandMark.tsx`, home components, auth and account pages). Rarity colours from the database (`rarityColor`) are never rendered directly; they only pick the slug.
6. **Old home tree.** `DresserHero`, `DrawerChest`, `TopShelf`, `PlateRack`, `HooksRow`, `ReducedBand`, `NewOnShelf`, `CareCupboard`, `NewsletterPlaque`, `ElevationDrawing`, `Furniture`, `CategoryChest`, `ShelfTile`, `ShelfLoader` and the motion scenes `dresser`, `drawers`, `rack`, `hooks` are replaced (§13.1). `glaze.ts` is the starting point for the lamp shader (§12).

---

## 3. Colour tokens

### 3.1 `src/styles/variables.css` — replace the colour, shadow, radius, font and motion parts with this

```css
:root {
  --color-primary: #eceae5;
  --color-secondary: #1c1e21;

  --color-bg: #121315;
  --color-bg-secondary: #17181b;
  --color-bg-tertiary: #0b0c0d;
  --color-bg-warm: #1f1a13;
  --color-raised: #1c1e21;
  --color-stage: #18191c;
  --color-on-stage: #eceae5;
  --color-surface-dark: #0b0c0d;
  --color-rig: #0d0e10;
  --color-floor: #0b0c0d;

  --color-text: #eceae5;
  --color-text-secondary: #aaa7a0;
  --color-text-tertiary: #8d8a83;

  --color-accent: #f39a2e;
  --color-accent-hover: #f7ae55;
  --color-accent-light: #2b2116;
  --color-on-accent: #16120c;
  --color-accent-ink: #f39a2e;
  --color-accent-edge: #f39a2e;
  --color-accent-2: #ffe9c7;
  --color-accent-3: var(--color-accent-ink);

  --color-paint: var(--color-rig);
  --color-plinth: var(--color-floor);
  --color-on-paint: var(--color-text);
  --color-on-paint-muted: var(--color-text-secondary);
  --color-on-paint-line: var(--color-border);
  --color-brass: var(--color-accent);
  --color-on-brass: var(--color-on-accent);
  --color-brass-tint: var(--color-accent-light);
  --color-brass-on-paint: var(--color-accent-ink);
  --color-shelf: var(--color-rule);
  --color-shelf-hairline: var(--color-border);

  --color-rule: #3a3d42;
  --color-border: #2a2c30;
  --color-border-hover: #3a3d42;
  --color-border-control: #6b6e74;
  --color-focus: #f39a2e;
  --color-focus-on-paint: var(--color-focus);

  --color-success: #62c38b;
  --color-success-tint: #16251c;
  --color-warning: #e8b26a;
  --color-warning-tint: #2a2216;
  --color-danger: #ff7d6e;
  --color-danger-tint: #2e1a18;
  --color-on-danger: #16120c;
  --color-info: #9fb6c9;
  --color-info-tint: #1a2128;

  --rarity-consumer: #b0c3d9;
  --rarity-industrial: #6aa2e0;
  --rarity-milspec: #7890ff;
  --rarity-restricted: #a882ff;
  --rarity-classified: #e05ef0;
  --rarity-covert: #f26b6b;
  --rarity-gold: #eac54f;
  --rarity: var(--color-border-hover);
  --mark-stattrak: #e98b4a;
  --mark-souvenir: #e4c46a;

  --lamp-rgb: 255 233 199;
  --color-lamp: rgb(var(--lamp-rgb));
  --lamp-line: rgb(var(--lamp-rgb) / 0.55);
  --lamp-pool-alpha: 0.08;
  --stage-lamp: radial-gradient(ellipse 70% 62% at var(--lx, 50%) var(--ly, 0%), rgb(var(--lamp-rgb) / var(--lamp-pool-alpha)), transparent 72%);
  --lamp-catch: inset 0 1px 0 rgb(255 255 255 / 0.05);

  --color-scrim: rgb(5 6 7 / 0.72);

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-card: inset 0 1px 0 rgb(255 255 255 / 0.05);
  --shadow-card-hover: inset 0 1px 0 rgb(255 255 255 / 0.08), 0 20px 28px -18px rgb(0 0 0 / 0.85);
  --shadow-lg: 0 0 0 1px #2a2c30, 0 18px 36px -18px rgb(0 0 0 / 0.75);
  --shadow-xl: 0 0 0 1px #2a2c30, 0 32px 64px -24px rgb(0 0 0 / 0.85);
  --shadow-accent: 0 0 0 2px #f39a2e;
  --shadow-panel: -1px 0 0 #2a2c30, -32px 0 64px -32px rgb(0 0 0 / 0.8);
  --shadow-panel-left: 1px 0 0 #2a2c30, 32px 0 64px -32px rgb(0 0 0 / 0.8);
  --shadow-contact: rgb(0 0 0 / 0.55);

  --radius-control: 2px;
  --radius-tray: 4px;
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 4px;
  --radius-xl: 4px;
  --radius-2xl: 4px;
  --radius-pill: 2px;

  --bevel-xs: 0;
  --bevel-sm: 0;
  --bevel-md: 0;
  --bevel-lg: 0;

  --spine: 3px;
  --lamp-inset: 12%;

  --max-width: 1360px;
  --header-height: 64px;
  --header-height-compact: 56px;
  --header-height-mobile: 56px;
  --utility-height: 0px;
  --announcement-height: 32px;
  --gutter: 16px;

  --z-base: 0;
  --z-shelf-item: 1;
  --z-sticky: 40;
  --z-dropdown: 50;
  --z-drawer: 60;
  --z-modal: 70;
  --z-toast: 80;
  --z-cookie: 90;

  --font-sans: var(--font-source-sans), "Source Sans 3 Variable", "Source Sans Fallback", "Segoe UI", sans-serif;
  --font-display: var(--font-sofia-condensed), "Sofia Sans Condensed Variable", "Sofia Condensed Fallback", "Arial Narrow", sans-serif;
  --font-mono: var(--font-martian), "Martian Mono Variable", "Martian Fallback", ui-monospace, Menlo, Consolas, monospace;

  --ease-instrument: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-std: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-furniture: var(--ease-instrument);
  --ease-spring: var(--ease-instrument);
  --dur-micro: 140ms;
  --dur-ui: 200ms;
  --dur-panel: 280ms;
  --dur-panel-close: 220ms;
  --dur-reveal: 700ms;
  --dur-reduced: 120ms;

  --selection-bg: #f39a2e;
  --selection-fg: #16120c;

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
  --color-primary: #141517;
  --color-secondary: #f6f6f5;

  --color-bg: #e4e5e6;
  --color-bg-secondary: #dadbdd;
  --color-bg-tertiary: #cfd0d3;
  --color-bg-warm: #efe4d2;
  --color-raised: #f6f6f5;
  --color-stage: #d6d7da;
  --color-on-stage: #141517;
  --color-surface-dark: #141517;
  --color-rig: #f6f6f5;
  --color-floor: #d3d4d7;

  --color-text: #141517;
  --color-text-secondary: #45474b;
  --color-text-tertiary: #54565b;

  --color-accent: #ec9524;
  --color-accent-hover: #d9820f;
  --color-accent-light: #f3e3cc;
  --color-on-accent: #16120c;
  --color-accent-ink: #8a4f00;
  --color-accent-edge: #a8630c;
  --color-accent-2: #fffaf0;

  --color-rule: #a9abaf;
  --color-border: #c4c5c8;
  --color-border-hover: #a9abaf;
  --color-border-control: #76787d;
  --color-focus: #8a4f00;

  --color-success: #1d6b42;
  --color-success-tint: #d5e6da;
  --color-warning: #874708;
  --color-warning-tint: #f1e2cc;
  --color-danger: #a8261d;
  --color-danger-tint: #f3dcd8;
  --color-on-danger: #ffffff;
  --color-info: #38506a;
  --color-info-tint: #d8e0e8;

  --rarity-consumer: #4a5c70;
  --rarity-industrial: #235a96;
  --rarity-milspec: #2c45c0;
  --rarity-restricted: #6030bf;
  --rarity-classified: #8e1e99;
  --rarity-covert: #ac2828;
  --rarity-gold: #755700;
  --mark-stattrak: #8f430c;
  --mark-souvenir: #6f5a12;

  --lamp-rgb: 255 250 240;
  --lamp-line: rgb(255 255 255 / 0.95);
  --lamp-pool-alpha: 0.38;
  --lamp-catch: inset 0 1px 0 rgb(255 255 255 / 0.7);

  --color-scrim: rgb(20 21 23 / 0.5);

  --shadow-card: inset 0 1px 0 rgb(255 255 255 / 0.7);
  --shadow-card-hover: inset 0 1px 0 rgb(255 255 255 / 0.8), 0 22px 32px -20px rgb(20 21 23 / 0.38);
  --shadow-lg: 0 0 0 1px #c4c5c8, 0 18px 36px -20px rgb(20 21 23 / 0.32);
  --shadow-xl: 0 0 0 1px #c4c5c8, 0 32px 64px -28px rgb(20 21 23 / 0.4);
  --shadow-accent: 0 0 0 2px #8a4f00;
  --shadow-panel: -1px 0 0 #c4c5c8, -32px 0 64px -32px rgb(20 21 23 / 0.35);
  --shadow-panel-left: 1px 0 0 #c4c5c8, 32px 0 64px -32px rgb(20 21 23 / 0.35);
  --shadow-contact: rgb(20 21 23 / 0.28);

  --selection-bg: #ec9524;
  --selection-fg: #16120c;

  color-scheme: light;
}

::selection {
  background: var(--selection-bg);
  color: var(--selection-fg);
}
```

### 3.2 Measured contrast — text, controls and semantics
WCAG 2.x relative-luminance ratios computed by script for these exact hex pairs. Text needs 4.5:1; non-text (control borders, focus rings, spines) needs 3:1.

| Pair | Inspection Bay (dark) | Daylight Bay (light) |
|---|---|---|
| ink / bg | 15.46 | 14.49 |
| ink / band | 14.77 | 13.19 |
| ink / raised | 13.90 | 16.90 |
| ink / stage | 14.62 | 12.70 |
| ink / header (rig) | 16.06 | 16.90 |
| ink / footer (floor) | 16.28 | 12.33 |
| ink / warm note | 14.37 | 14.53 |
| muted / bg | 7.74 | 7.38 |
| muted / band | 7.39 | 6.72 |
| muted / raised | 6.96 | 8.61 |
| muted / stage | 7.32 | 6.47 |
| muted / floor | 8.15 | 6.28 |
| faint / bg | 5.40 | 5.82 |
| faint / band | 5.15 | 5.30 |
| faint / raised | 4.85 | 6.79 |
| faint / stage | 5.10 | 5.10 |
| faint / floor | 5.68 | 4.96 |
| on-accent / accent (primary button) | 8.41 | 7.90 |
| on-accent / accent-hover | 9.89 | 6.35 |
| ink / accent-soft (hover fill) | 13.11 | 14.50 |
| accent-ink (amber text) / bg | 8.39 | 5.20 |
| accent-ink / raised | 7.54 | 6.07 |
| accent-ink / band | 8.01 | 4.74 |
| accent-ink / accent-soft | 7.11 | 5.21 |
| accent-edge / bg (non-text) | 8.39 | 3.74 |
| control border / raised (non-text) | 3.27 | 4.09 |
| control border / bg | 3.64 | 3.50 |
| control border / band | 3.47 | 3.19 |
| focus ring / bg | 8.39 | 5.20 |
| focus ring / raised | 7.54 | 6.07 |
| focus ring / band | 8.01 | 4.74 |
| focus ring / stage | 7.93 | 4.56 |
| success / bg | 8.58 | 5.15 |
| success / tint | 7.37 | 5.00 |
| warning / bg | 9.74 | 5.67 |
| warning / tint | 8.22 | 5.62 |
| danger / bg | 7.45 | 5.62 |
| danger / raised | 6.69 | 6.56 |
| danger / tint | 6.59 | 5.42 |
| info / bg | 8.86 | 6.60 |
| info / tint | 7.75 | 6.24 |
| on-danger / danger | 7.47 | 7.09 |

Extra checks: lamp-lit stage centre in dark (stage blended 7% towards the lamp, `#282829`) still gives ink 12.25, but faint text drops to 4.28 there, so **no text is ever placed inside the light pool**; Daylight lit stage (`#e4e3e2`) with ink is 14.26. The faint tier fails on the Daylight inset (4.48), so the inset never carries text (it is used for wells, skeletons and the ruler track only).

### 3.3 Measured contrast — rarity and marks
Each rarity and mark token is used as text (tags, filter rows, the readout) and as a spine, so every value clears 4.5:1 on every surface it can sit on.

| Rarity / mark | Dark hex | on bg | on band | on raised | on stage | Light hex | on bg | on band | on raised | on stage |
|---|---|---|---|---|---|---|---|---|---|---|
| Consumer Grade | `#b0c3d9` | 10.32 | 9.85 | 9.27 | 9.76 | `#4a5c70` | 5.45 | 4.96 | 6.35 | 4.77 |
| Industrial Grade | `#6aa2e0` | 6.96 | 6.64 | 6.25 | 6.58 | `#235a96` | 5.60 | 5.10 | 6.53 | 4.91 |
| Mil-Spec Grade | `#7890ff` | 6.40 | 6.11 | 5.75 | 6.05 | `#2c45c0` | 6.12 | 5.57 | 7.14 | 5.37 |
| Restricted | `#a882ff` | 6.46 | 6.17 | 5.81 | 6.11 | `#6030bf` | 6.23 | 5.67 | 7.27 | 5.46 |
| Classified | `#e05ef0` | 6.22 | 5.94 | 5.59 | 5.88 | `#8e1e99` | 5.95 | 5.42 | 6.95 | 5.22 |
| Covert | `#f26b6b` | 6.28 | 5.99 | 5.64 | 5.94 | `#ac2828` | 5.39 | 4.91 | 6.29 | 4.72 |
| Extraordinary / Contraband / ★ (`gold`) | `#eac54f` | 11.15 | 10.65 | 10.02 | 10.55 | `#755700` | 5.34 | 4.86 | 6.22 | 4.68 |
| StatTrak™ | `#e98b4a` | 7.31 | 6.98 | 6.57 | 6.91 | `#8f430c` | 5.59 | 5.09 | 6.53 | 4.90 |
| Souvenir | `#e4c46a` | 10.98 | 10.49 | 9.87 | 10.38 | `#6f5a12` | 5.29 | 4.82 | 6.17 | 4.64 |

Why not Steam's raw hex: on the dark room Steam's Restricted `#8847FF` measures 3.89 and Mil-Spec `#4B69FF` 4.22 (fail as text); on Daylight, Consumer `#B0C3D9` measures 1.43 and Extraordinary `#FFD700` 1.11. The dark set keeps each tier's hue and lifts lightness; the light set keeps hue and drops lightness. Order and hue identity match the game, so players recognise them instantly.

### 3.4 Colour rules
- Rarity colour appears only as: the tray spine (3px), the 2px spine of a tag or filter row, the rarity name in mono caps, the lit tick on a rarity filter. Never as a fill behind text, a background wash, a border around the whole tray, a glow or a gradient. Renders are never tinted.
- Amber, gold, StatTrak™ orange and Souvenir yellow are neighbours in hue. They stay apart by role and shape: amber is only on interactive things (button fills, focus, selected state, jaws, cart count) and is never a vertical spine; rarity and marks are only on skin data, always in mono caps text with their word, never on a button.
- Semantic colours (success, warning, danger, info) appear only in status contexts (form errors, alerts, the purchase timeline, toasts) with an icon and a word. They never appear on skin trays, so Covert red and danger red never meet.
- `--color-border` hairlines are decorative and never the only boundary of a control. Controls use `--color-border-control`.
- In Daylight, amber is a fill only. Amber text uses `--color-accent-ink`; primary buttons get a 1px `--color-accent-edge` border.
- The lamp (`--color-lamp`, `--lamp-line`, `--stage-lamp`) is used only on stages, the hero and the skin inspection stage, and as the specular colour in WebGL. It is the only gradient in the system.

---

## 4. Typography

### 4.1 Packages and loading
Verified on npm (all 5.3.0):
- `@fontsource-variable/sofia-sans-condensed` — display (wght 1–1000). Narrow grotesk with squared terminals: reads like stencilled equipment labels at heavy weights and like a precision instrument at medium weights. Not a poster face (Anton) and not a geometric tech face (Space Grotesk).
- `@fontsource-variable/source-sans-3` — body and UI (wght 200–900). Humanist, open apertures, calm at long reading lengths; legibility leads in body.
- `@fontsource-variable/martian-mono` — data voice (wght 100–800, width 75–112.5%). A wide mono against a narrow display is the pairing's contrast: tall narrow labels, wide steady numbers. The width axis lets compact chips run at 87.5% without a second family.

Install those three; uninstall `@fontsource-variable/commissioner` and `@fontsource/gloock`; delete `public/fonts/gloock-*` and the Gloock preload.

`src/app/layout.tsx` imports:

```ts
import "@fontsource-variable/sofia-sans-condensed/wght.css";
import "@fontsource-variable/source-sans-3/wght.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "./fonts.css";
```

`src/app/fonts.css`:

```css
:root {
  --font-sofia-condensed: "Sofia Sans Condensed Variable";
  --font-source-sans: "Source Sans 3 Variable";
  --font-martian: "Martian Mono Variable";
}

@font-face {
  font-family: "Sofia Condensed Fallback";
  src: local("Arial Narrow"), local("Liberation Sans Narrow"), local("Arial");
  size-adjust: 104%;
  ascent-override: 87%;
  descent-override: 29%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Source Sans Fallback";
  src: local("Arial"), local("Liberation Sans");
  size-adjust: 94%;
  ascent-override: 109%;
  descent-override: 42.5%;
  line-gap-override: 0%;
}

@font-face {
  font-family: "Martian Fallback";
  src: local("Menlo"), local("Consolas"), local("DejaVu Sans Mono");
  size-adjust: 112%;
  ascent-override: 89%;
  descent-override: 18%;
  line-gap-override: 0%;
}
```

The override values are starting points derived from the fonts' metrics (Sofia asc 900 / desc 300, Source Sans asc 1024 / desc 400, Martian asc 1000 / desc 200, all 1000 upm). Tune them in Playwright against the real fonts until swapping shifts the hero H1, a body paragraph and a price by less than 2px. Preload the latin Sofia Sans Condensed woff2 used by the hero H1 (resolve the hashed path from the package at build time, or copy that one file to `public/fonts/` and preload it as Brasmora did with Gloock).

Weights: Sofia 500 (large light statements), 600 (H3, tile names, nav), 650 (buttons, H1/H2), 720 (hero H1, wordmark). Source Sans 400 (body), 600 (labels, emphasis), 700 (table heads only). Martian 400 (readouts), 500 (micro-labels, tags), 600 (prices). Set `font-synthesis: none` globally.

Numbers: Martian is monospaced, so prices, floats, counts, order IDs and SteamIDs are tabular by construction. Sofia has `tnum`: use `font-variant-numeric: tabular-nums` where Sofia shows numbers in tables. Source Sans 3's latin subset has no `tnum`, so Source Sans never sets prices or columns of numbers.

Glyph coverage (checked in the subset files): none of the three fonts has `★` or `→`. The ★ mark is an inline SVG (§7.10). Arrows in links are Lucide `ArrowRight` / `ArrowUpRight`, never a text arrow. `™` exists in all three; write `StatTrak™` with the real glyph.

PDF invoices (`src/lib/invoice.ts`): swap the embedded fonts to static woff files from `@fontsource/source-sans-3` (400, 600) and `@fontsource/martian-mono` (500, for the invoice number and amounts) and `@fontsource/sofia-sans-condensed` (700, wordmark), copied into `public/fonts/`. Invoice colours become ink `#141517`, muted `#45474b`, rule `#a9abaf`; the wordmark is ink with the amber tittle (§9). Invoices are always light.

### 4.2 Modular scale — ratio 1.25 (major third), base 17px
Source Sans 3 and Sofia have small x-heights (0.478 and 0.487), so the body base is 17px. Martian's x-height is 0.6, so mono sizes sit one step lower than the sans text they align with.

```css
@theme inline {
  --text-step--2: 0.75rem;
  --text-step--1: 0.875rem;
  --text-step-0: 1.0625rem;
  --text-step-1: clamp(1.1875rem, 1.12rem + 0.3vw, 1.328rem);
  --text-step-2: clamp(1.375rem, 1.24rem + 0.65vw, 1.66rem);
  --text-step-3: clamp(1.625rem, 1.38rem + 1.2vw, 2.075rem);
  --text-step-4: clamp(1.875rem, 1.5rem + 1.9vw, 2.594rem);
  --text-step-5: clamp(2.25rem, 1.7rem + 2.8vw, 3.242rem);
  --text-step-6: clamp(2.75rem, 1.9rem + 4.2vw, 4.053rem);
  --text-display-xl: clamp(3.5rem, 1.2rem + 7vw, 7.5rem);
  --text-ui-md: 0.9375rem;
  --text-ui-sm: 0.875rem;
  --text-ui-xs: 0.8125rem;
  --text-data: 0.875rem;
  --text-data-sm: 0.75rem;
}
```

| Role | Face | Size token | Leading | Tracking | Case / width |
|---|---|---|---|---|---|
| Home hero H1 | Sofia 720 | display-xl | 0.9 | -0.015em | sentence |
| Landing H1 (about, how delivery works) | Sofia 680 | step-6 | 0.96 | -0.01em | sentence |
| Store H1 (catalog, weapon, skin name, account) | Sofia 650 | step-5 | 1.0 | -0.01em | sentence |
| H2 section | Sofia 650 | step-4 | 1.04 | -0.005em | sentence |
| H3 / panel title | Sofia 600 | step-2 | 1.12 | 0 | sentence |
| Skin name in tray | Sofia 600 | step-1 | 1.12 | 0 | as named |
| Weapon line above a skin name | Martian 500 | data-sm (12px) | 1.2 | 0.06em | uppercase, wdth 87.5% |
| Eyebrow / micro-label / column head | Martian 500 | data-sm (12px) | 1.2 | 0.08em | uppercase, wdth 87.5% |
| Lead paragraph | Source Sans 400 | step-1 | 1.5 | 0 | sentence |
| Body | Source Sans 400 | step-0 (17px) | 1.6 | 0 | sentence |
| UI label, form label | Source Sans 600 | ui-md (15px) | 1.3 | 0 | sentence |
| Meta, captions, breadcrumbs | Source Sans 400 | ui-sm (14px) | 1.45 | 0.005em | sentence |
| Navigation links, buttons | Sofia 650 | ui-sm / 16px / 18px | 1 | 0.05em | uppercase |
| Price in tray | Martian 600 | 1rem | 1.1 | 0 | wdth 100% |
| Price on skin page | Martian 600 | step-3 | 1.0 | -0.01em | wdth 87.5% |
| Order total | Martian 600 | step-2 | 1.05 | 0 | wdth 100% |
| Readouts (float range, counts, IDs, timers) | Martian 400 | data (14px) | 1.4 | 0 | wdth 100% |

Rules: mono is for data and micro-labels only, never for sentences. Uppercase is for Martian micro-labels, Sofia buttons and Sofia nav only; headings are sentence case. Reading blocks (about, policies, FAQ answers, how delivery works) are capped at `68ch`. Body never below 17px, meta never below 14px, micro-labels never below 12px.

### 4.3 Global base rules in `globals.css`
- `body`: `var(--font-sans)`, 1.0625rem, line-height 1.6, `var(--color-bg)`, `var(--color-text)`.
- `h1–h6`: `var(--font-display)`, weight from the role table, `font-synthesis: none`, `text-wrap: balance`.
- `p`: `text-wrap: pretty`.
- `@utility eyebrow` becomes the Martian micro-label (12px, 500, uppercase, 0.08em, `font-stretch: 87.5%`, `--color-text-secondary`).
- New `@utility data` (Martian 400, 14px, `font-stretch: 100%`), `@utility data-compact` (`font-stretch: 87.5%`).
- `@utility tabular` stays (for Sofia numbers).
- Scrollbar: thumb `--color-border-hover`, track `--color-bg-secondary`, 2px radius.

---

## 5. Space, layout, geometry, borders, elevation

### 5.1 Spacing
4px base: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128 · 160`. Section rhythm is uneven on purpose (§13 gives each section its own spacing). The catalog is dense (16px tray gaps on desktop, 12px on mobile) because comparison is the job there; landing set-pieces are generous because they are read once.

### 5.2 Layout
| Token | Value | Use |
|---|---|---|
| `--container-container` | 1360px | default content width |
| `--container-wide` | 1560px | home set-pieces, footer inner |
| `--container-narrow` | 1120px | checkout, account, purchases |
| `--container-read` | 720px | policies, FAQ answers, about text |
| gutters | 16px (<640), 24px (640–1023), 40px (≥1024) | |
| grid | 12 columns, 24px gap (≥1024); 6 columns, 16px (640–1023); 4 columns, 12px (<640) | |

Breakpoints: 390 (mobile design base), 640, 1024, 1280, 1536.

### 5.3 Geometry language — "machined, not cut"
The Dresser cut its corners (45° bevels on a 0px world). Inspection Bay never cuts a corner. Its geometry follows materials:
- **0px — planes.** Page bands, header, footer, stage interiors, tables, images, the loadout board, toasts' outer edge on mobile. Rooms and floors have square edges.
- **2px — machined controls.** Buttons, inputs, selects, checkboxes, switches, chips, tags, segmented controls, dialogs, popovers, pagination cells. It is the softening a CNC deburr leaves on aluminium: visible up close, never "rounded".
- **4px — the tray.** The skin tray is the only object with 4px, because it is the physical thing you pick up. Its stage follows the tray's top corners.
- **The jaw.** The one non-rectangular shape: a narrow pentagon (12×18px, the point 6px tall) pointing down at a scale. It is the ruler cursor, the range-slider thumb and the active-step marker in the purchase timeline. It is drawn as inline SVG (not `clip-path` on the focusable element), so the focus ring stays a clean rectangle around it.
- **Circles** only for the radio dot and the timeline nodes. No pills anywhere; `--radius-pill` is 2px.
- Third-party payment logos keep their own rounded white cards untouched.

### 5.4 Borders and rules
- Hairline: 1px `--color-border` (section dividers, table rows, panel edges, tray outline in dark).
- Rule: 1px `--color-rule` (ruler baseline, table head underline, active tab, footer ruler band).
- Control: 1px `--color-border-control`; hover `--color-text-secondary`; focus adds the amber ring; error 2px `--color-danger`.
- **Spine:** `--spine` 3px, `var(--rarity)`, full height of the tray's left edge, flush, following the tray's left corner radius. Tags and filter rows use a 2px spine.
- **Lamp line:** 1px `--lamp-line`, inset `--lamp-inset` (12%) from each side, 0px from the stage top. With the pool (`--stage-lamp`) beneath it.

### 5.5 Elevation (light comes from above)
| Level | Token | Use |
|---|---|---|
| e0 | none | page, bands, tables, text |
| e1 | `--shadow-card` (lamp catch: 1px inner top highlight) | trays at rest, raised panels, inputs |
| e2 | `--shadow-card-hover` | lifted tray, sticky skin-page buy panel when stuck |
| e3 | `--shadow-lg` | popovers, loadout board, search dialog, toasts |
| e4 | `--shadow-xl`, `--shadow-panel` | dialogs, cart drawer, mobile menu |

The cast shadow under a render (`.contact-shadow`, restyled) is an ellipse 64% of the stage width, 10px tall, `radial-gradient(closest-side, var(--shadow-contact), transparent)`, 8% above the stage floor. It is the only shadow on a stage. No coloured shadows, no glows.

### 5.6 Z-index
Unchanged: `base 0 · shelf-item 1 · sticky 40 · dropdown 50 · drawer 60 · modal 70 · toast 80 · cookie 90`.

---

## 6. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 140ms | hover, press, focus, tag swaps |
| `--dur-ui` | 200ms | accordions, tabs, filter groups, segmented controls |
| `--dur-panel` | 280ms | cart drawer, loadout board, dialogs, mobile menu |
| `--dur-panel-close` | 220ms | closing panels |
| `--dur-reveal` | 700ms | landing section entrances only |
| `--dur-reduced` | 120ms | the only transition under reduced motion (opacity) |
| `--ease-instrument` | cubic-bezier(0.2, 0.8, 0.2, 1) | anything that moves: fast start, damped finish, no overshoot |
| `--ease-std` | cubic-bezier(0.4, 0, 0.2, 1) | colour and opacity |
| `--ease-in-out` | cubic-bezier(0.76, 0, 0.24, 1) | pinned scenes and camera moves |
| lamp follow (JS) | damped lerp 0.12 per frame at 60fps | lamp position towards the pointer |
| tray tilt (JS) | spring stiffness 260, damping 30, no overshoot >2% | 3D card tilt |

Update `src/lib/motion/tokens.ts` to these values: `MOTION_DURATION` (micro 140, ui 200, panel 280, panelClose 220, reveal 700, reduced 120, cartFlight 420, lampSweep 1600), `MOTION_EASE.instrument`, `MOTION_SPRING` 260/30, `MOTION_DEPTH` from §12.1, and `MOTION_LIMITS` (tiltCatalog 4°, tiltHome 8°, tiltInspect yaw 25° / pitch 10°, lampLerp 0.12, dprCap 1.5).

Philosophy: a precision instrument. Things move like a calibrated mechanism: quick, damped, settling exactly where they should. Light moves smoothly and continuously; objects move briefly and stop. Nothing bounces, nothing spins, nothing pulses, nothing glows. Transform and opacity only (the lamp pool moves by updating two CSS custom properties, `--lx` and `--ly`, which repaint only the stage). With `prefers-reduced-motion: reduce`, every transition becomes an instant state change or a ≤120ms opacity fade, the lamp stays at its rest position (top centre), trays never tilt, nothing pins, and every scene shows its designed end state. `scroll-behavior: smooth` is removed under reduced motion.

`src/styles/animations.css`: delete the furniture keyframes (`shelf-settle`, `drawer-out`, `plate-in` and any other with no consumer). Add `tray-in` (translateY 8px→0 + opacity), `panel-in` (translateY −6px→0 + opacity), `count-roll` (translateY 100%→0 for the incoming digit) and `lamp-on` (opacity 0→1 on the lamp line and pool, 160ms). Durations and easings come from the tokens.

---

## 7. Components (all states)

General states for every interactive component:
- default;
- hover (`hover-device` variant only);
- active/pressed;
- focus-visible: 2px `--color-focus` outline, 2px offset (3px on trays), never removed;
- disabled: `--color-text-tertiary` text, `--color-bg-secondary` fill, no hover, `cursor: not-allowed`, `aria-disabled` or `disabled`;
- loading: `aria-busy="true"`, width locked.

Minimum touch target 44×44px on touch devices.

### 7.1 Button (`src/components/ui/Button.tsx` — keep the API, restyle)
Variant mapping: `primary` → **Indicator**; `secondary`, `outline`, `bordered` → **Outline**; `tertiary`, `ghost`, `light`, `flat` → **Text**; `danger` → **Danger**; `danger-soft` → Text in danger colour. Add `steam` → **Account** (high-contrast neutral, used only for "Sign in through Steam").

| | Indicator | Outline | Text | Danger | Account |
|---|---|---|---|---|---|
| Shape | 2px radius, fill `--color-accent`; Daylight adds 1px `--color-accent-edge` | 2px radius, 1px `--color-border-control`, transparent | no box; 1px underline offset 4px on hover | 2px radius, fill `--color-danger` | 2px radius, fill `--color-text` |
| Label | Sofia 650 uppercase 0.05em, `--color-on-accent` | `--color-text` | Source Sans 600, sentence case, `--color-text` | `--color-on-danger` | `--color-bg` |
| Hover | fill `--color-accent-hover`, lamp catch line brightens | border `--color-text`, fill `--color-raised` | underline appears (140ms) | `filter: brightness(1.06)` | fill `--color-text-secondary` |
| Active | translateY 1px | translateY 1px, fill `--color-accent-light` | underline `--color-accent-ink` | translateY 1px | translateY 1px |
| Focus | amber ring, offset 2px | same | same | same | same |
| Disabled | fill `--color-bg-secondary`, text faint, no edge | border `--color-border`, text faint | faint, no underline | as Indicator disabled | as Indicator disabled |
| Loading | label kept for width (visibility hidden), three 4×4 squares light in sequence across the label centre (§7.20); `aria-busy` | same | same | same | same |

Sizes: sm 36px high, 14px label, 14px padding; md 44px, 16px label, 20px padding; lg 52px, 18px label, 28px padding. Icon-only buttons are 40px square (44 on touch), transparent, hover fill `--color-raised`, 2px radius, required `aria-label`. `startContent`/`endContent` icons 18px, 8px gap. The account variant's label is "Sign in through Steam" (Valve's wording); add a 16px monochrome Steam glyph only if the lead adds the official asset to `public/brands/steam.svg`; otherwise the label stands alone.

### 7.2 Text inputs, textarea
- 48px high, 2px radius, fill `--color-raised`, 1px `--color-border-control`, 14px horizontal padding, Source Sans 17px.
- Label above: Source Sans 600 15px, 6px gap. Required: " *" in muted plus `aria-required`.
- Hint below: 14px muted. Placeholder: faint.
- Hover: border `--color-text-secondary`. Focus: amber ring (offset 2px), border unchanged.
- Error: 2px `--color-danger` border, message below in danger with Lucide `TriangleAlert` 16px, linked by `aria-describedby`, `aria-invalid="true"`.
- Disabled: fill `--color-bg-secondary`, faint text. Read-only: no border, fill `--color-bg-secondary`.
- Password: inline 40px icon button `Eye`/`EyeOff`, `aria-pressed`.
- Data inputs (price min/max, trade URL, search on the catalog page) use Martian 400 14px for the value; their labels stay Source Sans.
- Textarea min 140px, vertical resize.

### 7.3 Trade URL field (new, `account/trade-url` and checkout step 2)
- A full-width data input (Martian 14px) with the label "Steam trade URL" and the placeholder `https://steamcommunity.com/tradeoffer/new/?partner=…&token=…`.
- Right of the label row: Text link "Find it in Steam" with `ArrowUpRight` 14px, opening `https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url` in a new tab (`rel="noopener noreferrer"`).
- Live parse below the field once it has a value, as a two-row readout in Martian 14px: `partner 123456789` and `token ••••••a1B2` (last four visible). Each row ends with a status word: "matches your Steam account" (success, `Check`) or "belongs to a different Steam account" (danger, `TriangleAlert`) when the partner ID does not equal the signed-in SteamID32.
- States: empty; typing (no validation until blur or paste); valid (success readout); format error ("This isn't a Steam trade URL. It starts with https://steamcommunity.com/tradeoffer/new/"); mismatch (as above, saving blocked); saving (button loading); saved (toast "Trade URL saved" and the account page status tag turns to "Ready").
- Never shows the full token after saving.

### 7.4 Select
Native `<select>` styled like an input: 48px (36px in the sort, currency and toolbar spots), `appearance: none`, Lucide `ChevronDown` 16px, 14px from the right. Country uses the single restricted-countries config. A custom listbox only for collection or country search, and then the WAI-ARIA combobox pattern.

### 7.5 Checkbox, radio, switch, segmented control
- **Checkbox:** 18px square, 2px radius, 1.5px `--color-border-control`. Checked: fill `--color-accent`, 12px `Check` in `--color-on-accent`. Indeterminate: 8×2 bar. Label 10px right; whole row is the hit area (44px in filter lists).
- **Radio:** 18px circle, 1.5px border; checked: 8px amber dot.
- **Switch** (cookie preferences): 40×22 track, 2px radius, 1px control border, 16px square knob with 1px radius that slides 18px. On: track amber, knob `--color-on-accent`. Locked "Necessary": on and disabled, text "Always on". `role="switch"`, `aria-checked`.
- **Segmented control** (StatTrak™ filter, theme in the mobile menu, view tabs): one 2px-radius frame, 1px control border, segments 36px high, Source Sans 600 14px. Selected segment: fill `--color-accent-light`, 2px amber underline inside the bottom edge, ink text. `role="radiogroup"` with arrow-key movement.

### 7.6 Tags (restyle `Plate`, which replaces HeroUI `Chip` in the storefront)
All tags: 22px high, 2px radius, 0 8px padding, Martian 500 12px uppercase 0.06em at `font-stretch: 87.5%`, never clickable.

| Variant | Look | Use |
|---|---|---|
| `rarity` | transparent fill, 1px `--color-border`, 2px left spine `var(--rarity)`, text `var(--rarity)` | rarity name ("Covert", "Mil-Spec Grade") |
| `stattrak` | transparent, 1px `--color-border`, text `--mark-stattrak` | "StatTrak™" |
| `souvenir` | transparent, 1px `--color-border`, text `--mark-souvenir` | "Souvenir" |
| `star` | transparent, 1px `--color-border`, ★ SVG + text in `--rarity-gold` | "★ Knife", "★ Gloves" |
| `phase` | transparent, 1px `--color-border`, ink | Doppler phases ("Phase 2", "Ruby") from data |
| `neutral` | fill `--color-bg-secondary`, ink | counts, "Out of stock", "Not painted" |
| `success` / `warning` / `danger` / `info` | tint fill, semantic text, 6px square dot before the word | order and trade-URL statuses |
| `indicator` | fill `--color-accent`, `--color-on-accent` | cart count only |

Limits: at most three tags on a tray (marks first, then phase); rarity is carried by the spine on trays, so the rarity tag appears on the skin page, filters, cart rows and purchase rows, not on catalog trays.

### 7.7 Chips (active filters)
32px high, 2px radius, fill `--color-raised`, 1px `--color-border-control`, Source Sans 600 14px. Content is the human value ("Field-Tested", "Covert", "AK-47", "£10–£50", "StatTrak™ only"); rarity chips carry the 2px spine. A 14px `X` inside the hit area, `aria-label="Remove filter: Field-Tested"`. Hover: border ink. The row ends with Text "Clear all".

### 7.8 The skin tray (replaces `ShelfTile`, the product card for skins)
One `<article data-rarity="covert">`. Anatomy, top to bottom:
1. **Tray:** 4px radius, fill `--color-stage` for the upper part and `--color-raised` for the data strip, 1px `--color-border` outline (dark) / none (Daylight, where the stage is darker than the page and needs no outline), `--shadow-card`. The **spine** (3px, `var(--rarity)`) runs the full height of the left edge.
2. **Stage:** 4:3, `--color-stage` with the lamp line at the top and `--stage-lamp` pool (rest position `--lx: 50%`, `--ly: 0%`). The render is `object-contain`, centred, inset 9% left/right and 12% top / 16% bottom, sitting above its cast shadow (§5.5). No rotation, no tint, no rarity wash.
3. **Marks** at the stage's top-left, 10px in: StatTrak™ / Souvenir / ★ / phase tags (§7.6), max three.
4. **Save** at the top-right: a 36px icon button (`Bookmark` / filled `Bookmark` when saved, `aria-pressed`, label "Save AK-47 | Redline" / "Saved"). On hover devices it appears on hover/focus-within; on touch it is always visible (44px).
5. **Data strip** (`--color-raised`, 14px 16px 16px padding, 1px top hairline):
   - weapon line: Martian micro-label, muted ("AK-47", "★ KARAMBIT", "SPORT GLOVES");
   - skin name: Sofia 600 step-1, max 2 lines, reserved 2-line height; it is the tray's link (`/skin/[slug]`), stretched over the stage with a pseudo-element so the whole tray is clickable while Save and Add stay separate controls;
   - **zone strip** (§7.9 mini ruler) with the exterior label right after it: Martian 12px "FT" + Source Sans 14px muted "Field-Tested"; "Not painted" for vanilla knives;
   - price row: price in Martian 600 1rem via `PriceDisplay` on the left; on the right the **Add** control: an Outline sm button "Add" with `Plus` 16px. On touch it is always visible; on hover devices it is always visible too (fast store), but becomes Indicator on tray hover/focus-within.
6. **Availability** only when real and useful: if `count` is 1–3, a muted Martian line "2 available" under the price. No urgency wording.

States:
- **Hover / focus-within (fine pointer):** tray lifts 3px, `--shadow-card-hover`, tilts at most 4° towards the pointer (catalog) via `data-tilt="4"`, the lamp pool follows the pointer inside the stage (`--lx/--ly`), the lit zone in the zone strip goes from ink to amber. 140ms on `--ease-instrument`. Focus ring around the whole tray (outline offset 3px), never on the stage alone.
- **In cart:** the Add button becomes Text "In cart" with `Check` 16px, linking to the cart drawer.
- **Adding:** Add shows the loading state; then M7 (§12).
- **Price being re-confirmed** (`stale`): the price is replaced by Martian muted "Checking price" with the 3-square loader; Add is disabled with `aria-describedby` to that text.
- **Out of stock** (only possible on saved items and purchases, never in catalog results): render at 55% opacity, neutral tag "Out of stock" in the marks area, Add removed, price shown muted as "Last price £12.40".
- **No render:** stage keeps the lamp; centre shows `ImageOff` 24px muted and "No render" in Martian micro-label.
- **Skeleton:** tray with stage filled `--color-bg-tertiary`, lamp line off, spine `--color-border`, three bars (micro-label 64px, name 70% width, price 56px) in `--color-bg-secondary`. No shimmer. Fades to content in 140ms.

Variants:
- **Compact row** (cart, search dropdown, purchases, loadout board preview list): a 96×72 stage with spine and lamp line, text to the right (weapon line, name 1 line, exterior short code, price). Rows separated by hairlines, not boxed.
- **Feature tray** (home only): spans 2×2 grid cells, stage 16:10, skin name in Sofia step-3, full readout (exterior with range, rarity tag, marks), tilt up to 8° and the WebGL lamp allowed (§12).

Grid: 4 columns ≥1280 (gap 16px), 3 at 1024–1279, 2 below 1024 (gap 12px). Rows breathe through the trays' own data strips; no extra row gap beyond 16px.

### 7.9 Float ruler (new component, the core motif)
Two scales of the same component:

**Zone strip (mini, trays and rows).** Five equal-width segments FN, MW, FT, WW, BS, each 2px high with 2px gaps, total width 72px. The skin's exterior segment is ink (amber on tray hover); the other four are `--color-border-hover`. This is schematic, not to scale, and is labelled by the exterior text next to it. `aria-hidden`; the exterior text carries the meaning.

**Calibrated ruler (skin page, filters, wear walk, about, footer band, 404).** A true linear 0.00–1.00 scale:
- baseline 1px `--color-rule`;
- minor ticks every 0.01 (4px, `--color-border-hover`), mid ticks every 0.05 (7px, `--color-text-tertiary`), major ticks at zone boundaries 0.07, 0.15, 0.38, 0.45 and the ends (12px, `--color-text`);
- tick labels in Martian 12px under major ticks ("0.00", "0.07", "0.15", "0.38", "0.45", "1.00"), muted; zone codes centred above each zone (FN, MW, FT, WW, BS) in Martian 500 12px;
- because FN, MW and WW are narrow on a linear scale, labels that would collide offset alternately above and below the baseline; on mobile (<640) the ruler keeps the true scale but hides the 0.01 ticks and shows only zone codes;
- **lit band:** the skin's exterior zone gets a 6px-high band above the baseline in `--color-text` at 85% (dark) / ink (Daylight) and its zone code turns ink 600 — the lamp is "lighting" that interval. No tinted fills on other zones;
- **jaw:** only when an exact float exists in data (the current SIH data has no per-item float, so the jaw is not shown). If a float is ever added, the amber jaw points to the value with a Martian readout above it ("0.2471"). Never estimate, randomise or default a float.
- readout to the right (or below on mobile): "Field-Tested · 0.15–0.38" in Martian 14px.
- `role="img"`, `aria-label="Exterior Field-Tested, float range 0.15 to 0.38"`.

Source of zone boundaries: `EXTERIORS` from the skins helpers. No hard-coded numbers in the component.

### 7.10 Marks
- **StatTrak™:** tag variant `stattrak`. On the skin page the readout adds the line "Counts kills made with this weapon" (true in-game behaviour).
- **Souvenir:** tag variant `souvenir`. Readout line: "Dropped at a CS2 Major; may carry tournament stickers" only if the item name shows the event; otherwise just the tag.
- **★:** `StarMark` inline SVG, a solid five-point star, 10px in tags and 12px in readouts, fill `--rarity-gold`, `aria-hidden`, with visually hidden text "Star item". Used in tags ("★ Knife", "★ Gloves") and before the weapon line. Never decorative elsewhere.

### 7.11 Price display (`PriceDisplay` — keep, restyle)
Martian 600, currency symbol from the existing currency provider at the same size, minor units at the same size (no superscript cents). The store does not show "was" prices, Steam comparisons or discount percentages (§15). Loading: a 56×16 block in `--color-bg-secondary`. Price changed on re-confirm: the old price struck through in muted next to the new one only inside the checkout alert (§13.7), never in the catalog.

### 7.12 Quantity (`QuantitySelector`)
Skins are listed by exact name; several identical copies can exist (`count`). The stepper appears only in the cart and only when `count > 1`: three joined segments in one 2px-radius frame (`Minus` 40×40 | Martian value 44px | `Plus` 40×40), max = real `count`, with the hint "3 available" at the maximum. Otherwise the cart row shows "1" in Martian with no stepper. Labels "Decrease quantity" / "Increase quantity"; clamp on blur with an `aria-live="polite"` announcement.

### 7.13 Filters (`ProductFilters`) — the "inspection panel"
- Desktop: left column 288px, sticky under the header, `--color-bg` (no box), groups separated by 1px hairlines.
- Group header: 48px row, Martian micro-label (e.g. "EXTERIOR"), selected count as Martian ink ("2") and `ChevronDown`; a button with `aria-expanded`. Panels open via grid-rows 0fr→1fr over 200ms. Open by default: Weapon type, Exterior, Rarity, Price.
- Only groups and values present in the current result set, each value with its real count (Martian 12px muted, right-aligned).
- Group order and controls:
  1. **Weapon type** — checkbox rows: Knives, Gloves, Rifles, Pistols, SMGs, Heavy (labels from `CATEGORY_LABELS`). Hidden on weapon-type and weapon pages.
  2. **Weapon** — checkbox rows grouped under their type in faint micro-labels; a search-in-list input (Martian 14px, 40px) appears when there are more than 10 weapons. Hidden on weapon pages.
  3. **Exterior** — the calibrated ruler at 256px wide with five **zone toggles** (each zone's span is a button, `aria-pressed`, labelled "Field-Tested, 0.15 to 0.38, 412 skins") and two amber **jaws** for selecting a contiguous range by drag or keyboard (arrow keys move the jaw from boundary to boundary: 0.00, 0.07, 0.15, 0.38, 0.45, 1.00; Home/End jump to the ends; each jaw is `role="slider"` with `aria-valuetext="0.15, start of Field-Tested"`). Zone toggles and jaws are two views of one state: non-contiguous selections hide the jaws and show the lit zones only. Selected zones are lit (6px band). Below the ruler: the readout "FT, WW · 0.15–0.45" and, if such items exist, a checkbox "Not painted" (vanilla knives). This group is the store's "float range" filter: it filters by exterior bands, which is what the data holds; it never claims a per-item float.
  4. **Rarity** — checkbox rows with a 2px spine in each tier colour and the tier name in its colour (Martian 12px caps), ordered Consumer → Contraband, counts right.
  5. **Price** — two Martian inputs (Min / Max in the active currency) plus a dual-jaw slider on a plain 1px track (no zone ticks; ticks at the quartiles of the current result set's prices are allowed if computed). Prices bind to the active currency.
  6. **StatTrak™** — segmented control: Any / Only / None.
  7. **Souvenir** — segmented control: Any / Only / None.
  8. **Phase** — checkbox rows, only when phase data exists in the result set.
  9. **Collection** — checkbox rows with search-in-list, only when the catalog carries collection data. The current SIH sync derives no collection field, so this group is hidden until the data exists. Do not invent or scrape it for the UI.
- Above the grid: a sentence-form result line in Martian 14px ("1,284 skins · Rifles · Field-Tested") plus active chips.
- Mobile: a sticky toolbar under the header (Outline "Filter" with the count in Martian, and the sort select). Filter opens a full-height sheet from the bottom (`--color-raised`, 0px radius, a square plane like every panel) with the same groups and a sticky footer: Indicator "Show 1,284 skins" and Text "Clear all".
- Filter state lives in the URL (existing logic). Back/forward restores it.

### 7.14 Sort (`ProductSort`)
Native select, 36px, inline label "Sort" in Martian micro-label. Options (only those the API supports): Price, low to high · Price, high to low · Rarity, highest first · Name A–Z · Recently added (only if `createdAt` is meaningful for synced items; otherwise omit).

### 7.15 Pagination
- Numbers in 40px squares, Martian 14px, 2px radius. Hover: fill `--color-raised`. Current: ink text with a 2px amber bar at the bottom of the square, `aria-current="page"` (no filled box).
- "Previous" / "Next" are Text buttons with `ChevronLeft` / `ChevronRight`. Ellipses after 1 … n.
- Mobile: "Page 2 of 27" (Martian) with Previous / Next.
- If the catalog uses Load more: "Showing 48 of 1,284" in Martian muted, then Outline md "Load 48 more", centred.

### 7.16 Breadcrumbs
Source Sans 14px muted links, separator `ChevronRight` 12px faint (`aria-hidden`), current page ink with `aria-current="page"`, `nav aria-label="Breadcrumb"`. Mobile shows only the parent as a back link with `ChevronLeft` ("Rifles"). Emit `BreadcrumbList` JSON-LD via the existing `JsonLd`.

### 7.17 Tabs and accordion
- **Tabs** (skin page "Details / Delivery / Price notes", account): Sofia 650 uppercase 15px, 48px high, tablist with a 1px hairline; active tab ink with a 1px `--color-rule` underline plus a 2px amber bar 24px wide at its left start (the indicator light). Inactive muted, hover ink. WAI-ARIA tabs. On mobile, tabs become accordions.
- **Accordion** (FAQ, mobile filter groups, mobile footer columns): 56px header rows, Source Sans 600 step-1, `Plus` icon that becomes `Minus` (no rotation). Open panel on `--color-bg` with 20px padding; rows separated by hairlines; the open row's header gets a 2px amber bar at its left edge. Multiple can be open.

### 7.18 Toasts
- Desktop bottom-right 24px; mobile top under the header, full width minus 32px.
- `--color-raised`, 2px radius, `--shadow-lg`, max-width 380px, a 2px left bar in the semantic colour (or amber for cart).
- Cart toast: compact row (§7.8) + "Added to cart" + Text "View cart" + Indicator sm "Checkout".
- Status toasts: 16px `CircleCheck` / `TriangleAlert` / `Info` in the semantic colour + text.
- Auto-dismiss 5s, pause on hover/focus, close `X`. `role="status"` (`role="alert"` for errors). Entrance translateY 8px→0 + opacity 200ms; reduced: opacity only.

### 7.19 Dialog (`Dialog`, `ConfirmDialog`, preference centre, image zoom)
Centred, 2px radius, `--color-raised`, `--shadow-xl`, max-width 560px, 32px padding. Title Sofia 600 step-2. Close `X` top-right. Scrim `--color-scrim`, no blur. Focus trap, Esc, focus return, `role="dialog"`, `aria-modal`, `aria-labelledby`. Entrance: rise 8px + fade over 280ms on `--ease-instrument`. Destructive: Danger on the right, Outline "Cancel" on the left.

### 7.20 Loaders
- **Readout loader** (replaces `ShelfLoader`/`LoadingSpinner`): three 4×4 squares in a row that light amber in sequence (420ms cycle), like an instrument's activity LEDs. `role="status"` with hidden "Loading". Reduced motion: static text "Loading…".
- Page-level loading uses skeletons, never spinners.

### 7.21 Cookie banner and preference centre
- **Banner** (first visit, nothing stored): a docked panel at the bottom-left, 440px wide on desktop (full width minus 32px on mobile), `--color-raised`, 2px radius, `--shadow-lg`, 20px padding. It never covers the mobile sticky buy or checkout bar; when one exists it docks above it.
- Copy: "We use necessary cookies to run the store. Analytics and marketing cookies load only if you allow them." + link "Cookie policy".
- Three **visually identical** Outline sm buttons in one row: "Accept all", "Reject all", "Customise".
- `role="region"`, `aria-label="Cookie consent"`, not modal. Analytics/marketing load only after consent.
- **Preference centre:** dialog "Cookie settings" with three rows (Necessary locked on "Always on", Analytics, Marketing), each with a one-sentence purpose and a "Show cookies" disclosure listing name, provider, purpose, expiry (same as the Cookie Policy table). Footer: Indicator "Save choices", Outline "Accept all", Outline "Reject all". Opened from the banner and the footer's "Cookie settings".
- Storage key renames to `patinaskins-consent` (with version and timestamp); update the Cookie Policy table.

### 7.22 Checkout steps (`Stepper` restyle)
A vertical `<ol>` of four steps (§13.7). Each step:
- header row 64px: step number in Martian 600 step-1 inside a 32px square with 2px radius (ink on `--color-bg-secondary`; current: on-accent on amber; complete: `Check` on `--color-bg-secondary`), title Sofia 600 step-2, status on the right;
- **current:** panel open on `--color-bg` with a 1px left rule at the number's centre line running down the panel (the steps hang from one vertical rule), `aria-current="step"`;
- **complete:** closed, one-line summary in Source Sans 14px muted ("Signed in as fennec_77 · SteamID …4821"), Text "Change";
- **upcoming:** closed, title faint, not focusable;
- Continue (Indicator lg) bottom-right of the panel, Back (Text) bottom-left except on step 1;
- errors: field messages plus a summary at the top of the panel ("Check 2 fields") that links to the fields and receives focus;
- moving on: next panel opens (200ms), focus moves to its heading, a hidden live region says "Step 3 of 4, Receipt and billing".
- Mobile: same stack, 56px headers, summaries wrap to 2 lines.

### 7.23 Cart drawer (`CartSheet`)
- Right panel 420px (100% on mobile), `--color-raised`, `--shadow-panel`, scrim behind. Slides translateX(100%)→0 over 280ms on `--ease-instrument`; closes in 220ms. Reduced: 120ms fade. No rotation, no door.
- Header: "Cart" in Sofia 600 step-2, count in Martian, close `X`.
- Rows: compact rows (§7.8) with exterior, rarity tag, marks, price (Martian), stepper only if `count > 1`, Text "Remove" with `Trash2` 16px. Removing collapses the row over 200ms and is announced.
- Footer (sticky): Subtotal (Martian); the line "Prices are re-confirmed when you pay. If one changes, you'll see it before paying." (14px muted); Total label "Total", or "Total incl. VAT" only when `COMPANY.vatRegistered`; Indicator lg full-width "Checkout"; Text "View cart"; payment logos at 24px.
- Empty: an empty stage (lamp line on, nothing under it), "Your cart is empty", Text links to Knives, Rifles, Gloves, and Outline "Browse all skins".
- Focus trap, Esc, focus return, `role="dialog"`, `aria-label="Cart"`.

### 7.24 Search dialog (`SearchDialog`)
- Opens from the header field or `/` key. A full-width panel dropping from under the header (`--color-raised`, `--shadow-lg`, max-height 80vh), translateY −6px→0 + opacity, 200ms.
- One input at step-2 in Source Sans 400 with a leading `Search` 20px, placeholder "Search skins: AK-47 Redline, Karambit Fade…", and Text "Close" (Esc hint in Martian 12px).
- Live results (debounced 200ms): "Skins" as compact rows (max 6); "Weapons" as text links with counts ("AK-47 · 214"); a Text button "See all 318 results".
- Combobox pattern: arrows, Enter opens, Esc closes.
- No results: "Nothing matches “xyz”." plus the six weapon types as text links.

### 7.25 Purchase status timeline (new, my purchases, purchase detail, order confirmed, how delivery works)
Driven by `SIH_STATUS_META` labels and `inFlight` (coppedskins `status-labels.ts`). Happy path nodes: **Payment confirmed → Processing → Trade offer sent → Delivered**. "Awaiting payment" precedes them only while true.
- Desktop: a horizontal track on a 1px `--color-rule` baseline, nodes 10px circles. Done nodes: filled ink. Current node: the amber jaw above it pointing down, node outlined amber, label ink 600. Upcoming: hollow `--color-border-hover`, label faint. Timestamps under each done node in Martian 12px muted (from `SihOrderEvent` / `paidAt` / `submittedAt` / `finishedAt`; only real ones).
- Mobile: the same as a vertical track, nodes on the left rule.
- **Trade offer sent** state adds an action row: Indicator sm "Open trade offer" (`ArrowUpRight`, to the real offer URL) and, if `senderTimeout` exists, "Accept before 14:32, 8 Oct" in Martian (real expiry, no countdown animation).
- **Branches:** Failed, Rolled back, Refund pending, Refunded replace the remaining track with a danger or neutral end node and a one-sentence status from the honest copy in §15 ("Delivery didn't go through. Your refund is being processed."). The track never shows a future the order can no longer reach.
- While `inFlight`, the page polls (existing logic) and the change animates (M8). `aria-live="polite"` announces the new status.

### 7.26 Steam account block (account overview, checkout step 1, trade-URL page)
A row, not a card: 40px square avatar with 2px radius (Steam avatar from data; fallback initials on `--color-bg-secondary`), persona name in Source Sans 600, below it "SteamID …4821" in Martian 12px muted (last four only), and on the right a status tag: "Trade URL ready" (success) or "Trade URL missing" (warning) with Text "Add trade URL". Unlinked state: one sentence ("Link your Steam account so we can send skins to it.") and the Account button "Sign in through Steam".

### 7.27 Empty state (`EmptyState` restyle)
An empty stage 160×120 (lamp line on, pool on, nothing under it), H2 Sofia 600 step-2, one sentence muted, one primary action and at most one Text link. Copy per context: cart "Your cart is empty"; saved "Nothing saved yet"; purchases "No purchases yet"; search "Nothing matches “…”"; filters "No skins match these filters"; weapon with no stock "No AK-47 skins in stock right now". No people, no emoji.

### 7.28 Alert
2px radius, tint fill, 1px semantic border, 16px semantic icon, Source Sans 15px. Page fetch error: "Something went wrong loading this page." + Outline "Try again".

---

## 8. Icons — Lucide

`lucide-react` (installed). One system: `strokeWidth={1.5}`, sizes 12, 14, 16, 18, 20 or 24, `aria-hidden` unless the icon is the only content (then the parent has `aria-label`). No icon in circles or tinted squares; icons sit in text colour. On desktop, header actions pair icon + word. No weapon, crosshair, skull, bullet or knife icons anywhere (they would be decoration).

| Job | Glyph | Job | Glyph |
|---|---|---|---|
| Cart | `ShoppingCart` | Search | `Search` |
| Save / saved | `Bookmark` (filled when saved) | Account | `CircleUser` |
| Menu | `AlignRight` | Close | `X` |
| Add to cart | `Plus` | Remove | `Trash2` |
| External link (Steam) | `ArrowUpRight` | Inline link arrow | `ArrowRight` |
| Back / breadcrumb | `ChevronLeft` / `ChevronRight` | Disclosure | `ChevronDown` |
| Accordion | `Plus` / `Minus` | Filters | `SlidersHorizontal` |
| Rotate stage (skin page) | `Rotate3d` | Reset view | `RotateCcw` |
| Zoom stage | `ZoomIn` / `ZoomOut` | Lamp on/off (skin page, optional) | `Lamp` |
| Trade offer | `Repeat2` | Trade URL | `Link2` |
| Payment | `CreditCard` | Secure checkout | `LockKeyhole` |
| Success | `CircleCheck` | Error / warning | `TriangleAlert` |
| Info | `Info` | Check | `Check` |
| Theme | `Sun` / `Moon` | Currency | none (Martian code "GBP") |
| Sign out | `LogOut` | Copy order ID | `Copy` |
| No render | `ImageOff` | Help | `CircleHelp` |
| Mail | `Mail` | Clock (offer expiry) | `Clock` |

Not used: `Handbag`, `Heart`, `Package`, `Truck` (no physical delivery), `Star` (★ is our own SVG), `Sparkles`, `Flame`, `Zap`, `Crown`, `Gem`. Phosphor is not used in the storefront.

---

## 9. Logo and favicon

### 9.1 Wordmark
- "Patinaskins" in Sofia Sans Condensed 720, sentence case, tracking −0.01em, converted to outlines.
- The tittle of the first **i** is a square **lamp**: a solid square the width of the i's stem, in amber (`#F39A2E` on dark grounds, `#C77A12` on light grounds, where it is decorative and the letter stays legible through its stem). The second i keeps a normal ink tittle. That one square of light is the brand's ownable detail.
- Files: `public/logo.svg` (ink `#141517` with `#C77A12` tittle), `public/logo-dark.svg` (`#ECEAE5` with `#F39A2E` tittle), `public/logo-on-paint.svg` becomes identical to `logo-dark.svg` (kept for existing references, then removed in the sweep).
- Clear space: the height of the "P" on all sides. Minimum width 96px; below that, the monogram.
- No effects, no glow, never on a tag.

### 9.2 Monogram
A square tile (0px radius, `#121315`) with a Sofia 720 capital **P** in `#ECEAE5`, optically centred, and the amber lamp square placed at the top-right of the P's bowl, in the position of the wordmark's tittle relative to the letter.
- ≥180px (apple-touch, android, OG): add the zone strip (five 2px segments, FT lit in `#ECEAE5`) along the tile's bottom edge, inset 18%.
- 32px: no zone strip; P strokes thickened to ≥2px; lamp square 4px.
- 16px: a redrawn, heavier P (stem ≥2px, counter opened) and a 3px lamp square. The tile stays dark on both light and dark browser chrome, so no colour-scheme swap is needed; `public/favicon.svg` still declares a 1px `#2A2C30` edge so it does not vanish on dark tabs.

### 9.3 Files and code
- Regenerate `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png` with `scripts/gen-favicons.mjs` (replace its inline SVGs with the monogram, full and small; keep its target list).
- `src/app/icon.svg`, `public/manifest.json` (`theme_color: #0D0E10`, `background_color: #121315`, name "Patinaskins"), `viewport.themeColor` in `layout.tsx` (dark `#0D0E10`, light `#F6F6F5`).
- `src/components/layout/BrandMark.tsx`: monogram + wordmark via `currentColor` for letters and `var(--color-accent)` for the lamp square; no hex.
- Root metadata: title template "%s · Patinaskins", description "CS2 skins with exterior, rarity and price in plain view. Pay by card; we send the skin to your Steam account as a trade offer." OG image: dark room, wordmark, one stage with lamp line.

---

## 10. Motif usage rules

### 10.1 The lamp
- **Is:** the 1px lamp line at the top of a stage, the light pool under it (`--stage-lamp`), and the specular highlight on renders (WebGL, hero and skin page only).
- **Used on:** every skin stage (trays, compact rows, feature trays, skin page, cart rows, purchase rows, loadout preview), empty states, the 404, the home hero.
- **Never:** behind text, on buttons, in the header or footer, coloured, pulsing, or as a general background effect. The pool moves only when the pointer is over that stage (fine pointer) or during a named moment.

### 10.2 The rarity spine
- **Is:** 3px (trays) or 2px (tags, filter rows, chips) of `var(--rarity)` on the left edge.
- **Used on:** every skin representation and rarity UI.
- **Never:** on the right or top edge, around the whole object, as a glow, or on non-skin UI.

### 10.3 The float ruler and the jaw
- **Is:** the zone strip (schematic) and the calibrated ruler (true scale); the jaw is its cursor.
- **Used on:** trays and rows (zone strip); skin page, exterior filter, wear walk, about hero, footer band, 404 (calibrated). The jaw also marks the current node of the purchase timeline and serves as every slider thumb.
- **Never:** with invented float values, with tinted zone fills, as a progress bar for anything other than wear or delivery status.

### 10.4 Material rules
Planes are square, controls 2px, trays 4px (§5.3). Stages are always `--color-stage` with the lamp; renders are never placed directly on the page colour. No textures (no carbon fibre, no brushed metal, no noise, no grid paper). Depth comes from the stage, the lamp and the overhead shadow, never from outlines stacked on outlines.

---

## 11. Header, loadout board, mobile menu, footer

### 11.1 Header — the rig (≥1024px)
- One tier, 64px, `--color-rig`, 1px bottom hairline, full width with inner `max-w-container`. No utility line.
- **Left:** wordmark (24px cap height) linking to "/".
- **Centre (≥1280px):** weapon types as Sofia 650 uppercase 15px links with 0.05em tracking: KNIVES · GLOVES · RIFLES · PISTOLS · SMGS · HEAVY, then the trigger "ALL SKINS" with `ChevronDown` (opens the loadout board). Active: a 2px amber bar 16px wide under the label's left start. Hover: ink (from muted) over 140ms. 1024–1279px: only "SKINS" (board trigger).
- **Right:** a compact search field (240px, 36px high, `--color-raised`, 1px control border, `Search` 16px, placeholder "Search skins", Martian key hint "/") that opens the search dialog; currency select (Martian "GBP", 36px); theme toggle (`Sun`/`Moon`, "Switch to Daylight" / "Switch to dark"); account (Steam avatar 24px square 2px radius + persona name truncated at 14ch, or `CircleUser` + "Sign in"); cart (`ShoppingCart` + "Cart" + Martian count in the `indicator` tag when >0).
- **Sticky:** always sticky; after 80px of scroll it compacts to 56px. It does not hide on scroll (store navigation stays reachable). No layout shift: header height is reserved.

### 11.2 Loadout board (mega-menu)
- Full-width panel under the rig: `--color-rig`, `--shadow-lg`, 32px padding, max-height 72vh, 1px top hairline.
- Six columns: Knives, Gloves, Rifles, Pistols, SMGs, Heavy. Column head: Sofia 650 uppercase 15px + Martian count of available skins. Under it every weapon of that type that has stock, Source Sans 15px, with its count in Martian 12px faint right-aligned; hover ink + amber 2px bar at the left. Knives and Gloves list their real model names (Karambit, Butterfly Knife, M9 Bayonet…; Sport Gloves, Driver Gloves, Hand Wraps…), from data.
- Right column (280px): a preview stage (4:3, lamp on) showing the most expensive in-stock skin with a render for the hovered weapon, its name, exterior short code and price, then "All AK-47 skins · 214" with `ArrowRight`. Real data only; if nothing has a render, the preview is omitted.
- Opens on click and on hover-intent (150ms), closes on leave (250ms grace), Esc, focus leaving. Trigger: `aria-expanded`, `aria-controls`; arrow keys move within and across columns. Animation `panel-in` 200ms.

### 11.3 Mobile header (<1024px)
- 56px rig: wordmark left (20px cap height); right: `Search` icon button, `ShoppingCart` with Martian count, `AlignRight` "Menu" icon button.
- Menu: full-height sheet sliding in from the right (`--color-rig`): the six weapon types as large Sofia 650 step-3 rows with Martian counts and `ChevronRight`, each opening a weapons list with a "Back" row; then Account rows (My purchases, Trade URL, Saved, Profile or Sign in through Steam), Help (How delivery works, FAQ, Contact), currency select, theme segmented control (Dark / Daylight). Focus trap, Esc.

### 11.4 Footer — the bay floor
Inside `max-w-wide`, `--color-floor`, ink text:
1. **Ruler band:** the calibrated ruler drawn full width as the footer's top edge (ticks and zone codes only, no lit band, `aria-hidden`), 48px tall, then 56px space.
2. **Four columns** (desktop; hairline-separated):
   - **Skins:** Knives, Gloves, Rifles, Pistols, SMGs, Heavy, All skins.
   - **Orders:** How delivery works, My purchases, Trade URL, Cart.
   - **Help:** FAQ, Contact us, Refunds, Payment.
   - **Legal:** Terms & conditions, Privacy policy, Cookie policy, All policies, and the button "Cookie settings".
   - Heads: Martian micro-label muted. Links: Source Sans 15px ink, hover underline.
3. **Credentials sheet:** a ruled two-row definition grid (1px hairlines), labels in Martian micro-labels, values in Source Sans 15px (values that are identifiers in Martian 14px): Company `COMPANY.name` · Company number `COMPANY.companyNumber` · VAT number (only when `COMPANY.vatRegistered`) · Registered office `COMPANY.registeredOffice` · Email (mailto) · Phone (only when not null) · Support hours `COMPANY.supportHours`. Above it the line "Patinaskins is a trading name of {COMPANY.name}." All from `src/lib/company.ts`.
4. **Disclaimer** (Source Sans 14px muted): "Patinaskins is not affiliated with or endorsed by Valve Corporation. Counter-Strike, Steam and the Steam logo are trademarks of Valve Corporation."
5. **Bottom row** (1px top hairline, 24px padding): left "© {year} Patinaskins" in 14px muted; right `/payments/visa.svg`, `/payments/mastercard.svg`, `/payments/pci-dss.svg` via `next/image` at 28px high, width auto, in colour as supplied (each SVG carries its own white card), alts "Visa", "Mastercard", "PCI DSS compliant", 8px gap. Social text links only if env URLs are set.
6. **Mobile:** ruler band without 0.01 ticks; columns become accordions; credentials one column; logos centred at 24px; copyright last.

The checkout uses a compact footer: policy links, the credentials one-liner, logos.

---

## 12. Motion hooks for the motion engineer

Use the data-attribute engine (`src/lib/motion/engine.ts`, `WEBGL-3D-KNOWLEDGE.md` §4.2). The implementing engineer leaves the markup hooks and the static end state; the motion engineer adds behaviour. Remove the dresser/drawers/rack/hooks scenes from `SCENES` and register the new ones.

### 12.1 Depth layers (pointer amplitudes are maxima at the viewport edge, fine pointers only)
| Layer | Content | Pointer offset | Scroll speed |
|---|---|---|---|
| D0 | the room: backdrop plane, floor horizon line | 0 | 0 |
| D1 | rulers, rarity spines in set-pieces, bay columns | 3px | ±0.04 |
| D2 | trays and stages | 8px + tilt | ±0.08 |
| D3 | renders inside stages | 12px (moves against the tray by 4px: parallax inside the stage) | ±0.12 |
| D4 | readout tags attached to a feature tray (marks, exterior, price) | 14px | ±0.06 |
| LAMP | the light (not a layer: its position follows the pointer or the scene) | — | scene-driven |
| L0 | headlines, body, CTAs, prices, filters | 0 | 0 |

Readable text and CTAs never move with parallax. Catalog, skin, cart, checkout, account, policies: only D2/D3 hover tilt on a single tray at a time and the lamp; no scroll parallax.

### 12.2 Named signature moments
| ID | Name | Where | What it communicates | Static / reduced-motion state |
|---|---|---|---|---|
| M1 | Under the lamp | home hero | this skin is right here, look closely | feature tray flat, lamp at top centre, ruler drawn, lit band on |
| M2 | Bays | home "Shop by weapon" | six bays, each holds its own kind | bays static, renders centred |
| M3 | Rarity ladder | home rarity section | the tiers climb, colour means rank | spines at full height |
| M4 | Wear walk | home exterior section | wear is a measured interval | all five zones shown, one example per zone, horizontal snap scroller |
| M5 | Lamp follow | every tray on fine pointers | the surface is real, light moves on it | lamp at rest |
| M6 | Inspect | skin page stage | turn it in your hands | flat tray, lamp at top centre, controls hidden |
| M7 | Into the cart | add to cart (any tray, skin page) | it went into your cart | count updates, toast |
| M8 | Next node | purchase timeline status change | your order moved on | new state shown |
| M9 | Calibration | about hero, how delivery works hero | everything here is measured | ruler fully drawn |
| M10 | Tray to stage (optional) | tray → skin page navigation | same object, closer | normal navigation |

**M1 Under the lamp (home hero).** Section `data-scene="bay-hero"`. One feature tray (`data-tray`, `data-depth="2"`) holding the hero skin (§13.1) with a WebGL canvas (`data-lamp="webgl"`) over its stage. Pointer moves the lamp (lerp 0.12) and tilts the tray (≤8°). On load, the lamp sweeps once left→right across the render (`lampSweep` 1600ms on `--ease-in-out`) while the ruler under the tray draws in (ticks staggered 4ms) and the lit band fades in at the end. Scroll (desktop only, pinned 160vh): progress 0–0.5 the lamp moves to a three-quarter top-left raking angle and the tray settles flat; 0.5–1 the camera pulls back (tray scale 1→0.62, translateY towards the next section) and six more trays from the Bays section rise into view behind it (D2), handing over to M2. Mobile: no pin, no WebGL; a single CSS lamp sweep on load (1.2s), then static. LCP is the H1 text; the hero render has `priority`; the WebGL layer initialises after LCP.

**M2 Bays.** Six tall bays (`data-bay`) in a row. On entering (30–70% of viewport) each bay's lamp line switches on in sequence (stagger 80ms, `lamp-on`), then its render rises 12px into place (D3). Hover/focus on a bay: its render lifts 6px, its lamp pool brightens, the others dim their pool by half (160ms). Each bay is one link; motion never blocks navigation.

**M3 Rarity ladder.** Seven spines (`data-spine`, D1) scale from 0 to full height (scaleY, origin bottom) staggered 60ms as the section enters; heights are equal (they are ranks, not quantities). Hover/focus a tier: its spine widens 3px→6px and a strip of three real skins of that tier slides out from behind it (translateX, 200ms). Each tier is a link to the catalog filtered by rarity.

**M4 Wear walk.** `data-pin="wear"`, pinned for about 200vh on desktop. A calibrated ruler spans the viewport; the amber jaw travels 0.00→1.00 with scroll progress. As the jaw enters each zone, that zone's band lights and a tray of a real in-stock skin in that exterior rises (D2) above the zone with its name and price (L0 within the track). The jaw here is a scroll cursor, not an item float, and the copy says so ("Exterior zones on the float scale"). Mobile and reduced motion: a horizontal scroller with snap, one card per zone, each with its zone strip.

**M5 Lamp follow.** On fine pointers only, each tray stage under the pointer gets `--lx`/`--ly` updated on `pointermove` (rAF-throttled, one tray at a time), and `data-tilt` drives a ≤4° tilt with the spring from §6. Leaving resets both over 280ms. No WebGL in grids. Touch: nothing.

**M6 Inspect (skin page).** The stage is `data-scene="inspect"` with a WebGL lamp (reuse and extend `glaze.ts`: use the PNG's alpha as the body mask instead of background detection, derive normals from luma gradients as it does, warm specular from `--lamp-rgb`). Controls under the stage: "Rotate" (`Rotate3d`, toggles drag-to-rotate: yaw ±25°, pitch ±10°, release eases back only when the user presses "Reset"), "Reset view" (`RotateCcw`), "Zoom" (`ZoomIn`/`ZoomOut`, 1× / 2× with drag to pan at 2×). Keyboard: when the stage has focus, arrow keys rotate by 5°, `+`/`−` zoom, `0` resets; instructions in a visually hidden description. The wheel never zooms (no scroll hijack). The pointer moves the lamp at all times on fine pointers. Mobile: no WebGL; pinch zoom on the image via the zoom dialog; the lamp stays at rest.

**M7 Into the cart.** On add: the stage's lamp dims (opacity 1→0.4, 120ms), a FLIP ghost of the render (opacity 0.9, scaled to 40px) flies to the header cart over 420ms on `--ease-instrument`; the cart count rolls (`count-roll`, old digit up and out, new digit in); the lamp comes back on; then the toast. Reuse `bag-flight.ts` (rename hooks to `data-cart-target`). If the header is off-screen, skip the ghost.

**M8 Next node.** When polling returns a new status, the track segment draws from the previous node to the new one (scaleX, 420ms), the jaw slides to the new node, the node fills. Once per transition; never on first render.

**M9 Calibration.** Ruler SVG with `data-draw`: baseline draws (600ms), ticks appear left→right (4ms stagger), zone codes fade in, then the lit band (FT) turns on. Words of the H1 reveal with `data-anim="words"` (40ms stagger).

**M10 Tray to stage (optional, progressive enhancement).** If the View Transitions support in this Next version is stable (read `node_modules/next/dist/docs` first), give the tray's render and the skin page's render the same `view-transition-name` so the render morphs into the inspection stage (280ms). If not stable, skip it entirely.

### 12.3 Budgets and rules
- WebGL only in M1 (home) and M6 (skin page): one context per page, DPR capped at 1.5, paused when off-screen or tab hidden, initialised after LCP via idle callback, not created on coarse pointers, `navigator.deviceMemory < 4`, `saveData`, or reduced motion. Every WebGL layer has the CSS lamp as its fallback, which looks complete on its own.
- Home JS for motion (excluding the Next runtime) ≤ 70 KB gzip including the lamp shader; no new 3D library is needed (raw WebGL as in `glaze.ts`). Adding GSAP or Lenis needs a justification against the decision tree; prefer the existing ticker.
- CLS 0; no scroll-jacking beyond the two home pins (M1, M4); every scene reverts on route change.
- Store surfaces: functional motion only (filters, tabs, toasts, cart drawer, M5, M6, M7, M8, skeleton fades).

---

## 13. Pages — layout specs

Global skeleton: rig header → breadcrumbs (all except home, checkout, auth) → main → floor footer. The page H1 is the first heading in `main`. Every page has a unique title and description. Suggested routes follow the existing structure; if the lead keeps different paths (e.g. `/store`, `/product/[slug]`), apply the same specs there.

### 13.1 Home — a landing with set-pieces
Section order, shapes and spacing (no hero → 3 cards → testimonials → CTA; no stats, no testimonials, no partner logos):

1. **Under the lamp** (M1). Height 100svh minus the header, `--color-bg`, `max-w-wide`.
   - Desktop 12 columns: left columns 1–5 (L0): Martian eyebrow "CS2 SKIN STORE"; H1 at display-xl "Every skin, under the lamp."; lead (step-1 muted) "Counter-Strike 2 skins with exterior, rarity and price in plain view. Pay by card and we send the skin to your Steam account as a trade offer."; the **primary action is search**: a 56px search field (Source Sans 17px, `Search` 20px) with the placeholder "Search {liveCount} skins" (real count) and Indicator lg "Search"; below it Text links to Knives, Gloves, Rifles.
   - Columns 6–12: the feature tray at about 640px wide with the hero skin (the most expensive in-stock ★ or Covert item with a render; real data, recomputed on revalidate), its readout attached on the right edge at D4 (weapon line, skin name in Sofia step-3, rarity tag, marks, exterior + calibrated ruler, price in Martian step-2, Text "Inspect" with `ArrowRight`).
   - A 1px floor horizon line (D0) runs across the room at 72% height behind the tray.
   - Mobile (390): H1 at step-6, lead, search field, then the feature tray full-width (no tilt, CSS lamp sweep), readout below the tray, not overlaid.
   - Spacing: 0 top, 0 bottom (hands over to Bays).
2. **Shop by weapon** (M2). H2 left "Shop by weapon" with a one-line lead. Six bays in a single row on desktop with **unequal widths** by assortment importance: Knives and Gloves 2 units each, Rifles 2, Pistols, SMGs, Heavy 1 each (8 units over 12 columns with 24px gaps; adjust if a type has no stock and drop it). Each bay: a tall stage (lamp on) with one real render, the type name in Sofia 650 uppercase step-2 at the bottom-left, the real count ("214 skins") and "from £3.10" (real minimum, active currency) in Martian. Tablet 3×2, mobile a 2-column grid with Knives and Gloves full-width on top. Padding 96 top / 64 bottom.
3. **By price.** A band (`--color-bg-secondary`, full bleed). H2 "By price" and a segmented control: Under £10 · £10–£50 · £50–£250 · £250 and up (bands in the active currency, converted from one config). The selected band shows one feature tray (2×2) plus eight standard trays (4 columns). Data is the real cheapest-to-dearest mix within the band; a band with fewer than 3 items is hidden from the control. Text link "All skins in this range" with `ArrowRight`. Padding 80 / 80. Dense.
4. **Rarity, tier by tier** (M3). On `--color-bg`. Left (columns 1–4): H2 and two sentences explaining that rarity is the drop tier set by the game, not a quality grade. Right (columns 5–12): seven spines in a row (Consumer Grade → Contraband/★), each with its name (Martian caps in its colour) and real count; hover reveals three skins. Tiers with no stock show faint with "0 in stock" and are not links. Padding 128 / 96.
5. **How wear works** (M4). Full-bleed `--color-bg-tertiary` band. Eyebrow "EXTERIOR", H2 "Exterior zones on the float scale", one paragraph: float is a number from 0.00 to 1.00 fixed on each copy; the exterior name tells you which zone it falls in; lower means less visible wear. The pinned ruler walk follows. Each zone card states the zone's range and links to the catalog filtered by that exterior. Padding 96 / 96 (pin adds its own length).
6. **StatTrak™ and Souvenir.** An asymmetric split on `--color-bg`: left 7 columns: StatTrak™ — H3, one true sentence ("Adds a counter that tracks kills made with that weapon"), real count in Martian, Text "StatTrak™ skins" link; a row of three compact trays. Right 5 columns, offset 64px down: Souvenir — H3, one true sentence ("Dropped from souvenir packages at CS2 Majors"), count, link, two compact trays. A 1px vertical hairline between them. Omit either half with no stock. Padding 64 / 80.
7. **How delivery works.** On `--color-bg`. The purchase timeline component in its large form (§7.25), static, as four steps: Sign in through Steam → Add your trade URL → Pay by card → Accept the trade offer in Steam; under each step one sentence of honest copy (§15). Text link "Read how delivery works" with `ArrowRight`. Padding 80 / 64.
8. **Questions.** Two columns: left H2 "Questions" and Outline "All questions"; right four accordion items pulled from the FAQ (delivery, trade URL, trade protection, refunds), word-for-word with the FAQ page. Padding 64 / 128.

Every count, price minimum and ranking is computed from data; a section with no data is omitted; no skin appears twice on the home page (keep the existing claimed-set logic).

### 13.2 Catalog (`/catalog`)
- Opener: H1 "All CS2 skins" (Sofia step-5) with the Martian count beside it; one sentence on what's in stock; on the right (desktop) the six weapon types as a text index with counts (Sofia 600 uppercase 15px, amber bar on hover).
- Body: filter panel 288px left, results right. Toolbar: result sentence + chips left, sort right. Tray grid (§7.8). Pagination or Load more.
- Empty results: empty state "No skins match these filters", the active chips with "Clear all", and the three nearest broader suggestions (e.g. remove the price filter: "Remove £10–£50 to see 214 more"), computed from real counts.
- Mobile: sticky toolbar (Filter, Sort), 2-up grid with 12px gaps, Add visible.

### 13.3 Weapon-type page (`/catalog/[type]`, e.g. Rifles)
- Opener: breadcrumb "All skins / Rifles"; H1 "Rifles" with the count; under it the **weapon index**: every rifle with stock as a wrapping row of text links "AK-47 214 · M4A4 167 · AWP 158 · …" (Sofia 600 15px name, Martian 12px count), sorted by count. Mobile: horizontal scroller.
- Knives and Gloves pages use the same index with model names, and their trays show the ★ mark.
- Then the standard filter + grid (Weapon type group hidden).

### 13.4 Weapon page (`/catalog/[type]/[weapon]`, e.g. AK-47)
- Opener: H1 "AK-47" with the count, one factual line from data ("214 skins in stock, from £1.20 to £1,840.00", Martian for the prices), and a compact rarity distribution: seven 2px spines whose **lengths** are the real counts per tier for this weapon (labels with counts; this is data, so lengths are proportional), each a filter link.
- Then the filter + grid (Weapon type and Weapon groups hidden).

### 13.5 Skin page (`/skin/[slug]`)
- **Desktop 12 columns:**
  - **Inspection stage (columns 1–7):** a stage 4:3 (min 520px tall at 1440), 4px radius, spine on the left, lamp line + pool, the render large with its cast shadow, the M6 controls in a row under the stage (Text buttons with icons: Rotate, Reset view, Zoom). Below: the calibrated ruler at full column width with the lit band and readout.
  - **Readout (columns 8–12, sticky):** breadcrumbs ("Rifles / AK-47"); marks row (tags); weapon line (Martian micro-label, ★ when relevant); H1 = skin name (Sofia step-5; for vanilla knives the knife model); a ruled spec table (1px hairlines, 44px rows, label in Martian micro-label, value in Source Sans 15px): Exterior "Field-Tested (0.15–0.38)", Rarity (rarity tag), Weapon, Type, Phase (only if present), Collection (only if present), StatTrak™ / Souvenir (only if true); then the price (Martian step-3) with availability in Martian muted ("2 available" or nothing); the action; then three ruled info rows with 18px icons: `Repeat2` "Delivered as a Steam trade offer to your trade URL", `LockKeyhole` "Card payment" with Visa/Mastercard at 20px, `CircleHelp` "How delivery works" link.
  - **Action states** (from the reference purchase states): ready → Indicator lg "Add to cart" (and Outline lg "Buy now" that goes straight to checkout with this skin, if the lead keeps single-item buying); signed out → Account "Sign in through Steam to buy"; no trade URL → Indicator lg "Add your trade URL" (to the trade URL step, returning here); price re-confirming → disabled "Checking price" with the readout loader; out of stock → disabled "Out of stock" and the line "This exact skin isn't in stock right now." plus a link to the same weapon's page. Save (`Bookmark`) as a Text button.
- **Below the fold:**
  - **Other exteriors and variants:** the same weapon and skin in other exteriors and with/without StatTrak™, as compact rows aligned on one calibrated ruler (each row's lit band in its zone), price on the right. Only real listings. Omit if none.
  - **Tabs:** Details (the item's real attributes; one honest paragraph about what the render shows: "The image is Steam's standard render for this skin. Wear and pattern on your copy may differ."), Delivery (the delivery steps and timing from config), Price notes ("Prices are re-confirmed when you pay.").
  - **More AK-47 skins:** one row of four trays (distinct items).
- JSON-LD Product with an Offer in the active currency.
- **Mobile:** stage full-width (no WebGL, tap opens the zoom dialog), the ruler under it without minor ticks, then the readout; a sticky bottom bar (64px, `--color-raised`, top hairline) with the price in Martian and the action button, appearing once the main action leaves the viewport.

### 13.6 Search (`/search`)
- H1 is the query: Sofia step-5 `“redline”` with the Martian count. A large search input above, prefilled.
- Then the weapon matches as text links with counts ("AK-47 · 6", "M4A1-S · 2") and the standard filter + grid.
- No results: "Nothing matches “xyz”." Suggestions: check spelling, search by weapon name, and the six weapon types as links.

### 13.7 Cart page (`/cart`)
- H1 "Cart" + Martian count.
- Desktop: rows in columns 1–8 (a 160×120 stage with spine and lamp, weapon line, name, exterior + zone strip, rarity tag, marks, price, quantity rule from §7.12, Remove); hairlines between rows.
- **Summary** (columns 9–12, sticky, `--color-raised`, 2px radius, 24px padding): Subtotal, Total (label per VAT rule) in Martian step-2, the re-confirm note, Indicator lg "Checkout", Text "Continue shopping", payment logos 24px, and the merchant line (legal name + support email) in 14px.
- Mobile: stacked rows, summary at the end, sticky bar "Checkout · £84.00".
- Empty: as the drawer's empty state at page scale.

### 13.8 Checkout (`/checkout`) — four steps (§7.22)
- **Frame:** minimal rig (wordmark, "Secure checkout" with `LockKeyhole` 16px, Text "Back to cart"); compact footer. `max-w-narrow`.
- **Desktop:** steps in columns 1–7; **summary** columns 8–12 (sticky): compact rows, subtotal, total, policy links (Terms, Refunds, Privacy) in 14px.
- **Step 1 — Steam account.** If signed in through Steam: the Steam account block (§7.26) with Text "Not you? Switch account". If signed in by email without Steam: one sentence ("We deliver skins as Steam trade offers, so your Steam account must be linked.") and the Account button "Sign in through Steam" (returns to this step). Continue.
- **Step 2 — Trade URL.** The trade URL field (§7.3), prefilled from the account. Mismatch with the linked account blocks Continue. Note under it: "We save it to your account for future orders. You can change it any time in Account → Trade URL." Continue.
- **Step 3 — Receipt and billing.** Email (prefilled), full name, country (restricted list excluded via config), and any billing field the payment provider requires. Continue.
- **Step 4 — Review and pay.**
  - a read-only summary of steps 1–3 with "Change" links;
  - the items as compact rows;
  - **price re-confirmation:** if the live check changed any price, an alert above the items: "The price of AK-47 | Redline (Field-Tested) changed from £12.40 to £12.95." with Indicator sm "Accept new price" and Text "Remove it"; Pay is disabled until resolved; an item that went out of stock shows "No longer in stock" and must be removed;
  - checkbox (required): "I have read and agree to the Terms and Conditions" (link);
  - checkbox (required), the **digital-delivery consent**: "I ask you to start delivery straight after payment and I understand I lose my right to cancel once the trade offer is sent." (link "Refunds policy"); the wording must match the Terms and Refunds policy exactly; the word "withdraw" is not used anywhere in UI copy (§15);
  - Indicator lg "Pay £84.00", enabled only when both boxes are ticked and no price issue is open;
  - under it Visa / Mastercard / PCI DSS at 28px and "Card payments are processed securely by {provider placeholder}. We never see or store your full card number." (matching the Privacy Policy).
  - On submit: loading state, then the existing payment redirect.
- **Mobile:** summary collapses to a top row "Show summary · £84.00" (accordion); steps follow; Pay is full width.
- **Payment failed on return:** alert above step 4: "Your payment didn't go through. You haven't been charged." + "Try again".

### 13.9 Order confirmed (`/order/confirmed`)
- Narrow column. H1 Sofia step-5 "Payment received" (or "Payment confirmed" once the server says so; never claim delivery here).
- Order ID in Martian with a `Copy` icon button.
- The purchase timeline (§7.25) live, with polling and M8.
- "We've sent a receipt to {email}." Then the items (compact rows), totals, and the trade URL used (masked token).
- Buttons: Indicator "View my purchases", Outline "Continue shopping".

### 13.10 Auth
- **Sign in (`/auth/login`):** desktop two columns (max 960px). Left: H1 "Sign in"; the Account button "Sign in through Steam" first and full-width (Steam is required to receive skins); a hairline with "or use email" in Martian micro-label; email, password (show/hide), Text "Forgot your password?", Indicator lg "Sign in"; error summary "Email or password is incorrect." Right (separated by a 1px vertical hairline): H2 "New to Patinaskins?" (Sofia step-3), three true points as a plain list (Steam sign-in links your account for delivery; your purchases and their status in one place; save skins to come back to), Outline "Create an account". Mobile: form first.
- **Register (`/auth/register`):** the step pattern (§7.22) in a 560px column, keeping the existing required fields and the T&C gate: 1 "About you" (first name, last name, date of birth with the 18+ rule from config, error naming the rule), 2 "Contact" (email, phone with country prefix), 3 "Address" (street, city, country, postcode; restricted countries excluded), 4 "Password" (strength hint "At least 8 characters, one number", confirm, Terms checkbox, Indicator lg "Create account" disabled until ticked). After creation, a prompt to link Steam (Account button) with Text "Later".
- **Forgot / reset password:** single 480px column as today, restyled.

### 13.11 Account (`/account/**`)
- **Layout:** desktop left 240px nav as text rows (Overview, My purchases, Trade URL, Saved, Profile, then a hairline and Sign out). Active: ink with a 2px amber bar at the left; others muted. Mobile: a horizontal scroller of the same rows under the H1.
- **Overview:** H1 "Hello, {persona or first name}"; the Steam account block; the latest purchase as a compact row with its status tag and "View"; Text links to Trade URL and Profile. No stat tiles.
- **Trade URL (`/account/trade-url`):** H1 "Trade URL"; one paragraph: "We send every skin you buy as a trade offer to this URL. It must belong to the Steam account linked here."; the Steam account block; the trade URL field (§7.3) with Indicator "Save trade URL"; a short "Where to find it" ordered list (Steam → Inventory → Trade Offers → Who can send me trade offers? → Trade URL) with the external link; a status tag "Ready" / "Missing". No sentence about anyone else sending offers.
- **My purchases (`/my-purchases` or `/account/orders`):** H1 "My purchases". A ruled list (not cards): each purchase is a block with a compact row (stage, name, exterior, rarity tag, price paid in Martian, date in Martian muted, order ID) and the timeline (§7.25) in its compact form beneath; in-flight purchases first, then by date. Polls while any is in flight. Empty: "No purchases yet" + Indicator "Browse all skins". Signed out: "Sign in to see your purchases" + Account button.
- **Purchase detail:** H1 "Purchase {short ID}" with a status tag; the timeline large; the item as a feature row with stage; paid amount and currency; the trade URL used (masked); "Open trade offer" when sent; "Need help with this purchase?" linking to contact with the ID prefilled.
- **Saved:** tray grid 3-up (2-up mobile). Out-of-stock saved items use the tray's out-of-stock state.
- **Profile:** two groups (Personal details, Password) as accordion rows with their own Save buttons and success toasts. Addresses are kept only if checkout still needs a billing address; otherwise remove the page and its nav row.

### 13.12 How delivery works (`/how-it-works`) — landing surface
1. Hero: H1 Sofia step-6 "How delivery works" with M9 calibration ruler drawn beside it (decorative here: the lit band moves to FT at the end); lead: "You pay by card, we send the skin to your Steam account as a trade offer, you accept it in Steam."
2. The timeline in large form with five steps, each a section with an H2 in Sofia step-3 and 2–3 sentences: Sign in through Steam · Add your trade URL · Pay by card · We send a trade offer · Accept it in Steam. Real timings only from config ("Most trade offers are sent within {configured time}" only if configured; otherwise no time claim).
3. "What your Steam account needs": a ruled list (Steam Guard and trade eligibility; inventory and trade offers allowed; trade URL from the same account).
4. "If something goes wrong": ruled rows for each branch (offer expired, delivery failed, trade reversed by Steam, refund timing from the Refunds policy).
5. "Steam's own rules": one honest paragraph that Steam may apply holds or trade protection to items and that these are Valve's rules.
6. Indicator "Browse all skins".
Reading blocks 68ch; no invented guarantees ("buyer protection", "verified sellers", "instant") anywhere.

### 13.13 About (`/about`)
1. Hero: H1 Sofia step-6 "A store for CS2 skins, nothing else" with a step-1 lead; on the right the calibration ruler (M9).
2. "What we sell": CS2 skins listed with their real attributes; we're a store, the price you see is the price you pay (after re-confirmation).
3. "How an order works": three ruled rows linking to How delivery works.
4. The credentials sheet (same component as the footer).
5. Indicator "Browse all skins".
No founder stories, no pull-quotes, no numbers that aren't data.

### 13.14 FAQ (`/faq`)
H1 "Questions". Desktop: left sticky group index (Ordering, Delivery & trade offers, Trade URL & Steam, Payment, Refunds, Account) with the amber bar on the active group; right: accordion groups with H2 in Sofia step-3. Answers match policies word for word on numbers. End: "Still need help?" + Outline "Contact us". FAQPage JSON-LD.

### 13.15 Contact (`/contact`)
Desktop: left (columns 1–5) H1 "Contact us", one line with real support hours and reply time from config, the credentials sheet stacked, "Have your order ID ready" with links to How delivery works and Refunds. Right (columns 7–12): form (name, email, order ID optional in Martian, subject select: Purchase, Delivery / trade offer, Refund, Account, Other; message; Indicator "Send message"). Success replaces the form. No map unless a real public address exists.

### 13.16 Policies (`/policies`, `/policies/*`, `/pages/[slug]`) — `PolicyLayout`
- Index: H1 "Policies"; a ruled list of all policies, each row: title in Sofia 600 step-2, one-line scope, "Last updated {date}" in Martian muted.
- Policy page: desktop left 240px sticky index (active with the amber bar) plus "On this page" from H2s; main column 68ch: H1 Sofia step-5, "Last updated" neutral tag, H2 in Sofia step-3 numbered "1.", "2.", body 17px at 1.7, ruled tables (the Cookie table includes localStorage keys: cart, theme, saved, currency, `patinaskins-consent`). Mobile: "Jump to policy" select + "On this page" accordion. The shipping policy becomes delivery-by-trade-offer wording (no carriers, no addresses). Print: header/footer hidden, black on white.

### 13.17 404 (`src/app/(store)/not-found.tsx`)
An empty stage (lamp on) above a calibrated ruler whose amber jaw points at 0.404 with the Martian readout "0.404 · out of range". H1 Sofia step-5 "Nothing under the lamp", one line ("This page doesn't exist or the skin is no longer listed."), the search field, the six weapon types as links, Text "Back to home". Real 404 status. (The jaw here reads the error code, not an item float.)

### 13.18 Error states
Inline form errors per §7.2. Page fetch errors use the Alert. A failed live price check shows the tray/skin "Checking price" state and then, if still failing, "Price unavailable right now" with Add disabled.

---

## 14. Imagery rules for Steam skin renders

1. Renders are Steam economy images: transparent PNGs of mixed aspect (rifles wide, knives diagonal, gloves square). Every render sits on a stage (`--color-stage`) with the lamp; never directly on the page.
2. Stage aspect is fixed: 4:3 for trays, cart and purchase rows (96×72, 160×120), bays use a taller 3:4 stage, the skin page 4:3, feature trays 16:10.
3. Fit with `object-contain`, centred, insets 9% left/right, 12% top, 16% bottom (room for the cast shadow). Never crop, never `object-cover`, never rotate (no tilted renders), never mirror.
4. No CSS filters, blend modes, tints, duotones or rarity washes on renders. Opacity is allowed only for transitions and the out-of-stock state. The lamp highlight is drawn on a separate layer (CSS pool or WebGL canvas), never by filtering the image.
5. Cast shadow: the ellipse from §5.5 under every render, identical for all shapes (no per-image detection).
6. Request the image size that matches the stage via `next/image` with correct `sizes` (trays ≈ 360px, skin page ≈ 1024px). Use the remote pattern for the Steam CDN as the reference project does, or our own storage if the lead mirrors images; never show supplier names, supplier watermarks or supplier URLs in the UI or alt text.
7. Alt text: the full market name ("StatTrak™ AK-47 | Redline (Field-Tested)").
8. No stock photography, no player models, no AI-generated scenes, no game screenshots, no weapon silhouettes as decoration. The stage, the lamp, the ruler, typography and the renders are the whole visual world.
9. The home hero, bays and the loadout preview pick renders by real data rules (§11.2, §13.1), never hand-picked files that may go out of stock.

---

## 15. Copy and content rules
- English UI (British spelling, existing currency formatting). Plain, specific, true.
- **Store model only.** We sell skins; customers buy them. Never "sell your skins", "payout", "withdraw", "withdrawal", "deposit", "balance", "marketplace", "escrow", "P2P", "list your item", "instant sell". The legal cancellation wording uses "right to cancel".
- **The supplier is invisible.** No SIH, sih.market, "Steam market price", "vs Steam", "cross-market pricing", supplier logos or supplier-related discounts. Prices are our prices.
- **Honest delivery wording.** "We send your skin as a Steam trade offer after your payment is confirmed. Accept the offer in Steam to receive it." No "instant", "within seconds", "guaranteed", "no trade hold", "buyer protection", "verified sellers" unless a configured policy states exactly that. Timings only from config.
- **Honest item wording.** No invented floats, pattern seeds, "low float", "clean", "rare pattern", "investment", "price will rise". The render disclaimer (§13.5) stays.
- **No pressure.** "2 available" is allowed when `count` is real; "Only 2 left!", timers, "trending", "hot", "best seller" are not (unless ranked by real order data and labelled as such).
- Status copy (from `status-labels.ts`, tightened):
  - Awaiting payment — "Waiting for your payment to be confirmed."
  - Payment confirmed — "Payment received. We're preparing your trade offer."
  - Processing — "We're preparing your trade offer."
  - Trade offer sent — "Your trade offer is in Steam. Accept it before it expires."
  - Delivered — "Delivered to your Steam inventory."
  - Failed — "Delivery didn't go through. Your refund is being processed."
  - Rolled back — "The trade was reversed in Steam. Your refund is being processed."
  - Refund pending — "Your refund is being processed."
  - Refunded — "Refunded to your card."
- Buttons are verbs: Add to cart, Checkout, Continue, Pay £84.00, Sign in through Steam, Save trade URL, Open trade offer, Search, Send message, Save choices.
- Section titles may use the bay voice lightly ("Under the lamp", "How wear works"); navigation and filters always use CS2's real names (Knives, Rifles, Field-Tested, Covert).
- No "elevate", "seamless", "effortless", "premium", "curated", "unleash", "level up", "drip", "GG".

---

## 16. Accessibility and quality floor
- WCAG 2.2 AA: contrast as in §3.2–3.3 in both themes; every control has a visible focus ring; touch targets ≥44px.
- Landmarks: `header`, `nav` (main, breadcrumb, footer, account), `main`, `footer`. One H1 per page, then H2/H3 in order.
- ARIA patterns: disclosure (filter groups, loadout board), tabs, combobox (search, collection/country if custom), dialog (cart, menus, preference centre, zoom), slider (exterior jaws, price), radiogroup (segmented controls), switch (cookies), live regions (cart, steps, purchase status, quantity clamp, trade URL validation).
- Rarity is never conveyed by colour alone: the tier name is always present in text (tag, filter row, readout, or the tray's accessible description `aria-describedby` "Covert, Field-Tested").
- Keyboard: everything reachable and operable; the inspection stage is focusable with documented keys; Esc closes every overlay and returns focus.
- `prefers-reduced-motion`: every scene shows its static state (§12.2); no pin, tilt, sweep or WebGL.
- Performance: LCP ≤ 2.5s on mid-tier 4G (hero LCP is the H1 text); CLS 0; INP ≤ 200ms; renders lazy below the fold; fonts latin + latin-ext only; one preloaded font file; WebGL never on catalog pages.
- Theme parity: every screen checked in Inspection Bay and Daylight Bay.
- SEO: unique titles and descriptions; Product, BreadcrumbList, FAQPage, Organization JSON-LD; OG image per §9.3.
- QC items that touch design: payment logos in the footer and at checkout; credentials in the footer; Valve disclaimer; "Cookie settings" link; registration multi-step with required fields and the T&C gate; digital-delivery consent checkbox at payment; no language switcher; no fake stock, ratings or claims.

---

## 17. Implementation order
1. Tokens: `variables.css` (dark in `:root`, Daylight in `[data-theme="light"]`), `@theme inline` additions (rarity, marks, rig, floor, rule, accent-ink, lamp, type scale, data utilities), `tailwind.config.ts` mirror, `ThemeScript` fallback, fonts and `fonts.css`, global base rules, `.contact-shadow` restyle, lamp and spine utilities, animations clean-up, `tokens.ts`.
2. Sweeps (§2.4).
3. Primitives: Button, Field, Select, Choice (checkbox/radio/switch/segmented), Plate→tags, Chip, Tabs, Accordion, Dialog, toasts, readout loader, EmptyState, Alert, Breadcrumbs, Pagination, QuantitySelector, PriceDisplay.
4. Skin primitives: rarity mapping helper, `StarMark`, float ruler (zone strip + calibrated + jaw), skin tray (standard, compact, feature), purchase timeline, Steam account block, trade URL field.
5. Header (rig, loadout board, mobile menu, search dialog), footer (floor), cookie banner and preference centre.
6. Pages: catalog → weapon type → weapon → skin → search → cart drawer and page → checkout → order confirmed → my purchases and detail → trade URL → auth → account rest → how delivery works, about, FAQ, contact, policies, 404 → home (static end states of M1–M4 first).
7. Logo, favicon, manifest, metadata, invoice fonts and colours.
8. Hand over to the motion engineer with the hooks from §12 in place.
9. `npm run build`; check every page at 390 / 768 / 1280 / 1536, in both themes and with reduced motion.

---

## 18. Slop self-audit — the result must pass every line

Visual
- [ ] Radii are only 0 (planes), 2px (controls) and 4px (trays); circles only for radio dots and timeline nodes; no pills; no clipped bevels remain anywhere.
- [ ] The only gradient is `--stage-lamp`, and it appears only on stages. No glow, glass, blur, blob, mesh, neon, gradient text or coloured shadow.
- [ ] Rarity colour appears only as spines and tier-name text; never as fills, washes, glows or tinted renders.
- [ ] Amber appears only on interactive things (buttons, focus, selection, jaws, cart count). Count the amber elements in any viewport: if more than four non-button ambers show, remove some.
- [ ] Not everything is a card: filters, header, footer, account nav, purchases, FAQ, policies, spec tables are typography + hairlines. Trays are the only boxed objects, plus dialogs, the cart summary and the cookie panel.
- [ ] Importance varies: feature trays on home, unequal bays, one hero skin; no grid of identical components where importance differs.
- [ ] Sofia Sans Condensed, Source Sans 3 and Martian Mono are the only families; no Gloock, Commissioner, Inter, Anton, Space Grotesk, Archivo, JetBrains Mono, Roboto or system-ui as identity; mono never sets sentences.
- [ ] Type scale tokens everywhere; no stray font sizes; uppercase only on Martian micro-labels, Sofia buttons and Sofia nav.
- [ ] Section spacing differs per section as specified.
- [ ] Icons are Lucide only, stroke 1.5, never in circles, never decorative; no weapon/crosshair icons; cart is `ShoppingCart`, save is `Bookmark`.
- [ ] Renders are uncropped, unrotated, unfiltered, always on a lit stage with the same cast shadow.

Content and honesty
- [ ] No invented floats, patterns, counts, ratings, testimonials, partner logos, scarcity or "best seller".
- [ ] No supplier mention or Steam price comparison anywhere, including alt text and metadata.
- [ ] No marketplace words (sell, payout, withdraw, deposit, escrow, marketplace).
- [ ] Delivery, refund and payment statements match the policies; VAT label follows `COMPANY.vatRegistered`; the digital-delivery consent wording matches the Terms.
- [ ] Footer has credentials from `COMPANY`, the trading-name line, the Valve disclaimer, coloured Visa/Mastercard/PCI DSS from `/payments/*.svg`, and "Cookie settings".
- [ ] No kitchenware leftovers (copy, categories, icons, metadata, "Brasmora", furniture names in UI).

Function and accessibility
- [ ] Both themes designed and verified; no `text-white` on amber.
- [ ] Focus rings visible on every control, including jaws and trays.
- [ ] Filters, sliders, segmented controls, tabs, dialogs, the inspection stage and the timeline follow their ARIA patterns and work by keyboard.
- [ ] Reduced motion shows complete static designs.
- [ ] Mobile is composed (hero search first, bays grid with Knives/Gloves on top, bottom filter sheet, sticky buy and checkout bars, right-hand menu sheet, accordion footer), not desktop stacked.
- [ ] Every home section has a distinct assortment; empty sections are omitted; the collection filter stays hidden until collection data exists.

Distinctness
- [ ] Side by side with Brasmora: dark rig vs chocolate cornice + utility line, trays with spines vs shelves and plates, 2px amber buttons vs bevelled chocolate, ruler-band floor footer vs brass plaque plinth, ShoppingCart vs Handbag, different home order and shapes, different faces.
- [ ] Nothing reads as Drop District (no concrete, Anton, orange-red, stickers, tape, ticker, index numerals, offset shadows), Blueprint Works (no drafting paper, blueprint blue, title blocks, stamps, registration marks, leader lines, mm grid, tinted wear-gauge zones), Chipwave (no porcelain + lime, pad grid), Aurora Signal (no gradient, glass, starfield) or Console Deck (no ice white, glass, tile rails).
- [ ] Could a stranger mistake this for a generic dark "gaming" template (neon, glow, angled sci-fi panels, purple gradients)? If yes, find the section and bring it back to the room, the lamp, the spine and the ruler.
