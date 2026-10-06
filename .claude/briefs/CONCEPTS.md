# Brasmora — Phase 1 Design Concepts

Store: brasmora.com — cookware, bakeware, utensils, tableware, glassware, food storage, coffee & tea accessories, table linen, bar tools. No electric appliances, no knives. Buyers in the UK and EU, prices in GBP / EUR / USD, English UI.

Reference being replaced: Solvetaworld "Forest & Stone" (Bricolage Grotesque + Karla, forest #2E5E4E, copper #A5561F, warm stone #F4F2ED, Phosphor icons with a Basket cart, 4–14px tight rectangles, bordered rounded-xl product cards, two-tier header with catalog trigger + search, carousel hero with deal cards, three-column footer).

Portfolio directions that are off-limits, and what they own (so nothing here repeats them):

| Direction | Owns |
|---|---|
| Forest & Stone (reference) | warm stone paper, forest green, copper, Bricolage/Karla, Phosphor Basket |
| Drop District | concrete grey, poster black, orange-red, cobalt, safety yellow, Anton, tape rules, ticker, index numerals, hard offset shadows |
| Blueprint Works | drafting paper, blueprint blue, title blocks, stamps, sheet numbers, mm grid, Space Grotesk, navy "Night Shift" |
| Chipwave | porcelain white + graphite + lime, Archivo, Swiss index numerals, pad grid |
| Aurora Signal | polar-night dark, emerald→teal→violet gradient, glass cards, starfield |
| Console Deck | ice white, glass surfaces, signal blue, tile rails |
| Avant Shop (bank-flagged sibling) | cool white/blue-grey, red #E53935 + purple #6C5CE7, pill buttons, soft shadows |

Consequences for Brasmora: no blue of any kind as an accent, no green, no lime, no safety yellow, no orange-red, no copper; no Inter, Karla, Bricolage, Space Grotesk, Anton, Archivo, JetBrains Mono; no tape dividers, stamps, title blocks, index-numeral section openers, tickers, glass panels or pills; no Phosphor.

---

## 0. Niche analysis

**Who buys.** UK/EU home cooks upgrading one piece at a time (a better frying pan, a proper roasting tin), people setting up a first home or a new kitchen, gift buyers (weddings, housewarmings, Christmas, Mother's Day), and hosts buying glassware, serveware and bar tools before an occasion. They compare specs more than they think they do: diameter, capacity, hob compatibility, oven-safe temperature and dishwasher safety decide the purchase.

**What category leaders do well (keep).** Lakeland, ProCook, John Lewis, Divertimenti, Sous Chef (UK), WMF, Manufactum (DE), Hay and Ferm Living (tableware):
- shop by material and by hob type (induction is the single most used cookware filter in the UK);
- key dimensions on the card itself (Ø 24 cm, 2.6 L) and not only on the PDP;
- oven-safe temperature, dishwasher-safe and "what's in the box" near the price;
- sets vs single pieces as a clear switch;
- delivery cost, dispatch time and returns window beside the add-to-bag button;
- gift-led edits by price band rather than by vague mood;
- care instructions as a real tab, because cast iron, enamel and glass need different care.

**Clichés to avoid.** The DTC pastel pan look (soft rounded serif, pastel blobs, "your new favourite pan"); marble + eucalyptus + linen lifestyle stock; Japandi beige with terracotta and sage; farmhouse chalkboard and script fonts; Pinterest copper pans; chef-hat and whisk icons; black + gold "luxury"; red gingham bistro; copy like "Elevate your cooking" or "Kitchen essentials for modern living".

**Imagery reality.** Only white-background supplier packshots, no lifestyle photography. Each concept below therefore (a) gives packshots a designed stage that makes white backgrounds intentional and (b) builds its hero from type, drawn SVG and shader work rather than photos.

**Brand name.** "Brasmora" reads as *brasa* (embers, as in brasserie) + a soft Latin ending. All three concepts can carry it; Concept 1 leans into it the most.

---

## Concept 1 — "Late Supper"

### Statement
Brasmora is the table after dark: claret-black cloth, candle cream, the gilt rim of a plate catching the light. The store reads like a printed restaurant menu. Categories are courses, prices sit on dotted leaders, products arrive under a lifted cloche. Colour lives in the ground (claret) and in light (cream, gilt). Actions are a single wine-rosé tone, and gilt is used only for hairlines and for price drops. Everything else stays quiet, so packshots on cream platters are the brightest things on screen.

**Metaphor:** the restaurant menu and the cloche — courses, leaders, the reveal.

### Palette

Default theme is dark ("Candlelight"). The light theme ("Sunday Lunch") is a separate mood: midday, rosy-ivory cloth, claret ink.

| Token | Candlelight (dark, default) | Sunday Lunch (light) |
|---|---|---|
| bg (base) | #1A0E11 | #F6F0EE |
| bg-band (alternating) | #211217 | #EDE3E0 |
| surface | #28161C | #FFFCFA |
| inset | #12090B | #E6DAD6 |
| stage (packshot platter) | #FBF5EE | #FFFFFF |
| ink | #F2E6D8 | #2A0F17 |
| ink-muted | #C3AEA4 | #664A51 |
| ink-faint | #9C857E | #7D6167 |
| border (hairline) | #3E262D | #D9C7C3 |
| border-control | #7A5E64 | #9A8086 |
| accent (actions) | #EBA9A0 rosé | #7A1F33 claret |
| accent-hover | #F4C4BC | #5E1626 |
| on-accent | #1A0E11 | #FFF6EE |
| accent-tint | rgba(235,169,160,0.14) | #F3E1E1 |
| gilt (hairlines, rims) | #C9A45A | #B8913F (decorative only) |
| sale (price-drop text) | #E6BC6A | #8A5A12 |
| success / warning / danger | #9CCB9E / #E6BC6A / #F2948A | #2F6B3F / #8A5A12 / #A3262B |

### Measured contrast (WCAG 2.x relative luminance)

| Pair | Candlelight | Sunday Lunch |
|---|---|---|
| body ink / bg | 15.33 | 15.79 |
| body ink / surface | 13.98 | 17.43 |
| muted / bg | 8.89 | 6.99 |
| muted / surface | 8.11 | 7.72 |
| faint / bg | 5.44 | 4.93 |
| button text / accent | 9.61 (#1A0E11 on rosé) | 9.50 (#FFF6EE on claret) |
| button text / accent-hover | 12.08 | 12.15 |
| accent as link / bg | 9.61 | 8.99 |
| sale text / bg | 10.55 | 5.24 |
| sale text / surface | 9.63 | 5.79 |
| control border / field bg (1.4.11) | 3.24 | 3.54 |

All pairs pass AA. Everything except Sunday Lunch faint and sale passes AAA for body text.

### Type
- **Display:** Instrument Serif, regular + italic — `@fontsource/instrument-serif`. A condensed, light, high-contrast serif with a beautiful italic. It looks like a menu printed by a good restaurant, and it is the opposite of Bricolage's chunky grotesk in class, width and weight. Italic carries the voice ("for later", "reduced").
- **Body/UI:** Albert Sans, variable — `@fontsource-variable/albert-sans`. A calm Scandinavian geometric grotesk with open apertures. It reads well at 16px on dark, has tabular figures for prices and has none of Karla's quirky humanist shapes.
- **Mono:** none. Prices use Albert Sans `tnum` on dotted leaders, so the menu, not a terminal, is the data voice.
- **Scale:** ratio 1.414 (augmented fourth, theatrical). Steps 12 / 16 / 22.6 / 32 / 45 / 64 / 90, and the hero line uses clamp(4.5rem, 11vw, 11rem). Body 16/1.6, micro-labels Albert Sans 12px caps at +0.14em.

### Radius language
Arches and hairlines. Packshot stages, the featured frame and the cloche have **arch tops** (full semicircle top, 2px bottom corners). Every control (buttons, inputs, chips, drawers) uses **2px**. No other radius appears anywhere. There are no pills and no rounded cards.

### Icons
Lucide (`lucide-react`) at strokeWidth 1, thin enough to sit next to Instrument Serif. Cart glyph: `ShoppingBag`, labelled "Bag". Wishlist: `Heart`. Lucide v1 ships no brand logos, so social links are text ("Instagram") or small hand-drawn SVGs.

### Signature motifs
1. **Menu leaders.** Name …………… price. Used in the category index, the price-band edits, the cart drawer, the order summary and the account order history.
2. **The cloche arch.** The arch-top silhouette for media frames, and the literal lift-the-cloche reveal.
3. **Gilt rim.** A 1px gilt line drawn round a platter or under a heading. It is drawn in on hover or focus, and it is the "selected" state for filters and steps.

### Homepage (order and shape)
1. **Hero "Glass over type".** Full-bleed, 100svh, claret ground. The headline "Set the table / *for later*" is set enormous across two lines. A one-line offer sits under it ("Cookware, tableware, glassware and bar tools — delivered across the UK and EU"), with a rosé primary CTA "See the menu" and a text link "Glassware". A WebGL glass sits in front of the type.
2. **The Menu** (category index). A narrow centred column (max 46ch) with eight courses in roman numerals: I Glassware & bar, II Tableware, III Cookware, IV Bakeware, V Utensils, VI Storage, VII Coffee & tea, VIII Table linen. Each line is "name ……… 46 pieces", using real counts. On desktop, hovering a row floats a small arch packshot preview by the cursor. On mobile, tapping a row expands three packshots inline.
3. **Cloche set-piece** (pinned). Three successive lifts, each revealing one featured product on a platter with its name, material line and price.
4. **"Tonight's table"** (asymmetric editorial). Left 7 columns: one large arch-framed product. Right 5 columns: four compact menu rows with leader prices. Featured and compact items are treated differently on purpose.
5. **Candlelit shelf** (horizontal pinned scroll). Glassware and bar tools on platters. A pool of candle light moves along with scroll.
6. **"For the host"** (gift edit). Three menu columns by price band (Under £25 / £25–60 / Over £60). Rows only, no cards. The bands convert with the active currency.
7. **Daylight interval.** The page flips to the Sunday Lunch palette for one full-bleed band: a care-and-materials table (cast iron / enamel / stainless / stoneware / glass × oven-safe / induction / dishwasher), each cell linking to the matching filtered catalogue.
8. **Just in.** One tall arch product plus four compact ones.
9. **Supper notes** (newsletter). An italic heading, one underlined input, one 2px button. No icon and no incentive copy unless a real incentive exists.

Every section draws a distinct set of products (the existing "claimed" logic in `page.tsx` stays).

### Product card anatomy
- An arch-top stage, aspect 4:5, filled with `stage` cream. The packshot is `object-contain` at 12% inset with `mix-blend-mode: multiply`, so the white background melts into the cream platter in both themes (the stage, not the page, is the blend target).
- A heart (1px) sits at the bottom right inside the stage.
- Course label: Albert Sans 12px caps, muted (e.g. "III · Cookware").
- Name: Instrument Serif 22px, two lines max.
- Material/size line on a leader to the price: "Enamelled cast iron, Ø 24 cm ……… £64.00".
- Sale: the price in `sale` gilt with the old price struck in muted, plus the italic word *reduced*. No badge block.
- Add: a text button "Add to bag" with a gilt underline that draws in on hover. On touch it shows permanently as "Add". Out of stock shows "Sold out" in faint and the button is removed.

### Header
A single transparent tier over the hero that turns solid `bg` with a gilt hairline after 80px of scroll.
- Left: "Menu" text button, which opens a full-height left drawer with courses, currency, language and account.
- Centre: the italic wordmark *Brasmora*.
- Right: Lucide Search, Account and Bag with a count.
- Desktop ≥1200px: the course names also appear inline under the wordmark as small caps.
- Search opens as a full-width sheet with one huge italic input and suggestions as menu rows.
- There is no announcement bar. Delivery terms appear once, in the footer and on the PDP.

### Footer — "The bill"
- Top: an italic sign-off line and the newsletter input (if it is not on the page above).
- Four columns:
  - **Courses:** the categories.
  - **Service:** delivery, returns, warranty, payment, FAQ, contact.
  - **House rules:** terms, privacy, cookies, all policies.
  - **The house:** legal name, company number, VAT number, registered office, email, phone. It is set like the small print at the foot of a menu and filled from `COMPANY` placeholders.
- Bottom line: copyright on the left, and on the right the coloured Visa, Mastercard and PCI DSS logos on a cream 2px-radius strip, so their brand colours stay true on claret.

### Checkout and registration
- **Checkout:** a narrow centred column like a menu card. The progress line reads "I Details · II Delivery · III Payment" in small caps, and a gilt dot sits under the current step. Completed steps collapse to one italic summary line with an "Edit" link. On desktop the right column is "The bill": items on leaders, delivery, VAT and the total in Instrument Serif 45px. On mobile the bill is a sticky bottom summary that expands.
- **Registration:** four steps in the same course line.
- **Order confirmed:** the cloche lifts once more to reveal the order number.

### Other surfaces
- **Catalog:** filters in a left column styled "à la carte": checkbox rows with leader counts, a price range with a gilt track and claret/rosé thumb, and material, hob, diameter and capacity groups. The grid is 3-up with arch stages, plus one wide "course opener" row per category page with the category description in italic.
- **PDP:** an arch gallery on the left. On the right: name in display 45px, price, a "spec menu" with leaders (diameter, capacity, material, hob, oven-safe, dishwasher), quantity, and add-to-bag. Delivery and returns lines sit directly under the button.
- **Cart drawer:** the right-hand bill described above.
- **Account:** sidebar as a course list.
- **FAQ:** an accordion whose open item gets a gilt rule.
- **Policies:** "House rules", numbered §, 68ch column with a sticky contents list.

### Motion philosophy
Slow, theatrical light: 320–480ms with ease-in-out (0.65, 0, 0.35, 1). Things fade up like light coming on, and the gilt line draws in. Nothing bounces. With reduced motion, the hero glass becomes a static SVG outline over the type, the cloche section shows all three products uncovered, and the shelf becomes a normal horizontal scroller.

### Hero signature moment (for the motion specialist)
**"Glass over type."** A procedural lathe-geometry tumbler is rendered with transmission and refraction, sampling a render target that holds the headline. The cursor (or device tilt on mobile) slides the glass across the words, and the letters bend and magnify through it. A soft caustic ellipse moves on the cloth below. A candle point light from the left adds a slow, low-amplitude specular shimmer on the rim. On scroll the glass slides out left and becomes the first preview in The Menu.
- Depth layers: claret cloth (back), the headline (mid, refracted), the glass (front), the caustic (on the cloth plane).
- Fallback: a static poster of the same composition.

### Parallax and scroll set-pieces
1. **Cloche lift** (pinned, about 300vh). Three platters. Scroll lifts an arch-shaped cloche (an SVG silhouette with a gilt rim) and slides the product up 24px into a pool of light. Name and price arrive afterwards on leaders.
2. **Candlelit shelf.** Horizontal scroll. Platters move at 1.0×, their reflections on the cloth at 0.8×, and a radial light mask tracks scroll position, so each glass passes through the candle's pool.
3. **Tablecloth pull** (the daylight interval). A cream cloth with a slow-parallax damask SVG (0.6×) is pulled across the claret, turning the page to Sunday Lunch for one section and back again.

### Mobile composition
- Hero type stays huge and deliberately cropped at the right edge, and the glass follows device tilt with a permission-free fallback to a slow idle drift.
- The Menu takes the full width, and rows tap to expand three packshots.
- The cloche becomes three tap-to-lift platters with no pin.
- A bottom sticky bar shows "Bag · 2 · £84.00".
- Product grid: 2-up arch stages, with the name at 18px.

### Divergence audit vs reference
| Axis | Forest & Stone | Late Supper |
|---|---|---|
| Typefaces | Bricolage Grotesque + Karla | Instrument Serif (condensed serif) + Albert Sans (geometric) |
| Palette temperature | warm-light stone, cool forest accent | dark claret ground, rosé and gilt light accents |
| Icon set / cart | Phosphor, Basket | Lucide 1px, ShoppingBag "Bag" |
| Button geometry | 6px rect, filled forest | 2px rect, rosé fill or gilt-underlined text button |
| Card structure | bordered rounded-xl box, square white stage, basket button | no box; arch stage, leader price, text add |
| Header | 2 tiers: logo / catalog trigger / search / actions + nav tabs | 1 transparent tier: Menu / centred italic wordmark / icons |
| Homepage | carousel + deal cards, tabs, strips, brand strip, trust strip | glass hero, menu list, cloche, editorial split, shelf, price menus, daylight band |
| Footer | brand+company / Explore / Information, slim bar | Courses / Service / House rules / The house, logos on cream strip |
| Imagery | packshot inset on white square | packshot multiplied onto cream arch platter |
| Radius | 4–14px everywhere | arch tops + 2px only |

Siblings: no dark-gradient, glass or starfield (Aurora); no navy (Blueprint Night Shift); no blue, lime, yellow or poster type.

---

## Concept 2 — "Mise en Place"

### Statement
Brasmora as a professional prep bench: brushed stainless, everything in its place, every item labelled. The layout system is the real Gastronorm grid (GN 1/1, 1/2, 1/3, 1/6, 1/9), the modular container sizes every European kitchen uses. Importance is literally container size: the bestseller sits in a 1/1 well and the others in 1/3 and 1/6. Colour comes from one Dijon-mustard fill used only for actions and labels. The steel stays cool and the graphite ink stays sober. It is for people who read the spec before the story.

**Metaphor:** the chef's bench seen from above, with GN pans laid out and deli labels on everything.

### Palette
| Token | Day Service (light, default) | Night Service (dark) |
|---|---|---|
| bg (stainless) | #E8EBEA | #111415 |
| bg-band | #DCE0DF | #161A1B |
| surface (well floor) | #F6F7F7 | #1C2122 |
| inset | #D1D6D5 | #0B0D0E |
| stage (packshot) | #FFFFFF | #F4F5F4 |
| ink (graphite) | #15191A | #E5E9E8 |
| ink-muted | #454C4F | #A3ACAE |
| ink-faint | #5C6467 | #808A8C |
| border (well lip) | #BFC6C5 | #2B3335 |
| border-control | #737B7E | #6B7578 |
| accent (Dijon) | #D39B1A | #E3AD31 |
| accent-hover | #BC8812 | #EDBE52 |
| on-accent | #15191A | #111415 |
| accent-tint (label paper) | #F5E4B8 | rgba(227,173,49,0.16) |
| steel-grain (texture token) | repeating hairline, 3% ink | repeating hairline, 4% ink |
| success / warning / danger | #2F6B45 / #8A5E00 / #A3262B | #8FC7A1 / #E3AD31 / #F08F86 |

### Measured contrast
| Pair | Day Service | Night Service |
|---|---|---|
| body ink / bg | 14.76 | 15.12 |
| body ink / surface | 16.50 | 13.30 |
| muted / bg | 7.29 | 7.99 |
| muted / surface | 8.15 | 7.03 |
| faint / bg | 5.04 | 5.23 |
| button text / accent | 7.15 (graphite on Dijon) | 9.07 |
| button text / accent-hover | 5.62 | 10.65 |
| ink on label paper | 14.06 | — |
| graphite button (alt) | 16.50 | — |
| control border / field (1.4.11) | 4.02 | 3.44 |

Dijon against the light steel is only 2.07:1 as a shape, so every Dijon button carries a 1.5px graphite outline (14.76:1 boundary). Dijon is never used as text on light. Links are graphite with a 2px Dijon underline.

### Type
- **Display:** Zilla Slab 600/700 — `@fontsource/zilla-slab`. A sturdy contemporary slab with the punch of enamel kitchen signage and equipment nameplates. Slab serif is a class no sibling has used.
- **Body/UI:** Schibsted Grotesk, variable — `@fontsource-variable/schibsted-grotesk`. A newspaper grotesk built for dense information. It is tighter and more matter-of-fact than Karla, and good at 14–16px in filter panels.
- **Mono (label printer):** Martian Mono, variable — `@fontsource-variable/martian-mono`. Its wide, squarish shapes read like a thermal deli label. It is used only for labels, prices, SKUs, dimensions and step codes, never for sentences.
- **Scale:** ratio 1.25 (major third, clear but compact for a dense store). Steps 12.8 / 16 / 20 / 25 / 31.25 / 39 / 48.8 / 61, and the hero uses clamp(3rem, 6vw, 5.5rem). Mono labels are fixed at 11–12px with +0.04em tracking, uppercase.

### Radius language
Pressed steel. GN wells (product stages, featured blocks, the cart tray, the footer wells) use a **10px inner radius** with a 1px lip, like a real pan. Controls are **3px**. Deli labels are **0px**, cut paper. Three radii with three jobs; nothing else is rounded.

### Icons
Lucide at strokeWidth 2 with `strokeLinecap="square"` and `strokeLinejoin="miter"`, which gives a sharper, utilitarian glyph than the default Lucide look. Cart glyph: `ShoppingCart`, labelled "Cart" with the item count and subtotal in mono.

### Signature motifs
1. **GN modular grid.** Every product layout is composed of Gastronorm fractions and their real proportion (530 × 325 mm, 1.63:1).
2. **Deli label.** A printed label with field names (ITEM / SIZE / FROM) in Martian Mono, overlapping the top-left edge of a well. It is used for category tags, sale tags ("−20% · WAS £40.00"), step codes and the stock count.
3. **Steel grain.** A directional brushed texture as a named token. It appears only on the hero bench and the header strip, never behind reading text.

### Homepage
1. **Hero "The bench".** A full-bleed overhead bench. On the left, a GN 1/1 well holds the slab headline "Pans, tins, plates and pourers — / labelled, measured, ready" and two buttons: Dijon "Shop by station" and outline "Search 1,240 items". The count is live. On the right, a mosaic of 1/3 and 1/6 wells holds real packshots.
2. **Stations** (category index). A 4-column grid of 1/6 wells, one per category, each with a deli label ("COOKWARE · 214 ITEMS · FROM £12.00", with real values) and one packshot. It reads as a parts tray, not cards with captions.
3. **Mise assembly** (pinned set-piece). Products drop into an empty GN layout, one station at a time.
4. **Most ordered.** #1 in a 1/1 well with full specs, #2–#3 in 1/3 wells, #4–#9 in 1/6 wells. Ranking comes from real order counts.
5. **Spec bar.** One full-width band of mono toggles that link to filtered catalogues: Induction-ready (n), Oven-safe 250 °C+ (n), Dishwasher-safe (n), Sets (n), Under £20 (n). This is the UX workhorse.
6. **Pantry rail.** Food storage, coffee & tea: a horizontal scroller of 1/3 wells with parallax labels.
7. **Price drops.** A ruled two-column list: mono old/new prices, a Dijon label, a thumbnail.
8. **New on the bench.** A mixed GN grid.
9. **Newsletter.** A label-printer strip: one mono input and a Dijon button.

### Product card anatomy
- A GN 1/6 well: `surface` floor, 10px radius, 1px lip, padding 10px.
- Inside, a 1:1 white stage. The packshot is `object-contain` at 8% inset. On the light theme the stage is pure white, so the packshot needs no blending and its white field reads as the inside of the pan.
- A deli label overlaps the top-left edge: "POTS · Ø 24 CM".
- Name: Schibsted 15/600, two lines.
- Spec line in mono 12: "4.1 L · Induction · Oven 260 °C".
- Price: Martian Mono 18/600. Stock line in mono muted: "In stock · 14".
- A full-width 40px button with a 3px radius and graphite outline, reading "Add to cart" with a square-capped cart icon. Hover and focus fill it Dijon. Disabled is struck through.
- Sale: a Dijon deli label "−20% · WAS £40.00". The price stays graphite.

### Header — left station rail plus a slim top bar
- Desktop has a **persistent left rail**, 76px collapsed and 260px on hover or focus. It lists the stations as square-capped Lucide icons, each with a mono code (CK cookware, BK bakeware, UT utensils, TB tableware, GL glass, ST storage, CT coffee & tea, LN linen, BR bar). Expanded, it shows names and counts. It reads like the label strip on a shelving rack, a page silhouette no sibling has.
- **Top bar** (56px, steel-grain strip): the slab wordmark left, a wide search field (mono placeholder "Search by name, size or SKU") in the centre, and on the right currency / language / Account / Cart with "2 · £84.00" in mono.
- Mobile: a bottom tab bar (Stations, Search, Cart, Account) and a slim top bar with the wordmark only.

### Footer — "The bench"
A row of wells of different sizes on steel.
- A **1/2 well** holds company credentials as a printed label: LEGAL NAME / COMPANY NO. / VAT / REGISTERED OFFICE / EMAIL / PHONE in Martian Mono, values in Schibsted.
- A **1/4 well:** Help (delivery, returns, warranty, payment, FAQ, contact).
- A **1/4 well:** Policies (terms, privacy, cookies, all policies).
- Underneath, one long mono line lists every station.
- Bottom: coloured Visa, Mastercard and PCI DSS logos in a white well, copyright in mono.

### Checkout and registration
- **Checkout:** a three-segment bar at the top, each segment a GN 1/3 that fills Dijon when complete, labelled "01 CONTACT / 02 DELIVERY / 03 PAYMENT" in mono. One form panel at a time in a large well. Inputs are 44px with 3px radius and graphite labels above, and errors print as red-outlined labels. On the right, a sticky "tray" (a 1/3 well) with item rows in mono, delivery and VAT lines, and the total in Martian Mono 25px.
- **Registration:** a four-segment bar (1/4 each).
- **Order confirmed:** a printed label slides out with the order number.

### Other surfaces
- **Catalog:** no filter sidebar, because the rail is already on the left. Filters sit in a **horizontal spec bar** above the grid: mono toggles for material, hob, diameter, capacity, oven-safe, dishwasher, price and sets. "More filters" opens a right sheet. The grid is uniform 1/6 wells, 4-up desktop and 2-up mobile, with sort as a mono select.
- **PDP:** a 1/1 well gallery. On the right: name in slab 39px, a mono spec table with ruled rows, price, quantity, and add-to-cart. A delivery/returns label sits under the button, and care instructions are a tab.
- **Cart drawer:** slides up from the bottom as a wide GN tray on desktop and full-height on mobile.
- **Account:** sections as labelled wells.
- **FAQ:** questions as label rows that expand.
- **Policies:** a mono section index in the left column and 68ch Schibsted text.

### Motion philosophy
Mechanical and exact: 140–200ms, ease-out (0.2, 0, 0, 1). Movement is straight lines and lifts, never rotation or bounce. Products lift 2–4px into a contact shadow on hover, labels slide out of wells, and segments fill. With reduced motion, the bench is a static overhead render, the assembly shows its final state, and rails scroll natively.

### Hero signature moment
**"The overhead lamp."**
- The bench is a WebGL plane with an anisotropic brushed-steel shader. The cursor acts as a pass lamp: a streak highlight runs perpendicular to the grain and follows the pointer.
- The GN wells are inset geometry, and each packshot is a textured quad with a soft contact shadow. The quad nearest the cursor lifts 6px.
- On first scroll the camera tilts from 90° overhead to about 35°, so the wells gain depth and the first station label slides forward.
- Depth layers: steel (back), well floors, packshots, labels (front).
- Fallback: an overhead still with the same composition.

### Parallax and scroll set-pieces
1. **Mise assembly** (pinned, about 250vh). Empty wells sit on the bench. Scrolling drops products into place station by station (Cookware, then Bakeware, then Tableware), each item arriving from a different z-depth, and labels print in as each one lands.
2. **Steam table track.** Horizontal tracking along the bench. Labels move at 1.15×, packshots at 1.0× and the steel grain at 0.7×, so the bench feels long and physical.
3. **Label printer.** In New on the bench, each card's label feeds out downward, tied to scroll progress (clip-path reveal). It is cheap and readable.

### Mobile composition
- The hero becomes a 2-column GN mosaic under the headline, and the lamp follows touch or idles across.
- The station rail turns into the bottom tab bar plus a full-screen station sheet.
- Spec-bar toggles become a horizontal scroller.
- The assembly becomes a short vertical sequence.
- Product grid: 2-up 1/6 wells. The add button is a 40px square cart button beside the price.

### Divergence audit vs reference
| Axis | Forest & Stone | Mise en Place |
|---|---|---|
| Typefaces | Bricolage + Karla | Zilla Slab + Schibsted Grotesk + Martian Mono |
| Palette temperature | warm stone, cool green accent | cool steel, warm Dijon accent (inverted) |
| Icon set / cart | Phosphor Basket | Lucide 2px square-capped ShoppingCart |
| Button geometry | 6px filled forest | 3px, graphite outline, Dijon fill |
| Card structure | bordered rounded-xl, square stage | GN well with lip, overlapping deli label, spec line, full-width button |
| Header | top two tiers | left station rail + slim top bar |
| Homepage | carousel and promo stack | overhead bench, station tray, GN-ranked bestsellers, spec bar |
| Footer | 3 columns + slim bar | wells of different sizes, credentials as a printed label |
| Imagery | inset on white square | white pan interior inside a steel well |
| Radius | 4–14px everywhere | 10 wells / 3 controls / 0 labels |

Sibling risk: mono labels sit near Blueprint Works' data voice and Drop District's utilitarian energy. They are kept distinct by slab type, the GN layout system, steel instead of concrete or paper, no grid paper, no stamps, no tape, no condensed poster type and no offset shadows. Mustard (#D39B1A) is darker and browner than Drop District's safety yellow (#F5C518) and is used only for fills with graphite outlines.

---

## Concept 3 — "The Dresser"

### Statement
Brasmora as a painted kitchen dresser: open shelves of plates and glasses up top, drawers of utensils and linen in the middle, cupboards of pans below, mugs and jiggers on hooks. The page is a two-tone object in cool chalk and deep chocolate paint, with small brass label plates as the only ornament. Products stand on shelves with real contact shadows instead of floating in boxes, which makes white packshots look like objects in a room. There is no chromatic accent. Chocolate does the work, brass labels things, and the products bring the colour.

**Metaphor:** the dresser — shelves, drawers, cupboard doors, hooks, brass card-holder plates.

### Palette
| Token | Morning (light, default) | Lamplight (dark) |
|---|---|---|
| bg (chalk) | #F1F3F2 | #1D1613 |
| bg-band | #E5E8E6 | #241B17 |
| surface | #FAFBFA | #2B211C |
| inset (cubby back) | #DCE0DE | #15100E |
| stage (packshot) | #FFFFFF | #F4F1EC |
| ink (chocolate) | #2A1A15 | #F0EBE5 |
| ink-muted | #5B4C47 | #BDB0A7 |
| ink-faint | #72625D | #968880 |
| border | #D2D3CF | #3F322B |
| border-control | #8A7E79 | #7F6F66 |
| accent (paint, actions) | #3B2620 chocolate | #EDE7DF chalk |
| accent-hover | #22140F | #FFFFFF |
| on-accent | #F1F3F2 | #1D1613 |
| brass (label plates; sale) | #C9A04E fill, ink text | #D6B064 fill, dark text |
| shelf-edge | #3B2620 | #0F0B09 |
| contact-shadow (token) | rgba(42,26,21,0.18) ellipse | rgba(0,0,0,0.45) ellipse |
| success / warning / danger | #2F6B45 / #7A5A1E / #A3262B | #8FC7A1 / #D6B064 / #F08F86 |

### Measured contrast
| Pair | Morning | Lamplight |
|---|---|---|
| body ink / bg | 14.99 | 15.06 |
| body ink / surface | 16.10 | 13.25 |
| muted / bg | 7.33 | 8.44 |
| muted / surface | 7.88 | 7.43 |
| muted / band | 6.62 | — |
| faint / bg | 5.20 | 5.21 |
| button text / accent | 12.70 (chalk on chocolate) | 14.53 (chocolate on chalk) |
| button text / accent-hover | 16.04 | 17.85 |
| ink on brass plate | 6.86 | 8.72 |
| chalk on chocolate band (header/footer) | 12.70 | — |
| muted-on-dark (#C8BBB3) on chocolate band | 7.56 | — |
| control border / field (1.4.11) | 3.79 | 3.27 |

### Type
- **Display:** Gloock — `@fontsource/gloock`. A heavy, high-contrast display serif with sharp wedge serifs. It feels like a painted shop-fascia or a heritage crockery mark, with weight and warmth but no sweetness. It is the opposite of Bricolage in class and contrast, and unlike Instrument Serif it is black and upright.
- **Body/UI:** Commissioner, variable — `@fontsource-variable/commissioner`. A slightly flared humanist-grotesk hybrid, warm without being quirky. It holds up in small caps on brass plates and in long policy text.
- **Mono:** none. Brass plates use Commissioner caps at +0.12em, and prices are set in Gloock.
- **Scale:** ratio 1.333 (perfect fourth). Steps 12 / 16 / 21.3 / 28.4 / 37.9 / 50.5 / 67.3 / 89.8, and the hero wordmark uses clamp(4rem, 12vw, 12rem). Body 16/1.6.

### Radius language
Joinery: **0px** for everything structural (shelves, doors, drawers, stages, inputs). The signature geometry is the **chamfered corner** (a 6px clip-path bevel), used for buttons, brass label plates and the cart count. Plates and jugs bring their own curves. There are no rounded rectangles anywhere.

### Icons
Lucide at strokeWidth 1.5. On desktop the header actions are **words** ("Search · Account · Bag 2"), with no icons. Icons appear only on mobile and in compact controls. Cart glyph: `Handbag`.

### Signature motifs
1. **The shelf line.** A 2px chocolate edge with a contact-shadow ellipse under each product. Every product row in the store stands on one, including catalog rows, cart rows and order rows.
2. **The brass plate.** A chamfered label with category, count or "Reduced −20%". Used for category nav, sale, step names and footer credentials.
3. **Doors and drawers.** Disclosure is physical: the cart is a cupboard door, filters and checkout steps are drawers, and the mega menu is a drawer pulled out.

### Homepage
1. **Hero "The dresser".** A full-width front elevation of a dresser, drawn flat (planes and 1px chocolate lines, no wood texture and no skeuomorphic grain).
   - The cornice board carries the huge Gloock wordmark **Brasmora**.
   - Two open shelves hold real packshots: plates, jugs, glasses.
   - Below: two cupboard doors with brass plates ("Cookware", "Bakeware") and a row of drawers ("Utensils", "Linen").
   - A short line on the right side panel: "Cookware, tableware and glass for kitchens across the UK and EU", with a chamfered chocolate button "Open the cupboards".
2. **Drawer index** (categories). Nine drawer fronts stacked in a 3 × 3 chest, each with a brass plate (name and real count). On hover or focus the drawer slides out to show three packshots lying inside.
3. **Top shelf** (featured). One large product standing on a wide shelf beside four smaller ones on the same shelf. It is one shelf, not five cards.
4. **Plate rack** (horizontal pinned scroll). Tableware.
5. **Hooks.** Mugs, cups, jiggers and ladles hang from a rail.
6. **Reduced.** Full-bleed chocolate band with chalk text. Sale products stand on a chalk shelf, each with a brass "Reduced" plate.
7. **New on the shelf.** Two shelves of products.
8. **Care cupboard.** A two-column typographic guide (seasoning cast iron, caring for enamel, glass and the dishwasher) that links to the matching categories.
9. **Newsletter** as a brass-framed plaque: Gloock heading, one input, a chamfer button.

### Product card anatomy
- No box. A 1:1 white stage (a cubby) with 0px corners. The packshot is `object-contain`, bottom-aligned so the product sits on the floor of the cubby. On the light theme, `mix-blend-mode: multiply` removes stray off-white fringes.
- A 2px shelf line under the stage with a contact-shadow ellipse under the product.
- A brass plate under the shelf: "TABLEWARE".
- Name: Commissioner 16/500, two lines.
- Price: Gloock 21px. Sale: brass plate "Reduced −20%" and the old price struck in muted.
- Add: a full-width chamfered chocolate button "Add to bag" fades in on hover/focus. On touch it is a 40px chamfered Handbag button beside the price.
- Wishlist: the word "Save" at top right of the cubby on desktop, a Heart icon on mobile.
- In the catalog, a whole row shares one continuous shelf line, which is the grid's identity.

### Header
- **Tier 1:** a thin chalk utility line, right-aligned: delivery region, currency, language.
- **Tier 2:** the chocolate "cornice" band, 72px. The Gloock wordmark on the left in chalk. Brass category plates across the middle (desktop ≥1280px, otherwise "Shop" opens the drawer menu). Text actions on the right: "Search · Account · Bag 2".
- **Mega menu:** a wide drawer pulled down from the cornice, with columns of sub-categories and one packshot standing on a shelf.
- **Search:** opens as a drawer from the cornice with one Gloock-sized input.
- **Sticky:** collapses to a 56px chalk bar with a small wordmark and a 2px chocolate bottom edge (the shelf).

### Footer — "The plinth"
- A full-bleed chocolate base. Three drawer-front columns:
  - **Shop:** the categories.
  - **Help:** delivery, returns, warranty, payment, FAQ, contact.
  - **Small print:** terms, privacy, cookies, all policies.
- Across the full width beneath them, a large brass plate engraved with the company credentials: legal name in Gloock, then company number, VAT, registered office, email and phone in Commissioner caps.
- Bottom: the coloured Visa, Mastercard and PCI DSS logos on a chalk plaque with chamfered corners, and copyright.

### Checkout and registration
- **Checkout:** the steps are **drawers** stacked vertically: "Contact", "Delivery", "Payment". The active drawer is pulled open with the form inside. A completed drawer closes and its brass plate shows the summary ("Delivery — Royal Mail Tracked 48, London SW1"), with "Open" to edit. Inputs are 0px with a 1px control border and labels above. On the right, "The counter": items standing on shelf lines, the totals, and the total in Gloock 38px.
- **Registration:** four drawers.
- **Order confirmed:** the cupboard doors close with a brass plate showing the order number.

### Other surfaces
- **Catalog:** filters in a left "drawer index" (groups as drawers with brass tabs, and the open group shows its checkboxes). On mobile, filters slide out as a full-height drawer. The grid is shelves of 4 (desktop) or 2 (mobile). Sort is a text select in the shelf header.
- **PDP:** a large cubby gallery with thumbnails on a shelf below. On the right: Gloock name, price, a spec list as ruled rows, add-to-bag (chamfer), and delivery and returns plates.
- **Cart drawer:** a right panel that swings open like a cupboard door (rotateY with perspective) with items on shelf lines.
- **Account:** a drawer chest of sections.
- **FAQ:** drawer accordions.
- **Policies:** a drawer index on the left and a 68ch column.

### Motion philosophy
Tactile and weighted: 220–320ms with ease-out (0.22, 1, 0.36, 1) for slides, and a short critically damped spring only for things that hang (hooks) or swing (doors). Motion is always something physical opening, sliding or settling, which makes each animation self-explanatory. With reduced motion: doors and drawers are shown open, hooks hang still, and the plate rack is a native scroller.

### Hero signature moment
**"Open the cupboards."**
- The dresser is built as 4 to 5 DOM/SVG depth planes: back panel, shelf backs, products, shelf edges and frame, doors.
- Pointer movement gives up to 14px of differential parallax, so the dresser reads as a real object with depth.
- Hovering a cupboard door eases it 6° ajar with a sliver of light. Scrolling swings both doors open (rotateY to 105°, perspective 1400px) to reveal shelves of real cookware packshots. The view then pushes into the cupboard (scale 1 to 1.6) and hands over to the drawer index.
- Optional WebGL layer: the top-shelf plates get a real-time glaze sheen. A normal-mapped disc behind each plate packshot catches a highlight that follows the pointer.
- Fallback: the doors are shown open in a still.

### Parallax and scroll set-pieces
1. **Drawer pull.** As the drawer index enters, drawers pull out one after another (translateY + translateZ) and show their contents, then close as the section leaves.
2. **Plate rack** (pinned horizontal). Plates and bowls slot into a rack. Slats move at 1.0×, plates at 1.12×, shadows at 0.9×, so each plate seems to drop into its slot.
3. **Hooks.** Mugs and bar tools on S-hooks swing in proportion to scroll velocity (spring, max ±6°) and settle when scrolling stops. It is subtle and physical, and it reports scroll momentum.

### Mobile composition
- The hero becomes a portrait elevation: cornice wordmark, one open shelf, the two doors. Doors open on scroll, and pointer parallax becomes a gentle tilt response.
- The drawer index becomes a single column of full-width drawers that open on tap.
- The plate rack becomes a native horizontal scroller.
- Hooks are kept, with lower amplitude.
- A sticky bottom bar shows "Bag 2 · £84.00" with a chamfer.
- Header: the cornice shrinks to the wordmark plus Menu and Bag icons.

### Divergence audit vs reference
| Axis | Forest & Stone | The Dresser |
|---|---|---|
| Typefaces | Bricolage + Karla | Gloock (heavy wedge serif) + Commissioner |
| Palette temperature | warm stone + cool forest accent + copper | cool chalk + deep chocolate two-tone, brass labels, no chromatic accent |
| Icon set / cart | Phosphor Basket icon | words on desktop; Lucide Handbag on mobile |
| Button geometry | 6px rounded filled green | chamfered (bevelled) chocolate blocks |
| Card structure | bordered rounded-xl box | no box: cubby + shelf line + contact shadow + brass plate |
| Header | 2 tiers: logo/catalog/search/actions + tabs | utility line + chocolate cornice with brass plates, text actions |
| Homepage | carousel and promo stack | drawn dresser, drawer chest, single shelf, plate rack, hooks, chocolate band |
| Footer | 3 light columns | chocolate plinth, three drawer columns, brass credential plate |
| Imagery | inset in white square | standing on a shelf with a contact shadow |
| Radius | 4–14px | 0px + chamfers |

Siblings: no portfolio direction uses brown, serif display, chamfers or object-on-shelf staging. There is no blue, green, lime, yellow, orange-red, glass, gradient or grid.

---

## Shared notes for all concepts
- Admin stays untouched and only inherits tokens.
- Every homepage section keeps distinct products (the current claimed-set logic).
- Counts, ranks and price bands come from the database. There are no invented numbers, testimonials or partner logos.
- WebGL is limited to the hero (plus one optional layer). DPR is capped at 1.5, it pauses off-screen, nothing loads on save-data or low-memory devices, and every set-piece has a complete static state for `prefers-reduced-motion`.
- Footer always carries `COMPANY` credentials (placeholders until supplied) and the coloured Visa, Mastercard and PCI DSS SVGs already in `src/assets`.
- Phosphor (`@phosphor-icons/react`) is removed from the storefront in all three concepts in favour of `lucide-react`. Lucide v1 has no brand glyphs, so social links need text or custom SVGs.

## Recommendation

**The Dresser.**

1. **Furthest from every sibling.** It sits furthest from the reference and the whole portfolio on every audited axis. It is the only direction with no chromatic accent, a brown two-tone, a heavy wedge serif and chamfered geometry. The bank's look-alike check has nothing to match.
2. **The metaphor covers the whole catalogue.** Shelves hold tableware and glass, drawers hold utensils and linen, cupboards hold pans and bakeware, and hooks hold mugs and bar tools. It never feels stretched over a category.
3. **It solves the packshot problem best.** White-background products standing on shelves with contact shadows look like objects in a room, not cut-outs in boxes.
4. **Its parallax is real physical depth** (doors, drawers, racks, hooks), so the motion pass makes the store look richer without becoming gimmicky.

**Late Supper** is the most cinematic option, and its glass-refraction hero is the strongest single wow moment. The trade-off is that it is dark-first, which makes long catalogue browsing and policy reading heavier and puts many cream platters on claret.

**Mise en Place** has the best catalogue UX for spec-driven buyers. It sits closest to the portfolio's utilitarian siblings, so it would need the most discipline to stay clearly distinct.
