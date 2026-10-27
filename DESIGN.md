---
name: Sift
source: design/assets/official/BRAND.md (v3, 29 Sep 2026). This file is the machine-readable view; BRAND.md wins on any conflict. Tokens: design/brand/generated/tokens.css. Laws and process: design/CONSTITUTION.md.
colors:
  paper: "#FFFFFF"
  ink: "#0D0D0C"
  red: "#E8251A"        # the one: the kept thing, the live state, the thing that needs you. Never decoration
  wash: "#F4F4F1"       # where products and the backstage live
  ghost: "rgba(13,13,12,.14)"   # the many, left out, dashed outlines
  quiet: "rgba(13,13,12,.56)"   # secondary text
typography:
  family: "Helvetica Neue, Helvetica, TeX Gyre Heros (web twin), Arial"
  display: { weight: 400, tracking: "-0.045em", line: 0.92, size: "clamp(52px, 12.4vw, 184px)" }
  section: { weight: 400, tracking: "-0.04em", line: 0.98, size: "clamp(30px, 5.4vw, 76px)" }
  lead: { weight: 400, size: "clamp(18px, 1.55vw, 23px)", line: 1.28 }
  body: { weight: 400, size: "16px", line: 1.45 }
  record: { weight: 400, case: upper, tracking: "0.06em", size: "clamp(10px, 0.8vw, 11.5px)", numerals: tabular }
  person: { style: italic }   # the person and their choice
  mark: { weight: 700 }       # only inside the red square
spacing:
  unit: 8px
  margin: "max(16px, 100vw / 36)"
  gutter: "margin / 2"
  grid: 12 columns, labels in 1 to 4, text from 5
rounded: 0          # no radius anywhere
shadow: none        # no UI shadows
motion:
  easing: "cubic-bezier(.2,.7,.1,1)"
  fade: 700ms
  settle: 900ms
  picture_arrive: 1300ms
  primitives: [sift, recognise, arrive, morph, shelf]
  reduced_motion: show the finished state
components:
  mark: "red square, SIFT whole in Helvetica Bold, white, flush to the lower margin; alone under 24 px"
  button: "ink fill, white record type, 52px tall, no radius"
  textbutton: "record type with a 1px underline"
  kept_box: "1.5px red outline with an 8px red tag on the top left; seen and left out boxes are white and dashed"
  tile: "wash square; kept = red outline; empty = dashed ghost outline"
---

# Sift · DESIGN.md

Tokens for tools and agents (gstack /design-review, /design-consultation and cstack read this). The laws, the voice and the image classes live in `design/assets/official/BRAND.md`; the words in `design/assets/official/COPY-SYSTEM.md`; how a screen is made and approved in `design/CONSTITUTION.md`. Two conflicts with the Figma file are open (type and logo); the defaults below hold until JJ resolves them.

**Laws, in short.** Show the few, count the many. Nothing is deleted. Red points at the one. No text on pictures except the machine's own marks. Six at most per view. One typeface. The record uses the same page as the edit. Never name the city.

**Never.** Serifs, expanded grotesks, gradients, glass, glow, rounded corners, UI shadows, icons as decoration, a taste score, follower counts on the frontstage, "Shop now".

**App surfaces.** Sift Page (public, the edit) and Sift Record (private, the proof: proposal, contract, post check, nota fiscal, Pix, receipt) share one grammar. Every row has a date, a state and a reason. Red only on the thing that needs her. Deal states: Draft, Signed, Live, Verified, Invoiced, Paid; Late, Rights ending and Conflict take red.
