# WebGL + 3D Knowledge

### A field manual for building animated, scroll-driven, 3D-enhanced websites that take the breath away — and still load fast

> **Who this is for:** an AI coding agent (Claude Code, Cursor, Codex…) and the developer who steers it.
> **How to use it:** read §0 once. Before any motion/3D task, jump to the decision tree (§1), then the relevant cookbook section. Every recipe has: *what it communicates → how → numbers → pitfalls → source*. Cite the sources in §19 when you justify a choice.
> **Version:** October 2026 (Three.js r186, GSAP 3.15, Anime.js 4.x, Motion 12.x, Lenis 1.3, CSS scroll-driven animations + cross-document View Transitions in all major engines except Firefox MPA transitions).

---

## Table of contents

0. Operating rules for the agent
1. Decision tree — which tool for which job
2. Principles of breathtaking-but-usable motion
3. Library atlas (what, when, when not, size, API, gotchas)
4. Scroll architecture — one heartbeat
5. Parallax cookbook
6. Typography in motion
7. SVG & illustration cookbook (incl. SVG tag reference)
8. WebGL & shader cookbook
9. Three.js / R3F / WebGPU cookbook
10. Page & state transitions
11. Micro-interactions
12. Production recipes (12 proven patterns, with specs)
13. Performance budgets & techniques
14. Accessibility & reduced motion
15. Mobile choreography
16. QA protocol
17. Anti-patterns (the "AI slop" list)
18. Brief / prompt templates
19. Sources & references

---

## 0. Operating rules for the agent

1. **Read the existing codebase first.** Reuse its tokens, utilities, animation engine and conventions. Never add a second animation system next to an existing one. Never introduce a library the task does not need.
2. **One big idea per site.** "The best Three.js sites of 2026 commit to one hard idea and budget everything around it" (Utsubo). Pick one signature subject (a terrain, an object, a material, a particle field) and make everything else typography, layout and restrained motion.
3. **Motion must communicate.** Each animation answers one of: *what changed (state)*, *what matters (hierarchy)*, *what caused what (causality)*, *where am I (orientation/progress)*, *how deep is this (space)*. If an animation answers none, delete it.
4. **Poster first, live later.** Every WebGL scene ships with a static poster (preferably vector, generated from the same math) that paints instantly; the canvas crossfades in after its first rendered frame.
5. **One heartbeat.** One `requestAnimationFrame` loop (usually `gsap.ticker`) drives smooth scroll, ScrollTrigger, WebGL renders and custom tickers.
6. **Budgets are hard.** Meet the numbers in §13 or explain exactly what costs what.
7. **Reduced motion is a first-class design**, not an afterthought (§14).
8. **Verify visually.** Screenshot at fixed scroll positions and frozen shader times (§16) before declaring done.
9. **No comments in code** unless the codebase uses them; self-documenting names instead.
10. **Never fake content.** No invented stats, testimonials or logos. Outcomes reported by third parties are labelled as such.

---

## 1. Decision tree — which tool for which job

| Job | First choice | Alternatives | Avoid |
|---|---|---|---|
| Reveal text/blocks on enter | CSS `animation-timeline: view()` behind `@supports`, or GSAP ScrollTrigger `once` | Motion `inView`, Anime.js `onScroll` | Animating every element on the page |
| Scrubbed scroll choreography, pinning, horizontal galleries | **GSAP ScrollTrigger** | Anime.js v4 `onScroll` (sync modes), Motion `scroll()` | Hand-rolled scroll listeners |
| Smooth (inertial) scroll | **Lenis** driven from `gsap.ticker` | GSAP ScrollSmoother, Locomotive v5 (Lenis-based) | Smooth scroll on touch devices by default |
| React UI state animation, layout, exit | **Motion** (`motion/react`) | react-spring | GSAP for simple React mount/unmount |
| Lightweight vanilla tweens, SVG draw/morph, draggable, springs | **Anime.js v4** | Motion vanilla (`animate`, 2.3 KB mini) | Pulling GSAP into a tiny page |
| Text splitting | **GSAP SplitText** (free since 3.13: masks, `autoSplit`, aria) | Anime.js `splitText`, Splitting.js | Manually wrapping letters without aria |
| SVG line drawing | `pathLength="1"` + `stroke-dashoffset` (CSS) | GSAP DrawSVG, Anime `createDrawable` | Measuring with `getTotalLength` on hundreds of paths at load |
| SVG shape morph | **GSAP MorphSVG** | Anime `svg.morphTo`, flubber, Motion path interpolation | CSS `d:` transitions between incompatible paths |
| Motion along a path | GSAP MotionPathPlugin / CSS `offset-path` / SMIL `animateMotion` | Anime `createMotionPath` | JS-calculated positions per frame |
| Ambient looping illustration (diagrams, icons) | **SVG + SMIL/CSS**, paused off-screen | dotLottie (designer-made), Rive (stateful) | Lottie for spinners/checkmarks |
| Interactive stateful illustration from designers | **Rive** (state machines) | dotLottie state machines | Rebuilding AE animations by hand |
| Page transitions (MPA or Next.js) | **View Transitions API** (`@view-transition { navigation: auto; }` / `document.startViewTransition`) | Barba.js / Taxi.js / Swup + GSAP | Full-screen loaders on every route |
| Shared-element (FLIP) transitions | View Transitions with `view-transition-name` | GSAP Flip | Animating `width/height/top/left` |
| Fullscreen shader background / gradient | **Raw WebGL2 fullscreen triangle** (~2 KB) or OGL | three.js `ShaderMaterial` on a plane | Video when a 1 KB shader would do |
| 3D scene with models, lights, post | **Three.js r186** (`three/webgpu`, auto WebGL2 fallback, TSL) | Babylon.js, PlayCanvas | Writing a renderer yourself |
| 3D in React | **React Three Fiber v9 + drei** | r3f-scroll-rig for DOM-synced 3D | `setState` inside `useFrame` |
| WebGL images synced to DOM | r3f-scroll-rig / custom pixel-perfect camera (§8.9) | OGL planes | Separate layout logic in WebGL |
| 2D GPU effects, many sprites, particles in 2D | **PixiJS v8** (WebGPU + WebGL fallback) | OGL | Three.js for a pure 2D effect |
| Keyframed 3D camera choreography authored visually | **Theatre.js** | GSAP timelines over camera props | Magic numbers tuned blind |
| Visual 3D for designers, quick embed | Spline (export to code or viewer) | — | Spline runtime on perf-critical hero |
| Physics toys | Matter.js (2D), Rapier (3D, WASM) | cannon-es | Physics where a spring would do |
| Hand-drawn / sketchy look | Rough.js, SVG `feTurbulence` + `feDisplacementMap` | — | Bitmap scribbles |
| Contours, maps, data shapes | **d3-contour, d3-shape, d3-geo** | — | Hand-drawn data |

---

## 2. Principles of breathtaking-but-usable motion

### 2.1 What "juicy" actually means
- **Depth** — layers moving at different speeds (parallax), perspective, fog, focus.
- **Continuity** — elements transform into the next state instead of disappearing (FLIP, shared elements, morphs).
- **Physicality** — mass and damping (springs, inertia, lerp), velocity-aware reactions (skew/stretch from scroll speed).
- **Causality** — input visibly affects the world (cursor probes, ripples from clicks, scroll drives a camera).
- **Rhythm** — staggered sequences with deliberate rests; not everything at once.
- **Restraint** — one accent colour, one hero subject, a handful of signature interactions.

### 2.2 Motion tokens (define once, reuse everywhere)

