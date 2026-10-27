# Sift · Brand system v3

29 Sep 2026, after the YC, Wintour and 032c review. Source of truth. Figma is a view of this file. v2 is kept in BRAND-v2.md, v1 in BRAND-v1.md.

## 00 · Idea

**Category claim.** Sift keeps the record of judgment: what a person chose, what she left out, and every deal behind the choice.

**Thesis.** A machine can now read the contract, watch the post and follow the money. Whoever keeps that record of every choice and every deal runs the creator's business.

**Mission, public.** People have always bought on someone's word. Now a few voices move millions, and nobody can measure it. We keep the record. (PT: Sempre se comprou por indicação. O que mudou é o alcance: hoje poucas vozes decidem por milhões, e ninguém consegue medir quanto. A Sift faz essa conta.)

**The problem, public.** There has never been more to buy, and finding what's worth it is broken. Creators get credit as a feeling, never as data.

**Attribution.** Through the page, never the post. Lifestyle creators keep posting as they do; the links live on the page and sales are attributed on first and last click. No affiliate links or shop tags in the feed.

**Lines**, in JJ's order: Taste, on record. · Proof of taste. · Fewer, better things.

**Two faces, one engine.** The page, in front: the machine finds every piece in a creator's posts, she keeps a few, and the page is built in minutes. The record, behind: the back office that understands, verifies and receives every deal. The machine proposes, the person chooses, and what she leaves out stays on record.

**The aphorism.** Taste without the record becomes content. The record without taste becomes software. Together, they become infrastructure.

**Laws**
1. Show the few, count the many. Every edit states its ratio (6 of 214, 3 of 5).
2. Nothing is deleted. What was left out stays on record, as a dashed box, a hairline or a line of type.
3. Red points at the one: the kept thing, the live state, the thing that needs you. Never decoration.
4. No text on pictures, except the machine's own marks (boxes and their labels). Captions sit under the frame and credit the maker.
5. Six at most. No view holds more than six chosen things.
6. One typeface. Helvetica, everywhere.
7. The record uses the same page as the edit. Denser, never a different world.
8. Placeless. Never name the city Sift is built in, on any surface.

## 01 · The mark

- **The Sift square.** A perfect square in Sift red #E8251A with `SIFT` whole in Helvetica Bold, white, set edge to edge, flush to the lower margin (4% of the side). Logo round 02, option B.
- **Alone.** Under 24 px, or as a stamp or sticker, the square appears without the name.
- **The plate.** The square as a 25 × 25 perforated plate, SIFT lit in white dots. The sieve is the mark in motion and the hero of the site.
- **Inverted.** A full red field with white type is the loudest the brand gets. At most one piece in five (the open for work call, the deck end card).
- **Never.** Rotated, rounded, outlined, gradient, retyped, a second colour, lowercase, the name outside the square as a logo.
- **Clear space.** A quarter of the side on every edge. **Minimum.** 16 px alone, 32 px with the name.

## 02 · Motion

**Tempo.** Everything moves slowly and settles. v3 runs about 1.4× slower than v2: fades 700 ms, settles 900 to 1000 ms, pictures arrive in 1.3 s, the intro leaves in 1.2 s. Easing `cubic-bezier(.2,.7,.1,1)` everywhere. Reduced motion always shows the finished state.

**Mark motion v3, the sieve.** 5.1 s, `site/assets/mark-motion.js`. No scan line.
1. 0.0 s · the plate, holes dark.
2. 0.4 to 2.7 s · the search: holes light a few at a time, flicker, go dark.
3. 2.7 to 3.5 s · the settle: the holes inside SIFT light up one by one; the rest stay dark.
4. 3.5 to 4.0 s · hold: SIFT in dots.
5. 4.0 to 4.8 s · the mark: lit holes swell and close into solid Helvetica Bold; the plate fades to flat red.
Then the page fades up under it. **Ambient** (the hero sieve): stops at the hold and keeps searching, stray holes pulsing every 7 to 16 s.

**Primitives.** **Sift:** the many fade to ghost, the kept stay red. **Recognise:** the machine draws boxes one by one with a label and a confidence, then the kept turn red and the left out turn dashed. **Arrive:** from the wash, never pop. **Morph:** labels change in place (Request access → Sending → On record). **The shelf:** objects jump from the bottom edge, a few are caught and land on a hairline with a 400 ms squash, the rest fall back.

## 03 · Sound

**The track.** JJ's own composition (ElevenLabs Music, 97 BPM editorial hip hop, warm bass, dusty drums, the "Can I sift it? Yes, you can." call and response), `site/assets/audio/intro_playful.mp3`.
**Behaviour.** Muted by default, "Sound on" in the bottom right corner. The first tap starts at the voice (15.95 s), plays the track out, then splices onto its own beat, continued without voices, and loops forever with crossfades. Voice once per session. Continuations are never allowed to invent vocals. Audition variants: `?loop=out1` (default), `out2`, `regen`, `a`, `intro`. Generators: `brand/07_audio/`.

## 04 · Typography

One family: **Helvetica** (Helvetica Neue on Apple devices). The web ships **TeX Gyre Heros** as its twin; Figma uses Inter as a stand in only until Helvetica is available there. Upgrade path: Helvetica Now or Pangram Gstaad.

