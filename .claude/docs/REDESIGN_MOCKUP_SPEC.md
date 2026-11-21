# Shift Hub redesign — shared mockup spec (all artboards)

Directory: /tmp/claude-0/-home-user-Shift-Hub/84808e41-89a0-5d58-b20f-c97a67eaf697/scratchpad/canvas/project/
Reference implementation of the approved direction: HubV2.dc.html (read it fully first).

## File format (strict — the canvas parser fails silently otherwise)
- Same skeleton as HubV2.dc.html: `<!doctype html>`, `<script src="./support.js"></script>` head line unchanged, `<x-dc>` with `<helmet>` (one Google Fonts css2 `<link>` loading only `Hanken+Grotesk:wght@400;500;600;700;800`, plus a `<style>`), one fixed 390×844 root div, then `<script type="text/x-dc" data-dc-script data-props='…'>` with `class Component extends DCLogic`.
- `{{path}}` holes are dotted lookups only — compute everything in renderVals(). Events: whole-value camelCase attrs (`onClick="{{x}}"`, `onPointerDown`, `onPointerMove`, `onPointerUp`, `onScroll`). Loops `<sc-for … hint-placeholder-count>`, conditionals `<sc-if … hint-placeholder-val>`.
- Every element explicitly closed; SVG children as `<path …></path>`, NEVER `/>`.
- No backdrop-filter anywhere. No emoji/unicode icon glyphs (inline stroke SVG icons, aria-hidden). Real `<button>`s, aria-labels on icon-only buttons. No fake status bar.
- Lifecycle allowed: componentDidMount / componentWillUnmount (clear timers / cancelAnimationFrame there).
- Grayscale only (accent colours not decided). Copy, all in Romanian.
- Navigation between artboards: `<a href="HubV2.dc.html">` etc. styled as the control itself (no button inside an anchor).

## Tokens (copy from HubV2 `t`): light page #F2F2EF, card #FFFFFF, text #0A0A0A, secondary #5C5C5C, hairline #E4E4E0, track #EDEDEA; dark (tweak `dark`) page #000, card #141414, text #FFF, secondary #A1A1A1, hairline #262626, track #1F1F1F. Fonts: 'Hanken Grotesk' for text and plain numbers (700, tabular-nums); the dot typeface "Shift Modular" for big numbers, screen/section titles and key figures — copy `dotTable`/the `var T = {…}` table and the methods dotLayout, dotWidth, dotPath, dotBox VERBATIM from HubV2.dc.html (do not modify them); every dot-font svg has role="img" + aria-label with the real text.

## Simulated liquid glass (class `.glass`, used on: island, chips, small buttons, pills on dark surfaces)
- background: linear-gradient(145deg, rgba(255,255,255,.20), rgba(255,255,255,.05)) over the element's own tint (on light pages use a dark tint: rgba(20,20,20,.78) under the gradient for the island; light chips use rgba(255,255,255,.55)).
- edges: `box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.18), inset 1px 0 0 rgba(255,255,255,.12), 0 10px 30px -8px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.12)`.
- specular highlight: a `::before` with `radial-gradient(120px circle at var(--gx,30%) var(--gy,0%), rgba(255,255,255,.35), transparent 60%)`, `mix-blend-mode: screen`; on pointerdown on THAT element set --gx/--gy to the touch point (via a state value bound into its inline style) and transition the highlight .4s — never a global pointermove listener.
- refraction hint: a 1px `::after` ring with `linear-gradient(135deg, rgba(255,255,255,.6), rgba(255,255,255,0) 40%, rgba(255,255,255,.25))` masked to the border (use `padding:1px; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude`).

## Depth (3D look)
- Cards: layered shadow `0 1px 1px rgba(0,0,0,.04), 0 4px 10px -2px rgba(0,0,0,.06), 0 18px 36px -12px rgba(0,0,0,.14)`, radius 24–28; dark mode: no outer shadow, `inset 0 1px 0 rgba(255,255,255,.06)` + 1px #1F1F1F border instead.
- Press: every pressable scales to .97 with `transition: transform .18s cubic-bezier(.32,.72,0,1)` and springs back with `cubic-bezier(.34,1.56,.64,1)` .42s on release.

## Motion system — NOTHING is static
Tokens (CSS custom props on the root): --d1 160ms, --d2 240ms, --d3 360ms, --d4 520ms; --e-out cubic-bezier(.22,1,.36,1); --e-ios cubic-bezier(.32,.72,0,1); --e-pop cubic-bezier(.34,1.56,.64,1).
- Entrance choreography on mount: top-to-bottom stagger 45ms, each block `opacity 0→1, translateY(14px)→0, scale(.985)→1` over --d4 --e-out. Titles in the dot font assemble: dots fade/scale in with a short left-to-right stagger (implement by splitting the text into per-glyph `<path>`s with increasing animation-delay, 18ms per glyph).
- Numbers count up on mount and whenever they change (rAF tween 700ms ease-out in the component; re-render via setState; dot-font numbers recompute their path each frame).
- State changes always animate (selection, toggles, open/close via grid-template-rows 0fr→1fr, value changes pop with a .9→1 scale --e-pop).
- "Redare" (replay) button on every artboard: a small glass pill (circular-arrow SVG + "Redare"), absolute top-right at top 14px, right 16px, z-index above content; tapping it restarts every entrance and count-up: keep `state.run` (0/1) and swap the animation names between two identical keyframe sets (`inA`/`inB`) by class `runA`/`runB` on the root so CSS animations restart; also restart counters.
- Tab transitions: the island's tabs are anchors to the other artboards (HUB → HubV2.dc.html, Calendar → Calendar2.dc.html, Ture → Shifts2.dc.html); the destination's entrance choreography is the transition; additionally on mount the active island pill slides in from the side of the previous tab (approximate: from left for Calendar, from right for Ture… any consistent direction) with --d3 --e-ios.
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all transforms/animations (opacity-only fades ≤ 120ms allowed); counters jump to the final value.

## Island (same on every screen, copy from HubV2 and restyle as `.glass`)
Three sections HUB / Calendar / Ture with the live icons from HubV2, 4px above the home indicator (bottom 17px), shrinks to a centred 64×52 pill on scroll down inside the screen's scroll container, expands on scroll up or tap. Home indicator 134×5 at bottom 8px.

## Checks before reporting
- no `/>`; every `{{…}}` is a dotted lookup that exists in renderVals output;
- run renderVals() in Node with `class DCLogic{constructor(p){this.props=p||{};this.state={}} setState(s){Object.assign(this.state,s)}}` (stub requestAnimationFrame/setTimeout) for dark on/off and the main interaction states; no errors/NaN/undefined in output;
- no git, no rendering/screenshots, touch only your own file(s).