| Token | Value | Use |
|---|---|---|
| `ease.out` | `cubic-bezier(.16,1,.3,1)` / GSAP `expo.out` | entrances, reveals |
| `ease.inOut` | `cubic-bezier(.76,0,.24,1)` / `power4.inOut` | page transitions, pins, large moves |
| `ease.std` | `cubic-bezier(.4,0,.2,1)` / `power2.out` | UI state |
| `ease.spring` | `elastic.out(1, .6)` / spring stiffness 300, damping 25 | magnetic release, playful micro |
| `dur.micro` | 120–200 ms | hover, focus, press |
| `dur.ui` | 300–450 ms | tabs, panels, toggles |
| `dur.reveal` | 800–1200 ms | text/image reveals |
| `dur.scene` | 1400–2600 ms | intros, scene changes |
| `stagger.chars` | 15–25 ms | short display words |
| `stagger.words` | 30–45 ms | headlines |
| `stagger.rows` | 60–90 ms | lists, cards |
| Lenis `lerp` | 0.08–0.12 | smooth scroll weight |
| `scrub` | `true` (parallax) / `0.5–0.8` (scenes) | ScrollTrigger smoothing |

### 2.3 Depth scale for parallax
| Layer | Speed (fraction of viewport over the element's travel) | Typical content |
|---|---|---|
| L0 | 0 | readable content, CTAs |
| L1 | ±0.06–0.12 | images inside frames |
| L2 | ±0.15–0.3 | decorative type, outline numerals, labels |
| L3 | camera / shader uniforms | 3D scene, backgrounds |
Never move body text more than ±0.12; never move a CTA at all while it is the primary action on screen.

### 2.4 Choreography rules
- **Lead with the content**, follow with decoration (headline → supporting copy → decorative layer).
- **Entrance from the direction of reading or travel** (up for scroll-in, from the side the user is moving toward in horizontal galleries).
- **Distance scales with size**: small elements travel 8–24 px, sections 40–80 px, never the whole viewport for text.
- **Fewer, longer, better** — a 1.1 s expo.out reveal of a headline beats ten 300 ms fades.
- **End states are designed states.** A paused or reduced-motion screenshot must look finished.

---

## 3. Library atlas

### 3.1 GSAP 3.15 (+ all plugins free since 3.13)
- **What:** industry-standard timeline engine. Plugins: ScrollTrigger, ScrollSmoother, SplitText (rewritten in 3.13, 50% smaller, masks, `autoSplit`, `onSplit`, aria), MorphSVG, DrawSVG, MotionPath, Flip, Observer, Draggable, Inertia, CustomEase, ScrambleText, Physics2D.
- **When:** scroll choreography, pinning, complex timelines, anything that must be frame-accurate across DOM, SVG, canvas and WebGL uniforms.
- **When not:** a single fade in a React component (use Motion or CSS).
- **Core patterns:**
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(ScrollTrigger, SplitText);

const ctx = gsap.context(() => {
  SplitText.create(".headline", {
    type: "words,lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.words, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.035,
        scrollTrigger: { trigger: self.elements[0], start: "top 85%", once: true } }),
  });

  gsap.to(".plate-art", { yPercent: -8, ease: "none",
    scrollTrigger: { trigger: ".plate", start: "top bottom", end: "bottom top", scrub: true } });
}, rootEl);

return () => ctx.revert();
```
- **Gotchas:** create inside `gsap.context` (or `useGSAP`) and revert on unmount; call `ScrollTrigger.refresh()` after fonts and images load; never animate the same property from two triggers; prefer `transform`/`opacity`; with Lenis, drive Lenis from `gsap.ticker` and set `gsap.ticker.lagSmoothing(0)`.
- **Uniform tweening:** `gsap.to(material.uniforms.uProgress, { value: 1, duration: 1.2, ease: "expo.out" })`.

### 3.2 Anime.js v4
- **What:** modular ESM rewrite (2025). Functions: `animate`, `createTimeline`, `createTimer`, `createAnimatable` (cheap high-frequency updates, e.g. cursor followers), `createDraggable`, `createSpring`, `onScroll`, `createScope` (responsive/component lifecycles, media queries), `stagger`, `svg.createDrawable`, `svg.morphTo`, `svg.createMotionPath`, `waapi.animate` (native WAAPI, tiny), `splitText`.
- **When:** lightweight vanilla sites, SVG-heavy illustrations, draggable toys, when GSAP is not already present.
- **Snippet:**
```js
import { animate, stagger, onScroll, svg, createScope } from "animejs";

createScope({ mediaQueries: { reduce: "(prefers-reduced-motion: reduce)" } }).add(({ matches }) => {
  if (matches.reduce) return;
  animate(svg.createDrawable(".route"), {
    draw: ["0 0", "0 1"],
    ease: "inOutQuad",
    duration: 1600,
    autoplay: onScroll({ target: ".map", enter: "bottom-=20% top", sync: true }),
  });
  animate(".tile", { y: [24, 0], opacity: [0, 1], delay: stagger(60), ease: "outExpo" });
});
```
- **Gotchas:** v3 → v4 is breaking (object `from/to` syntax, `ease` names like `outExpo`); scope your instances and `revert()` them on unmount.

### 3.3 Motion (formerly Framer Motion)
- **What:** React and vanilla animation. Vanilla `animate()` comes in **mini 2.3 KB** (WAAPI only) and **hybrid ~18 KB** (transforms, sequences, springs, SVG paths). `scroll()`, `inView()`, springs, `stagger`, layout animations (`layout`, `layoutId`), `AnimatePresence`.
- **When:** React component state, shared layout transitions, exit animations, gestures.
- **Snippet (React):**
```tsx
import { motion, useScroll, useTransform } from "motion/react";

