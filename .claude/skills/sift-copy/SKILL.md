---
name: sift-copy
description: Write, rewrite or review any Sift copy in PT-BR or English, from a landing headline to a button label, an error message or a deal status. Use before shipping any user-facing string in the app, the site, the iPhone app or a deck. Runs the Sift voice on top of the copywriting, copy-editing, ux-writing, humanizer and humanizer-pt-br skills in this folder.
---

# Sift copy

The Sift voice decides; the other skills are tools. When a tool's advice conflicts with the brand files, the brand files win.

## Sources, in this order

1. What JJ said in writing (latest wins). Killed lines go to `design/state/feedback.jsonl` and never come back.
2. `design/assets/official/BRAND.md` §07 Voice and §09 Record syntax.
3. `design/assets/official/COPY-SYSTEM.md` (owned words, banned words, Sift as a verb, the Fica / Sai / Ficaram / De fora grammar).
4. `design/assets/official/WRITING.md` and `design/CONSTITUTION.md`.

## Workflow

1. **Diagnose** (from `copywriting`): A blank or slop, B real voice present, C point edit. In B and C keep JJ's words and change only what fails.
2. **Find the one fact.** For a headline: what someone who has never heard of Sift understands in 3 seconds, before any signup (the Bier lens). For a UI string: the one fact the person needs now and the next action (`references/clarify.md`).
3. **Draft 3 candidates per unit**, each one directly in its language. Never translate PT from EN or EN from PT line by line.
4. **Run the three-question gate** on every candidate:
   - Can the reader picture it? A page, a receipt, a post, a dashed box.
   - Can it be proven true or false?
   - Could ShopMy, LTK or Benable write the same sentence? If yes, it fails.
5. **Remove AI tells.** PT: `humanizer-pt-br`, then the `better-portuguese` editorial pass. EN: `humanizer`. The strongest tells:
   - "não é X, é Y";
   - negation lists ("sem X, sem Y");
   - triads by reflex;
   - tidy closers that repeat the point;
   - colon reveals;
   - inflated words.
6. **Interface strings:** `ux-writing` for labels, errors, empty and loading states. One name per thing, the same verb for the same action everywhere.
7. **Brand check**, every line:
   - No dashes, no exclamation marks, no emoji.
   - No banned words. PT: vitrine, curadoria, curador, monetizar, jornada, ecossistema, descoberta, autêntico, "Compre agora". EN: storefront, curated, seamless, unlock, creator economy, "Shop now".
   - Never name a creator who has not signed with Sift (use @criadora), and never name the city.
   - Sift is a verb only in action moments ("Dê um sift", "Sift this post").
   - Record lines in caps follow `SIFT 00291 · FICOU COM @criadora · 12.03.26`.
8. **Present.** Headlines and taglines go to JJ as 3 options with a recommendation, PT and EN side by side. Small UI strings ship directly.

## The Sift Page speaks in the first person (JJ, 28 Oct 2026)

The creator's page is her profile, signed and chosen by her, like her Instagram or TikTok. Every line she says on it is first person: "Minhas quatro", "O que descobri recentemente", "Recomprei 6 vezes", "Testei e deixei de fora". Never third person ("as favoritas dela", "do jeito dela"), and never Sift talking about her. Record lines and visitor actions (Compartilhar, Acompanhar, Ver na loja) stay neutral. Sift's own voice is for Sift surfaces only: the home, Para criadoras, the record and the brand view.

## Approved lines (JJ)

- PT: "Bom gosto merece nome e sobrenome." · "Na frente, o gosto. Por trás, a prova." · "O boca a boca ganhou escala. O registro, não." · "Gosto aparece quando não dá para ficar com tudo." · "Cada publi, com contrato e recibo." · "Por enquanto, é pouca gente. De propósito." · "Dê um sift e monte seu look."
- EN: "Taste, on record." · "Proof of taste." · "Fewer, better things." · "The page in front. The record behind." · "Sift around and build your look."

## Killed lines

- "Ficam seis. O resto sai." Killed by JJ, 28 Oct 2026: it reads as a rule, says nothing about what Sift does, and fails the 3 second test.

## Skills in this folder and where they come from

| Skill | Source | License |
| --- | --- | --- |
| copywriting, copy-editing | github.com/coreyhaines31/marketingskills (top copy skill on skills.sh) | MIT |
| ux-writing | github.com/content-designer/ux-writing-skill (Stripe content designer) | MIT |
| humanizer | github.com/blader/humanizer | MIT |
| humanizer-pt-br | github.com/mackswendhell/humanizer-pt-br | MIT |
| references/clarify.md | github.com/pbakaus/impeccable | Apache 2.0 |

`better-portuguese` (github.com/rafaelquintanilha/skills) has no license file, so it is not copied here. Install it locally with `npx skills add rafaelquintanilha/skills --skill better-portuguese`. JJ already keeps a copy in `celeste/.agents/skills/better-portuguese`.