| Role | Setting |
|---|---|
| Display, Sift speaks | Regular 400, tracking −4.5%, line 0.92 |
| Section, mission, pull quote | Regular 400, tracking −4%, line 0.98 |
| Lead and prose | Regular 400, 18 to 34 px, line 1.18 to 1.4 |
| The person and their choice | Italic 400 |
| Record: labels, captions, numbers, machine labels | Regular 400, caps, tracking +6%, 9.5 to 11.5 px, tabular figures |
| The mark | Bold 700, only inside the square |

Web scale: D1 52 to 184 px · D2 30 to 84 · D3 24 to 38 · lead 18 to 34 · body 16 · record 10 to 11.5. Slides at 1920: headline 76 to 84 · big number 200 to 240 · body 19 to 26 · record 15 to 16. Sentence case except record and mark; flush left, ragged right; no bold outside the mark.

## 05 · Grid

Margin m = max(16, width ÷ 36). 12 columns, gutter m ÷ 2. Labels in columns 1 to 4; headlines and text hang from column 5. Slides: m 80, headline on the left margin, a source line in every footer. Vertical unit 8 px; sections 110 to 180 px apart on desktop. The first fold is the full viewport, capped at 980 px.

## 06 · Colour

Paper #FFFFFF · Ink #0D0D0C · Sift red #E8251A · Wash #F4F4F1 · Ghost, ink at 14% · Quiet, ink at 56%. Red is the one; the wash is where products and the backstage live. On pictures the machine draws in red (kept) and white (seen, left out).

## 07 · Voice

**English.** A 032c article crossed with a Vignelli manual, legible to someone with zero context. Clear first, then editorial. Short declaratives, numbers over adjectives, no hype words, no exclamation marks, no dashes. Name the enemy plainly: WhatsApp, spreadsheets, 45 to 120 days. Every claim in a deck has a source line. World words: sift, kept, left out, on record, worth keeping.

**Portuguese.** Written natively, never translated line by line (skill: `celeste/.agents/skills/better-portuguese`). Register of a great Brazilian magazine (Revista Amarello, Gaía Passarelli), with creator talk used lightly: publi, recebido, job. Examples: "Bom gosto merece nome e sobrenome." · "Cada publi, com contrato e recibo." · "Por enquanto, é pouca gente. De propósito." Rejected: "Achamos que o gosto merece um registro" (calque).

**Never say.** "The creator never gets the credit" (she does, as a feeling). "People now decide what the world buys" (they always have). "Everything is for sale". "An AI native ShopMy". "Creator economy" as a headline. "AI understands your taste". Coupon and monetise vocabulary. "Not X but Y" constructions. The city.

**Public promises.** No taste score, ever. Disagreement is data. Every commercial tie is visible: organic, gifted, affiliate, paid. Your judgment is yours. Nothing is deleted quietly. Never discount codes, never dupes, commission never changes ranking.

## 08 · Images

**Four classes.**
1. **The kept object.** Real branded products that matter to a very high end Brazilian taste (fashion, beauty, fragrance, curated supplements, activewear, home): Misci, Cris Barros, The Row, NK, Aesop, Mansur Gavriel, Seed and peers. Shown with the machine's box and a record caption: `Kept · No. 068 · Mansur Gavriel, box bags`. Current set in `site/assets/world/kept-*.jpg`, still to add: The Row, Cris Barros, NK.
2. **The post.** Lifestyle frames with several real products in use, where the machine can visibly work: boxes, labels, confidence, kept versus left out (`life-comune.jpg`).
3. **The world.** The chooser, the room of one mind, the record, the audience (Eisenstaedt is the emotional centre of the site).
4. **Our products.** The 4:5 studio standard on #F4F4F1 (`brand/05_sku/`), for decks, UX screens and anything commercial.

**Rights.** Third party pictures are references for the manifesto site while it is not commercial, the deck and pitches; credit the maker; license or reshoot before any commercial use. Product images belong to their brands.

## 09 · Record syntax

`SIFT 00291 · KEPT BY Ana L. · 12.03.26 · OBJECT Overshirt, linen · SOURCE Reel · STATUS On record`. Machine label: `COMUNE · HAND AND BODY WASH · 98%`. Deal fields: Contract · Post · Check (product, mention, length, #publi disclosure) · Rights · Invoice (NF-e) · Payment. States: Draft, Signed, Live, Verified, Invoiced, Paid. Side states Late, Rights ending and Conflict take red; anything that moves money needs a person's approval.

## 10 · Applications

- **sift.cc v5**, `site/`: hero (`?hero=sieve` or `?hero=kept`), manifesto, mission, the field as a section breaker, two faces demo, open for work, the shelf. EN and PT. Deploy only through `site/build.sh`, which whitelists public files into `dist/`.
- **Deck v3**, `brand/06_decks/v3/` (storyline, answers, PDF, Figma), with UX screens in `v3/ux/` (page on phone, page build, record ledger, deal, capture, brand view).
- **Brand book**, `brand/system/book/`.
- **Logo** `brand/03_logo/round2.html`; motion `site/assets/mark-motion.js`.

**Security.** Internal documents (founder answers, research memo, decks, this folder) never enter `dist/`. After every deploy, check that they return 404.

## Forbidden

Beige plus serif plus burgundy. Serifs. Expanded grotesks. Gradients, glass, glow, sparkles, rounded corners, UI drop shadows. Icons as decoration. A taste score. Follower counts on the frontstage. "Shop now". Red fills beyond the mark, the kept and the one inverted piece. More than six chosen things in one view. A scan line. Naming the city. Celeste's faces or palette.