const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
return <motion.img ref={ref} style={{ y }} />;
```
- **Gotchas:** don't mix Motion and GSAP on the same element; use `LazyMotion` + `domAnimation` to cut bundle.

### 3.4 Lenis 1.3 (smooth scroll)
- **Options:** `lerp` (0.1), `duration`, `easing`, `orientation`, `smoothWheel` (true), `syncTouch` (false — keep native touch), `autoRaf`, `anchors`, `allowNestedScroll`, `prevent(node)`.
- **Attributes:** `data-lenis-prevent`, `-wheel`, `-touch` (modals, code blocks, maps).
- **GSAP sync (canonical):**
```js
const lenis = new Lenis({ lerp: 0.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
- **Limitations:** no CSS scroll-snap (use `lenis/snap`), Safari caps at 60 fps, iframes break it, import `lenis/dist/lenis.css`.
- **Locomotive Scroll v5** is a thin layer on Lenis with `data-scroll-speed` parallax attributes — good for non-GSAP projects.

### 3.5 CSS scroll-driven animations (native)
- **Support:** Chrome/Edge 115+, Firefox 132+, Safari 18+ (~84% global, 2026). Compositor-thread for `transform`/`opacity`.
```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    .progress { transform-origin: 0 50%; animation: grow linear both; animation-timeline: scroll(root block); }
  }
}
@keyframes rise { from { opacity: 0; transform: translateY(24px); } }
@keyframes grow { from { transform: scaleX(0); } }
```
- **Use for:** progress bars, simple reveals, image parallax inside frames. **Don't use for:** multi-step choreography that needs callbacks, pins, or JS-driven uniforms.

### 3.6 View Transitions API
- **Same-document:** `document.startViewTransition(update)` — Chrome, Edge, Safari 18+, Firefox 144+.
- **Cross-document (MPA):** `@view-transition { navigation: auto; }` — Chrome 126+, Safari 18.2+, Firefox behind flag (2026).
- **Shared elements:** matching `view-transition-name` on both states; customise with `::view-transition-old(name)` / `::view-transition-new(name)`; choose per navigation via `pageswap` / `pagereveal` events and transition types.
- **Gotchas:** names must be unique on the page; snapshots are viewport-sized; respect reduced motion; same-origin only.

### 3.7 Web Animations API (WAAPI)
Native `element.animate(keyframes, options)`; runs on the compositor for transform/opacity; `ScrollTimeline`/`ViewTimeline` in JS. Use for tiny one-off effects with zero dependencies; Motion mini and `waapi.animate` from Anime.js wrap it.

### 3.8 Three.js r186
- **WebGPU by default:** `import { WebGPURenderer } from "three/webgpu"` — WebGPU in every major engine since Safari 26; automatic WebGL2 fallback.
- **TSL** (Three Shading Language) compiles to WGSL and GLSL; now also works on `WebGLRenderer` via compatibility layer. Use TSL for portable materials and compute.
- **Renamed:** `PostProcessing` → `RenderPipeline`, `Clock` → `Timer`; `PCFSoftShadowMap` → `PCFShadowMap` (retune bias); ES modules only.
- **Warm-up:** `await renderer.compileAsync(scene, camera)` behind the poster; `compileComputeAsync()` for compute.
- **Budgets:** see §13; tools: `renderer.info`, stats-gl, Spector.js, three.js Inspector (WebGPU).

### 3.9 React Three Fiber v9 + drei
- R3F v9 targets React 19. drei: `ScrollControls` + `useScroll`, `Html`, `View` (multiple views in one canvas), `PerformanceMonitor` (adaptive DPR/quality), `Preload`, `useGLTF.preload`, `MeshTransmissionMaterial`, `Float`, `Environment`, `Text`.
- **Rules:** mutate in `useFrame`, never `setState` there; `frameloop="demand"` for static scenes; reuse objects; use `delta`.
- **r3f-scroll-rig (14islands):** `GlobalCanvas` that persists across routes, `SmoothScrollbar`, `ScrollScene` / `ViewportScrollScene` that track DOM proxies via IntersectionObserver/ResizeObserver, `UseCanvas` tunnel — the standard way to sync WebGL meshes with DOM in React.

### 3.10 OGL
Minimal WebGL library (~8–10 KB core) with three-like API (Renderer, Camera, Program, Mesh, Plane, Texture). Ideal for DOM-synced image galleries and shader planes where three.js is overkill. Codrops has many OGL gallery tutorials.

### 3.11 PixiJS v8
2D GPU renderer with WebGPU and WebGL fallback; sprite batching (texture atlases, uniform blend modes), filters, mesh/rope; strict texture cleanup to avoid leaks. Choose it for 2D-heavy effects (thousands of sprites, displacement filters, liquid image transitions) instead of three.js.

### 3.12 Theatre.js
Visual keyframe editor for JS/three.js objects (camera paths, light intensities, uniform curves) with a studio UI in dev and a tiny runtime in prod; sequence can be bound to scroll progress. Use when choreography is tuned by eye.

### 3.13 Rive · Lottie · dotLottie · Spline
| Tool | Runtime | Strength | Use for |
|---|---|---|---|
| SVG + CSS/SMIL | 0 KB | full control, accessible, tiny | icons, diagrams, line art, UI micro |
| Lottie (lottie-web) | 60–100 KB gz | After Effects pipeline | marketing illustrations from AE |
| dotLottie | ~40 KB | compressed Lottie + state machines | interactive AE-made illustrations |
| Rive | ~50 KB (+WASM) | state machines, runtime inputs, tiny files | stateful mascots, interactive UI art |
| Spline | heavy viewer | designer-friendly 3D | prototypes, non-critical embeds |

### 3.14 Transition routers
Barba.js, Taxi.js, Swup — hijack navigation in MPAs to run GSAP transitions while keeping a persistent canvas. Prefer native View Transitions when they suffice.

### 3.15 Text & shape helpers
- **Splitting.js** — CSS-variable-based splits (`--char-index`, `--word-index`) for pure-CSS staggers.
- **d3-contour / d3-shape / d3-geo** — generate contour maps, curves, areas, map projections as SVG paths.
- **flubber** — robust interpolation between dissimilar SVG shapes.
- **Rough.js** — hand-drawn sketchy SVG/canvas.
- **simplex-noise / open-simplex** — deterministic noise in JS (match your GLSL noise for CPU-side readouts and vector posters).
- **lil-gui / Tweakpane** — live tuning panels (dev only).

---

## 4. Scroll architecture — one heartbeat

### 4.1 The loop
```
gsap.ticker (single rAF)
 ├─ lenis.raf(t)                → scroll position
 ├─ ScrollTrigger.update()      → DOM/SVG tweens, pins, scrubs
 ├─ scene.render(state)         → WebGL (only when visible or settling)
 └─ custom tickers              → cursor, HUD, physics
```
- **Shared normalized state** (Trionn pattern): keep `state.scroll` (0–1 per narrative section), `state.hover`, `state.intro`, `state.burst`; combine with `Math.max` so any input drives the same scalar (`explode = max(scroll, hover, intro, burst)`). Transitions stay continuous whatever the user does.
- **Render on demand:** a scene subscribes to the ticker only while it is in range or still settling, then unsubscribes.
- **CustomEvent handoffs** between components (`site:hero-revealed`, `site:booked`) instead of imports between components.
- **Idle work:** preload sequences/textures in `requestIdleCallback` batches; `await img.decode()` before showing; set `will-change` only during an animation and remove it after.
- **Refresh discipline:** `ScrollTrigger.refresh()` after `document.fonts.ready`, image loads that change layout, and lens/theme switches that change heights.

### 4.2 Data-attribute motion engine (scales to big sites)
Declare intent in markup, implement once:
```html
<h2 data-anim="words">Selected work</h2>
<figure><img data-zoom src="…"></figure>
<span data-speed="0.2">2023</span>
<div data-out="0.5">hero copy</div>
<svg data-draw>…<path data-stroke …/>…<g data-label>…</g></svg>
<span data-count="85">0</span>
<p data-scrub="words">…</p>
```
One client component scans these on route change, creates triggers inside one `gsap.context`, yields to the main thread between groups (`await new Promise(r => setTimeout(r))`) to keep TBT low, and reverts on unmount. Words are split on the server into `<span class="w"><span>word</span></span>` with an `aria-label` on the parent.

### 4.3 DOM ↔ WebGL synchronisation
- **Canvas placement trade-off (Joyco):**
  - *Fixed canvas + JS scroll (Lenis)* → zero drift between DOM and WebGL; scrolling runs on the main thread.
  - *Absolute canvas in page space* → native compositor scroll; the canvas transform lags one frame, so render it **25–50% larger** than the viewport to hide edge clipping. Viewport-fixed WebGL HUDs will drift.
- **Pixel-perfect camera:** `fov = 2 * atan((viewportHeight / 2) / distance) * 180 / PI` → 1 world unit = 1 CSS px at `z = 0`.
- **Plane placement from the DOM:**
  `x = rect.left − vw/2 + rect.width/2`, `y = −rect.top + vh/2 − rect.height/2`, `scale = (rect.width, rect.height)`.
- **DOM stays authoritative and is the fallback** — the `<img>` remains in markup with `opacity: 0` only after WebGL is confirmed working.
- Batch all `getBoundingClientRect()` reads, then all writes; skip off-screen elements.

### 4.4 Native-first ladder
1. CSS scroll-driven animation (`view()`, `scroll()`).
2. IntersectionObserver + CSS transitions (class toggles).
3. GSAP ScrollTrigger / Anime `onScroll` / Motion `scroll()`.
4. WebGL uniforms driven by the same scroll state.
Go down the ladder only when the effect needs it.

---

## 5. Parallax cookbook

### 5.1 Image parallax inside a frame (the workhorse)
*Communicates depth without moving layout.*
- Frame: `overflow: hidden`; image 115–125% of frame size (or `scale: 1.18`).
- Translate image ±6–10% by the frame's normalized viewport position (−1..1), scrub `true`.
- GSAP: `gsap.fromTo(img, { yPercent: -6, scale: 1.18 }, { yPercent: 6, scale: 1.02, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } })`.
- CSS: `animation-timeline: view(); animation-range: cover;` with `@keyframes { from { transform: translateY(-6%) scale(1.18) } to { transform: translateY(6%) scale(1.02) } }`.
- WebGL equivalent: scale UVs by 0.85 around center and shift by `uParallax ∈ [−0.4, 0.4]` (Codrops horizontal parallax gallery).

### 5.2 Layered depth (decorative type behind content)
Outline numerals or years (`-webkit-text-stroke: 1px`) at L2 speed (`±0.15–0.3`) behind content at L0. Reads as space, costs nothing.

### 5.3 Hero exit ("data-out")
Hero copy translates up by `0.3–0.6 × vh` and fades to 0.15 opacity across the hero's own scroll range (`start: "top top", end: "bottom top"`), while the background (3D camera, image) moves slower or tilts. Gives a strong first scroll moment.

### 5.4 Pinned horizontal gallery
*Communicates "a series" and slows the user down on the best work.*
```js
const distance = () => track.scrollWidth - innerWidth;
const tween = gsap.to(track, { x: () => -distance(), ease: "none",
  scrollTrigger: { trigger: section, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.7,
    invalidateOnRefresh: true, snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, ease: "power2.inOut" } } });
gsap.fromTo(art, { xPercent: 4 }, { xPercent: -4, ease: "none",
  scrollTrigger: { trigger: plate, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
```
- Add a progress rail + `01 / 07` counter, active-plate emphasis (others dim to 0.55), velocity skew (`clamp(velocity * 0.0015, ±3deg)`) that settles in 400 ms.
- Mobile/touch/reduced motion: no pin — vertical stack with clip-path reveals.

### 5.5 Sticky stacking cards / chapters
Each chapter `position: sticky; top: 0` inside a tall wrapper; the previous one scales to 0.92 and dims as the next slides over (`scrub: true`). Use for process steps, not for everything.

### 5.6 Pinned scrubbed statement
A 200–250 vh section with a sticky 100 vh inner; words of a statement scrub from muted to full colour (`color` from ink-3 to ink, accent words to accent — keeps contrast valid at every frame); annotations appear at 25/47/69% of the pin with leader lines.

### 5.7 Mouse parallax (desktop only)
Layers translate by `(pointer − center) × depth`, lerped at 0.08–0.12 per frame on the shared ticker. Depth 4–20 px. Disable on `pointer: coarse` and reduced motion.

### 5.8 Velocity-aware effects
Read `ScrollTrigger`'s `self.getVelocity()` or Lenis `velocity`; map to skew, stretch (`scaleY 1 + v*0.0004`), shader distortion (`uVelocity`), or blur; clamp and decay back with `quickTo` (`gsap.quickTo(el, "skewY", { duration: 0.4, ease: "power3" })`).

### 5.9 Zoom-through / scale reveal
A full-bleed image starts as a small framed card and scales to fill the viewport across a pin (`clip-path: inset()` animation is cheaper than width/height). Great for a case-study opener.

---

## 6. Typography in motion

- **Masked line/word rise:** split into lines/words with mask wrappers; `yPercent: 110 → 0`, `expo.out`, 1.0–1.2 s, stagger 30–45 ms. The signature move of editorial sites.
- **Scrub colour reveal:** statement copy changes colour word by word with scroll.
- **Character scramble:** GSAP ScrambleText for codes/labels (`chars: "0123456789"`), ≤ 800 ms, only on mono labels.
- **Rolling digits:** each digit a column of 0–9 translated by `yPercent`; for counters, clocks, years.
- **Count-up:** `data-count` tween once on enter (≤ 1.6 s `expo.out`); never loop.
- **Variable font axes:** animate `font-variation-settings` (`wdth`, `wght`) on hover or scroll for condensed/expanded display type — subtle (±10 units).
- **Text along a path:** SVG `<textPath>` with `startOffset` animated.
- **Marquee:** only for genuinely list-like content (clients, tags), pause on hover, respect reduced motion; never as decoration.
- **Accessibility:** split text keeps the full string in `aria-label` on the parent and `aria-hidden` on fragments (SplitText 3.13 does this).

---

## 7. SVG & illustration cookbook

### 7.1 SVG tag reference (what each is for)

| Tag | Purpose | Motion use |
|---|---|---|
| `<svg viewBox>` | coordinate system; `preserveAspectRatio="xMidYMid slice"` for cover | responsive scaling |
| `<g>` | group + shared transform/style | animate groups, not each child |
| `<path d>` | any shape: `M` move, `L` line, `H/V` h/v line, `C/S` cubic, `Q/T` quadratic, `A` arc, `Z` close | draw-on, morph, motion paths |
| `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>` | primitives | cheap nodes, dashes, pulses |
| `<text>`, `<tspan>`, `<textPath>` | live, selectable text | labels in diagrams, text on curves |
| `<defs>` | non-rendered definitions | gradients, patterns, filters, symbols |
| `<symbol>` + `<use href>` | reusable components (icons) | clone without duplicating nodes |
| `<pattern>` | tiled fills (dot grids, hatching) | blueprint backgrounds at 0 cost |
| `<linearGradient>`, `<radialGradient>`, `<stop>` | gradients | animate `offset`/`stop-color` sparingly |
| `<clipPath>` | hard-edged visibility mask | reveal/typing effects (animate a rect inside) |
| `<mask>` | soft (luminance/alpha) mask | feathered reveals, spotlight |
| `<marker>` | arrowheads at path ends | flow diagrams |
| `<filter>` + primitives | `feGaussianBlur`, `feTurbulence`, `feDisplacementMap`, `feColorMatrix`, `feMorphology`, `feComponentTransfer`, `feBlend`, `feComposite`, `feOffset`, `feDropShadow` | distortion, grain, gooey, glitch (expensive — small areas only) |
| `<foreignObject>` | HTML inside SVG | rich labels (careful with Safari) |
| `<animate>`, `<animateTransform>`, `<animateMotion>` + `<mpath>`, `<set>` | SMIL declarative animation | looping diagrams with zero JS |

**Attributes worth knowing:** `pathLength="1"` (normalised dash math), `vector-effect="non-scaling-stroke"` (constant stroke width when scaled), `stroke-dasharray/-dashoffset`, `stroke-linecap/linejoin`, `fill-rule`, `transform-origin` + `transform-box: fill-box` (CSS transforms on SVG), `role="img"` + `aria-label` (accessibility), `aria-hidden` for decoration.

### 7.2 Line drawing
```css
.route { stroke-dasharray: 1; stroke-dashoffset: 1; }         /* with pathLength="1" */
.is-in .route { transition: stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1); stroke-dashoffset: 0; }
```
Scrubbed version: GSAP `strokeDashoffset: 0` with `scrub`, or DrawSVG `drawSVG: "0% 100%"`, or Anime `svg.createDrawable` with `draw: ['0 0','0 1']`. Stagger paths by 30–40 ms; fade labels after lines.

### 7.3 Flowing wires (data flow)
`stroke-dasharray: 3 5` + `@keyframes { to { stroke-dashoffset: -16 } }` linear infinite — communicates direction of flow in architecture diagrams. Colour active wires with the accent, passive ones muted.

### 7.4 Packets moving along paths (SMIL, zero JS)
```svg
<path id="route" d="M40 220 H230 L330 220 C380 220 380 120 430 120 H560" fill="none" stroke="currentColor" stroke-dasharray="2 4"/>
<rect x="-4" y="-4" width="8" height="8" fill="var(--accent)" opacity="0">
  <animateMotion dur="3.6s" begin="0.9s" repeatCount="indefinite" rotate="0"><mpath href="#route"/></animateMotion>
  <animate attributeName="opacity" dur="3.6s" begin="0.9s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;.06;.92;1"/>
</rect>
```
Stagger `begin` to show throughput; route one packet differently (accent colour) to show the exception path (retry, dead-letter, reroute, refund). Use `keyPoints`/`keyTimes` with `calcMode="linear"` to make a token pause at a node.

### 7.5 Pausing SMIL correctly
`svg.pauseAnimations()` / `svg.unpauseAnimations()` via IntersectionObserver; under reduced motion `pauseAnimations()` + `setCurrentTime(t)` to a meaningful frame. SMIL runs on the main thread — never leave dozens running off-screen.

### 7.6 Morphing
GSAP MorphSVG (handles different point counts, `shapeIndex`), Anime `svg.morphTo(target, precision)`, flubber for arbitrary shapes. Morph only between shapes that share meaning (state A → state B), 500–900 ms `power2.inOut`.

### 7.7 Procedural illustration (generated at build time)
- **Contour/topographic maps:** sample a noise field on a grid, run **d3-contour** (marching squares) at N thresholds, emit paths; major contour every 5th level heavier. Optionally project through a perspective camera and do a coarse z-buffer to hide occluded lines — the result can be the exact vector twin of a WebGL scene (perfect poster, ~60 KB gz).
- **Radial noise blobs** ("peaks"): `r(θ) = r0 · (1 + 0.13 sin(3θ + s) + 0.06 sin(5θ + 2s))`, ellipse-squashed, N concentric rings → elevation maps where ring count encodes importance.
- **Seeded covers:** hash a slug → seed → deterministic composition (peaks, rings, labels). Every blog post gets a unique, on-brand cover with zero images.
- **Dot-grid / blueprint backgrounds:** `<pattern>` with a 1px circle every 16 px; scale with `vector-effect`.

### 7.8 Mechanism diagrams (the most persuasive illustration for technical work)
Draw the system you built, animated to show *how it behaves under the interesting condition*:
- a job queue where one job fails, goes to a dead-letter box and is retried with backoff;
- payment traffic routed across providers while one provider is marked frozen and traffic reroutes;
- an order state machine where a token goes `paid → provisioning → delivered`, and a second token times out into `refunded`;
- a calendar that rejects an overlapping booking (shake + conflict label) and accepts a valid one;
- an inventory grid where a scan line passes and items sold elsewhere get crossed out;
- a risk scorer splitting orders into instant delivery vs manual hold with an expiring timer.
Spec: 640×440 viewBox, corner ticks + "FIG. 0X" label, 9 faint contour lines behind, boxes 104×50 with mono labels, accent only on the moving/exceptional part, a one-line caption stating the guarantee ("A replay never credits twice"). Every diagram gets `role="img"` and a sentence-long `aria-label`.

### 7.9 SVG filters (use sparingly)
- **Grain:** `feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"` as a data-URI background at 5–8% opacity — static, never animated.
- **Wobble / hand-drawn:** animate `baseFrequency` or `seed` of `feTurbulence` feeding `feDisplacementMap scale="3–6"` at 8–12 fps (stepped).
- **Gooey:** `feGaussianBlur stdDeviation="8"` + `feColorMatrix` alpha threshold — for blobs that merge (rarely appropriate).
- Filters are CPU/GPU heavy on large areas; restrict to small elements or bake into images.

---

## 8. WebGL & shader cookbook

### 8.1 Scaffold (non-negotiable)
- Uniforms: `u_time` (single clock), `u_resolution`, `u_mouse` (damped), `u_progress` (0..1 from scroll), plus effect-specific scalars (`u_reveal`, `u_ping`, `u_velocity`).
- Shader is a pure function of uniforms; randomness only via `hash(uv)` — reproducible frames.
- Pixel ratio `min(devicePixelRatio, 2)` desktop, ≤ 1.5 mobile; adaptive: if > 50% of frames exceed 24 ms over 90 frames, drop DPR ×0.75 down to 1; if still slow at DPR 1, stop the loop and keep the last frame.
- `?t=N` renders a single frozen frame at time N (deterministic screenshots/posters).
- Poster first (vector or image); canvas `opacity: 0` → 1 over 0.9 s after its first frame.
- Detect software renderers (`WEBGL_debug_renderer_info` → `/swiftshader|llvmpipe|software/i`) → keep the poster (also keeps Lighthouse honest).
- Handle `webglcontextlost` (`preventDefault`, stop loop, show poster).
- Pause on IntersectionObserver exit and `document.hidden`; dispose buffers, programs, VAOs, textures; `WEBGL_lose_context().loseContext()` on unmount.
- Defer boot to `requestIdleCallback` (timeout ~1.2 s) so it never competes with LCP.

### 8.2 Fullscreen effect (cheapest wow)
One triangle covering the screen (`gl_Position = vec4(pos, 0, 1)` with vertices `(-1,-1), (3,-1), (-1,3)`), fragment shader does everything. Typical cost: 1 draw call, < 1 ms on desktop for 4–5 fbm octaves at DPR 1.5.

### 8.3 Noise toolkit (GLSL ES 3.00)
```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; mat2 r=mat2(.8,.6,-.6,.8);
  for(int i=0;i<4;i++){ v+=a*noise(p); p=r*p*2.02; a*=.5; } return v; }
float warped(vec2 p, float t){ p += vec2(0., -t*.035); vec2 q=vec2(fbm(p), fbm(p+vec2(5.2,1.3))); return fbm(p+1.55*q); }
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){ return a + b*cos(6.28318*(c*t+d)); }
```
Port the same functions to JS when the CPU needs the value (readouts, vector posters).

### 8.4 Anti-aliased lines and shapes
```glsl
float isoLine(float v, float w){ float d = .5 - abs(fract(v) - .5); float fw = max(fwidth(v), 1e-4); return 1. - smoothstep(0., fw*w, d); }
float sdCircle(vec2 p, float r){ return length(p) - r; }
float fill(float d){ return smoothstep(fwidth(d), -fwidth(d), d); }
```
- Contour map: `lines = max(isoLine(h*levels, 1.1)*.62, isoLine(h*levels/5., 1.5))`.
- Compute height **per fragment** (not interpolated from vertices) on desktop for smooth contours; per vertex on mobile.

### 8.5 Reveals and transitions
- **Scan-line sweep:** `front = mix(nearZ, farZ, u_reveal); sweep = exp(-abs(z-front)*16.)` added as accent on lines; animate `u_reveal` 0→1 over 1.4–2.6 s `easeOutCubic`.
- **Noise dissolve:** `alpha = smoothstep(u_progress - .08, u_progress, fbm(uv*3.))` with a 1 px accent edge `edge = smoothstep(u_progress-.09, u_progress-.08, n) - alpha`.
- **Displacement crossfade:** sample two textures with offsets in opposite directions scaled by `progress` and `1-progress`.
- **Radial ripple from a click:** `ring = 1. - smoothstep(0., fw*1.4, abs(d - r))` with `r = fract(t*.35)*R` and fade `(1 - r/R)`; drive a separate `u_ping` for one-shot rings.
- **Row-hash glitch + RGB split:** shift rows by `hash(floor(uv.y*rows) + t)` and sample R/G/B at offsets — at most 150 ms bursts, never ambient.

### 8.6 Cursor "probe" on a 3D surface
- Ray from camera through the pointer (NDC → camera basis), intersect the plane `y = 0` analytically (`t = −eye.y / dir.y`) — no raycaster needed for terrain-like surfaces.
- Damp the hit point (`damp = 1 − exp(−dt*6)`), damp the influence amount separately (`× 3`), and raise the surface with a Gaussian bump `exp(−d²·k)`.
- Mirror the noise in JS to print a live readout (grid ref, elevation) next to the cursor — makes the 3D feel instrumented and real.
- Touch: autopilot the probe along a slow Lissajous path in the upper third of the screen.

### 8.7 Camera choreography from scroll
- Interpolate eye/target between two poses with `easeOutCubic(progress)` (e.g. low horizon → top-down plan); portrait screens get their own pose and FOV (`fovY = min(72°, 2·atan(tan(26°)/aspect))`).
- Keep exactly one subject in frame; use fog (`1 − smoothstep(near, far, dist)`) to hide the edges of the world.

### 8.8 Vector posters from the same math
Generate SVG posters at build time by evaluating the same noise in Node, tracing contours (d3-contour), projecting through the same camera, bucketing segments by fog alpha, and hiding occluded segments with a coarse z-buffer. Crossfade from SVG (t=0) to WebGL (t≈0) is seamless, sharp on any DPR, and ~50–110 KB raw / ~40–60 KB gzipped.

### 8.9 WebGL image planes synced to DOM
- Pixel camera (§4.3), one plane per `<img>`, `coverUv()`:
```glsl
vec2 coverUv(vec2 uv, vec2 plane, vec2 image){
  vec2 r = vec2(min((plane.x/plane.y)/(image.x/image.y), 1.), min((plane.y/plane.x)/(image.y/image.x), 1.));
  return uv * r + (1. - r) * .5;
}
```
- Effects: noise-threshold reveal on enter, velocity wave `uv.y += sin(uv.x*3.14)*uVelocity*.0006`, hover RGB shift, grayscale→colour radial reveal from the pointer (`smoothstep(p - .1, p, distance(uv, uMouse))`).
- Keep the DOM image as fallback; gate behind a performance check.

### 8.10 Particles
- ≤ 50k points: `gl.POINTS` with a vertex shader that offsets by curl noise of `(position, u_time)`.
- 100k–1M: GPGPU (ping-pong float textures) or WebGPU compute via TSL; selective bloom on bright particles only (threshold 0.8–1.0) at half resolution.
- Mobile: 10–25% of desktop count or a static poster.

### 8.11 Shader performance rules
`mediump` on mobile where precision allows (≈2× on Adreno); constant loop bounds; `mix/step/smoothstep` instead of branches; ≤ 5–6 fbm octaves; minimal texture reads, no dependent reads; dither (`(rnd(gl_FragCoord.xy) - .5)/255.`) to kill banding; clamp inputs of `pow`/`log`/`sqrt` (no NaN).

---

## 9. Three.js / R3F / WebGPU cookbook

- **Setup (r186):**
```js
import * as THREE from "three/webgpu";
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
await renderer.compileAsync(scene, camera);
renderer.setAnimationLoop(null);
gsap.ticker.add(() => visible && renderer.render(scene, camera));
```
- **Materials:** prefer `MeshStandardNodeMaterial`/`MeshPhysicalNodeMaterial` + TSL nodes; environment lighting (`scene.environment` from a small HDR/KTX2) instead of many lights; ≤ 3 lights.
- **Assets:** glTF with Draco/Meshopt (~95% geometry savings), KTX2 textures (ETC1S colour, UASTC normals; 4–8× less VRAM), ≤ 2048 px, `gltf-transform optimize`.
- **Instancing:** `InstancedMesh` / `BatchedMesh`; share materials; 16-bit indices < 65 536 vertices.
- **Shadows:** 512–1024 (mobile) / 1024–2048 (desktop); `shadow.autoUpdate = false` for static scenes; bake lightmaps when possible.
- **Post:** `RenderPipeline`; disable MSAA if using SMAA/FXAA; run post at half res; selective bloom only.
- **R3F:** `<Canvas dpr={[1, 2]} frameloop="demand">`, `PerformanceMonitor` to adapt DPR, `useGLTF.preload`, `<View>` to render multiple DOM-anchored scenes in one canvas, r3f-scroll-rig for DOM sync, `Html` for labels (use sparingly).
- **Debug:** `renderer.info` (calls, triangles, memory — growing counts = leak), stats-gl, Spector.js, three.js Inspector.

---

## 10. Page & state transitions

- **Default:** `@view-transition { navigation: auto; }` + a custom `::view-transition-old(root)`/`new(root)` animation (e.g. 600 ms scan line: a 1px accent bar sweeping top→bottom while the old page fades).
- **Shared element:** give the clicked card image and the destination hero the same `view-transition-name` (set at click time or in `pageswap`) → native morph.
- **Persistent canvas:** mount the WebGL canvas in the root layout; routes change its *targets* (camera pose, variant, uniforms) instead of recreating the context. Browsers cap WebGL contexts (~16); never create one per page.
- **FLIP for in-page changes:** GSAP Flip `Flip.getState(els)` → change DOM → `Flip.from(state, { duration: .42, ease: "power2.inOut", absolute: true })` — slot selection morphing into a confirm button, list filtering, grid ↔ table views.
- **Next-case handoff:** a full-width footer link whose accent progress line fills as the user scrolls past the end; at 100% navigate (cancelable by scrolling back).

---

## 11. Micro-interactions

| Interaction | Spec | Disable when |
|---|---|---|
| Magnetic button | translate toward pointer ≤ 8 px inside 120 px radius; release `elastic.out(1,.6)` | touch, reduced motion |
| Custom cursor | 6 px dot + hairline crosshair, lerp 0.18; on links expands to 44 px outlined square with a mono verb ("OPEN", "READ", "DRAG") | touch, form fields, reduced motion |
| Hover image reveal | grayscale/desaturated → colour 600–700 ms; tag slides up 8 px | — |
| Row hover in tables | background tint + arrow slides 6 px | — |
| Press feedback | `scale(.98)` 120 ms | — |
| Copy-to-clipboard | label swaps to "COPIED" 1.8 s, `aria-live="polite"` | — |
| Segmented controls | checked = ink background + bg text; **hover on the checked option must keep the checked colours** (`peer-checked:hover:text-bg`) | — |
| Hold-to-act | 600 ms hold → one-shot effect (shader ping), progress ring under the cursor | touch (use long-press) |

---

## 12. Production recipes (proven patterns, specs included)

> These are generic patterns distilled from shipped builds. Adapt the names, colours and content; keep the numbers as starting points.

**R1 — Topographic terrain hero ("survey" concept).**
Raw WebGL2, 250×250 grid over x∈[−4.2,4.2], z∈[−5.2,1.9]; vertex displacement `(h−.45)·0.9`; per-fragment contour lines (28 levels, major every 5th); fog 2.4→6.6; scan-line intro (`u_reveal` 2.6 s); cursor probe with Gaussian bump, radar ring every ~2.8 s and a live "GRID 0000·0000 · ELEV 318 m" readout; scroll tilts camera from horizon (eye `[0,.95,1.95]`, target `[0,−.2,−.9]`) to plan view (eye `[0,3.1,.2]`); portrait pose with FOV ≤ 72°; vector SVG poster generated from the same noise and camera; one draw call.

**R2 — Data-attribute motion engine** (see §4.2) with idle-deferred, chunked setup and route-scoped `gsap.context`. Keeps TBT < 200 ms on mobile while dozens of triggers exist.

**R3 — Pinned field-note statement.** 230 vh section, sticky inner, statement words scrub colour (muted → ink, three accent words → accent), three annotations ("↳ 01 …") fade/slide in at 25/47/69% of the pin.

**R4 — Horizontal "plates" gallery.** Each plate = 7/12 animated mechanism diagram + 5/12 text column (sector · year label, title, summary, two key results in a hairline grid, stack line, role/client, "Case →"); outline index numeral drifting ±30%; art drifting ±4%; progress rail `01 / 07`; mobile = vertical stack.

**R5 — Animated mechanism diagrams** (see §7.8): SMIL packets, accent exception path, paused off-screen via IntersectionObserver, still frame under reduced motion.

**R6 — Skills as an elevation map.** Radial-noise peaks whose ring count encodes how much of the week each skill takes; contours draw with scroll, peak labels fade in, legend "more contours = more of my week"; paired with a weighted spec grid (primary large, secondary medium, support compact).

**R7 — Outline-year timeline.** Each role row: huge outline year (`-webkit-text-stroke: 1px`) at parallax 0.18, period + "now" badge, role, bullets with hairline markers, stack in mono; a 1px accent rail draws down the list with `scaleY` scrub.

**R8 — Product/web builds mosaic.** Asymmetric 12-column grid (7/5, 4/4/4 offset, 5/7), square/portrait/landscape frames, images desaturated at rest → colour on hover, in-frame zoom parallax, index tag top-left, "Open case →" tag on hover; caption shows role + stack (recruiter lens) or headline result (client lens).

**R9 — Audience lens.** A two-option switch ("I'm here for: Hiring / Project") sets `html[data-lens]`, persisted and linkable via `?lens=client`; Tailwind custom variants (`@custom-variant client (:root[data-lens="client"] &)`) swap copy, CTAs, card metadata and the /work view (table vs visual) with zero JS re-render.

**R10 — Time-zone bridge.** Three cells (Me · Country / You · City / Difference) + a 24 h ruler in the visitor's time zone showing the owner's working hours as accent bars, the visitor's 9–18 as a dashed band, a "now" marker and an overlap sentence. Formatters cached per time zone (re-creating `Intl.DateTimeFormat` per call is a TBT killer).

**R11 — Interactive booking calendar.** 7-column month grid of the next 21 days (Monday-first, padded), each day shows a 3 px availability bar; slots grid shows visitor-local time with the owner's time in small mono beneath; choose topic (segmented), name, email, notes; success state with .ics download and Google Calendar link; server enforces slot rules and a unique index on start time; Telegram + email confirmation.

**R12 — Seeded blog covers + reading UI.** Deterministic contour covers per slug (no images), featured post with large cover, archive with topic filter, post header with cover parallax, 2 px reading-progress bar, sticky table of contents with active-section indicator, RSS.

---

## 13. Performance budgets & techniques

| Metric | Desktop | Mobile (Lighthouse 4× CPU) |
|---|---|---|
| LCP | ≤ 1.2 s | ≤ 2.5 s |
| TBT | ≤ 50 ms | ≤ 200 ms |
| CLS | ≤ 0.02 | ≤ 0.05 |
| INP | ≤ 200 ms | ≤ 200 ms |
| Motion JS (GSAP+ScrollTrigger+Lenis) | ~45 KB gz, loaded after first paint | same |
| WebGL draw calls | ≤ 20 per scene | ≤ 10 (≤ 100 absolute ceiling) |
| GPU frame | ≤ 8 ms (M1) | ≤ 16 ms (mid Android) |
| Textures | ≤ 2048 px, KTX2 | ≤ 1024 px |
| Hero poster | ≤ 60 KB gz (vector) | portrait variant |

**Techniques:** server components by default; pass heavy SVG/images into client components as slots; dynamic-import motion libraries inside `requestIdleCallback`; yield between ScrollTrigger batches; lazy-mount below-the-fold interactive widgets with IntersectionObserver (`rootMargin: 800px`); cache `Intl` formatters; `next/font` local fonts with `display: swap` for the primary face and `optional` for accent faces; AVIF/WebP with correct `sizes`; `fetchpriority="high"` only on the LCP asset; no infinite animations off-screen; text over WebGL is never the LCP blocker.

---

## 14. Accessibility & reduced motion

| Feature | Default | `prefers-reduced-motion: reduce` |
|---|---|---|
| Smooth scroll | Lenis | native |
| Parallax / scrub | on | off (final state) |
| Pins | on | normal flow |
| Text reveals | masked rise | instant |
| WebGL | live | one still frame or poster; updates only on pointer move |
| SMIL / Lottie / Rive | playing | paused on a meaningful frame |
| Page transitions | animated | instant |
| Cursor, magnetic | on | off |

Also: WCAG AA contrast at **every** animation frame (scrub colours from a readable muted tone, not from opacity 0.1); canvases `aria-hidden`; diagrams `role="img"` + `aria-label`; keyboard path through galleries (pinned galleries still reachable via Tab — links inside plates); visible focus (`outline: 1.5px solid accent; outline-offset: 3px`); `aria-live` for async status; never trap scroll.

---

## 15. Mobile choreography

- Design the mobile composition separately: shorter pins (≤ 120 vh) or none, no horizontal pin, parallax ×0.5, vertical stacks with clip-path reveals.
- WebGL: per-vertex height, DPR ≤ 1.5, portrait camera pose, autopilot probe, readout in a corner; slow device → poster only.
- Native touch scroll (Lenis `syncTouch: false`).
- Tap feedback replaces hover; bottom navigation in the thumb zone; primary CTA always reachable.
- Test on a real iPhone (Safari) and a mid-range Android; 60 fps cap on Safari is expected.

---

## 16. QA protocol

1. `next build` passes; no TypeScript errors; console clean (no shader warnings, no 404s).
2. Playwright screenshots at fixed scroll stops (0, 0.5 vh, 1 vh, each section start/middle) on 1440×900 and 390×844; compare before/after.
3. Freeze-frame: `?t=0`, `?t=1.5`, `?t=3` produce identical pixels across runs.
4. Lighthouse desktop + mobile; record LCP/TBT/CLS; inspect long tasks and the LCP element.
5. Performance panel: exactly one rAF while scrolling; GL contexts count stays 1 across navigations.
6. Reduced-motion run (`page.emulateMedia({ reducedMotion: "reduce" })`): every section readable and finished.
7. Keyboard-only run; screen-reader smoke test of split headings and diagrams.
8. Time-zone run for any time-aware UI (e.g. `America/Los_Angeles`, `Europe/Berlin`).
9. Real devices.

---

## 17. Anti-patterns (the "AI slop" list)

- Purple/blue gradients, gradient text, glowing blobs, mesh gradients, glassmorphism.
- Giant centred hero → 3 feature cards → testimonials → CTA template.
- Everything in rounded cards; pills everywhere; icon-in-circle grids.
- Fade-up on every element; infinite floating animations; parallax on body text.
- Multiple competing 3D effects; particles "because 3D"; a different shader per section.
- Separate rAF loops for scroll, WebGL and cursor.
- A WebGL context per page or per image.
- Canvas without poster (blank hero, then pop-in); loaders on every navigation.
- Lottie for a spinner; GSAP for a hover colour; three.js for a 2D gradient.
- Fake stats, fake logos, fake testimonials; marketing filler ("seamless", "cutting-edge").
- Animations that break when paused, screenshotted or reduced.

---

## 18. Brief / prompt templates

### 18.1 Section brief (fill for each section)
```
Section: <name>
Communicates: <state | hierarchy | causality | orientation | depth>
Signature move: <one sentence>
Layers: L0 <…> | L1 <…> | L2 <…> | L3 <…>
Trigger: <enter | scrub | pin <vh> | hover | click | time>
Timings: <duration, ease, stagger, distances>
Mobile: <how it changes>
Reduced motion: <final state>
Budget: <JS KB, draw calls, ms>
Acceptance: <screenshot stops, metrics>
```

### 18.2 WebGL scene brief
```
Subject: <one object/field>
Motion driver: <time | scroll progress 0..1 | cursor with damping>
Interaction: <probe/raycast/ping/drag>
Exact copy over the scene: "<headline>"
Uniforms: u_time, u_resolution, u_mouse, u_progress, <…>
Technique words: <fbm | domain warp | contour isolines | noise dissolve | GPGPU curl particles | selective bloom>
Constraints: single pass, ≤ N draw calls, DPR ≤ 2 (mobile 1.5), mediump on mobile, poster first, ?t=N freeze, dispose, reduced motion → still frame
```

### 18.3 Self-critique (run before "done")
- Could any section be mistaken for a template? What did you change?
- Does every animation communicate one thing? Which ones did you delete?
- Is the hero subject still the single big idea?
- Is text readable at every frame (contrast measured)?
- Do budgets hold on mobile? If not, what exactly costs what?

---

## 19. Sources & references

**Animation libraries & APIs**
- GSAP 3.13 release (free plugins, SplitText rewrite): https://gsap.com/blog/3-13/
- GSAP npm: https://www.npmjs.com/package/gsap
- CSS-Tricks — GSAP is now completely free: https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- Codrops — From SplitText to MorphSVG: 5 demos with free GSAP plugins: https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/
- Anime.js v4 release notes: https://github.com/juliangarnier/anime/releases/tag/v4.0.0
- Anime.js v3 → v4 migration: https://github.com/juliangarnier/anime/wiki/Migrating-from-v3-to-v4
- Anime.js docs: https://animejs.com/
- Motion `animate()`: https://motion.dev/docs/animate · Motion site: https://motion.dev/
- Motion SVG path morphing example: https://motion.dev/examples/js-svg-path-morphing
- LogRocket — best React animation libraries 2026: https://blog.logrocket.com/best-react-animation-libraries/
- Lenis: https://github.com/darkroomengineering/lenis
- Locomotive Scroll v5 limitations: https://scroll.locomotive.ca/docs/extras/limitations
- CSS scroll-driven animations guide 2026: https://cssawwwards.com/blog/css-scroll-driven-animations-guide-2026
- View Transitions 2026 (cross-document): https://trade-assistance.com/blog/cross-document-view-transitions-mpa-2026/
- CSS-Tricks — cross-document view transitions gotchas: https://css-tricks.com/cross-document-view-transitions-part-1/

**Scroll + WebGL architecture**
- Codrops — The Architecture Behind Trionn (GSAP, Three.js, Lenis, Web Audio): https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/
- Codrops — Smooth Horizontal Parallax Gallery: From DOM to WebGL: https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/
- Codrops — Scroll-Revealed WebGL Gallery (GSAP, Three.js, Astro, Barba): https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/
- Codrops — Sticky Grid Scroll: https://tympanus.net/codrops/2026/03/02/sticky-grid-scroll-building-a-scroll-driven-animated-grid/
- Codrops — Scroll-Driven SVG Map Animations with GSAP: https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/
- Codrops — Infinite scroll with GSAP & Lenis: https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/
- Codrops — Scroll-driven dual-wave text: https://tympanus.net/codrops/2026/01/15/building-a-scroll-driven-dual-wave-text-animation-with-gsap/
- Codrops — Animate WebGL shaders with GSAP (ripples, reveals, blur): https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/
- Codrops — Distortion and grain on scroll with shaders: https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/
- Codrops — WebGL rotating image gallery with OGL: https://tympanus.net/codrops/2024/12/03/how-to-create-a-webgl-rotating-image-gallery-using-ogl-and-glsl-shaders/
- Codrops — Dreamy particles with GPGPU: https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/
- Joyco — WebGL Scroll Sync: https://hub.joyco.studio/logs/08-webgl-scroll-sync
- Lusion WebGL-Scroll-Sync: https://deepwiki.com/lusionltd/WebGL-Scroll-Sync
- r3f-scroll-rig: https://github.com/14islands/r3f-scroll-rig

**Three.js, WebGPU, rendering**
- Utsubo — What changed in Three.js 2026: https://www.utsubo.com/blog/threejs-2026-what-changed
- Utsubo — 100 Three.js performance tips: https://www.utsubo.com/blog/threejs-best-practices-100-tips
- Utsubo — Migrate Three.js to WebGPU: https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- Utsubo — Best Three.js websites 2026: https://www.utsubo.com/blog/best-threejs-websites-2026
- Three.js WebGPURenderer manual: https://threejs.org/manual/en/webgpurenderer.html
- Three.js Roadmap — post-processing 2026: https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
- React Three Fiber: https://github.com/pmndrs/react-three-fiber · drei: https://drei.docs.pmnd.rs/
- OGL: https://github.com/oframe/ogl · WebGL/WebGPU libs list: https://gist.github.com/dmnsgn/76878ba6903cf15789b712464875cfdc
- PixiJS in production 2026: https://appscale.blog/en/blog/pixijs-high-performance-2d-web-graphics-2026

**SVG & illustration**
- SVG path animation (stroke & morph): https://www.svgai.org/blog/svg-path-animation-tutorial
- SVG paths with CSS and SMIL (2026): https://cssvg.com/blog/svg-path-animation
- Codrops — SVG filter effects: feTurbulence: https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/
- Codrops — Image distortion with SVG filters: https://tympanus.net/codrops/2019/03/12/image-distortion-effects-with-svg-filters/
- Simulating hand-drawn motion with SVG filters: https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters
- Animated icon libraries: Lottie vs dotLottie vs Rive vs SVG: https://www.carmenansio.com/articles/animated-icon-libraries/
- LottieFiles — best motion design tools 2026: https://lottiefiles.com/blog/design-guides-and-tips/best-motion-design-tools-ranked-by-use-case/

**Prompting AI agents for design (methodology)**
- GetLayers (cinematic prompt library): https://www.getlayers.ai/ · Lumora layer: https://www.getlayers.ai/layer/lumora
- Anthropic frontend-design skill: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Impeccable: https://impeccable.style/ · DESIGN.md catalog: https://getdesign.md/
- iart-ai WebGL animation skills: https://github.com/iart-ai/webgl-animation-skills
- CloudAI-X three.js skills: https://github.com/cloudai-x/threejs-skills
- dgreenheck WebGPU skill: https://github.com/dgreenheck/webgpu-claude-skill
- 0xjitsu claude-shaders (poster fallback presets): https://github.com/0xjitsu/claude-shaders
- aireiter — one prompt to a 3D website (6 tested): https://aireiter.com/blog/3d-website-prompts
