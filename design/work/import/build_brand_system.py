"""Build brand/brand-system.json from the official sources in assets/official/.

Run from the workspace root (design/): python3 work/import/build_brand_system.py
Every field quotes the line it came from. BRAND.md v3 wins over the Figma file when they disagree.
"""
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OFF = ROOT / "assets" / "official"
TODAY = "2026-10-27"
BRAND = "assets/official/BRAND.md"
COPY = "assets/official/COPY-SYSTEM.md"
WRITING = "assets/official/WRITING.md"
SITE = "assets/official/site-tokens.css"
FIGMA = "assets/official/FIGMA.md"
CAPTURED = {BRAND: "2026-09-29", COPY: "2026-10-01", WRITING: "2026-10-01", SITE: "2026-10-01", FIGMA: "2026-09-28"}


def src(ref, quote, kind="official_asset"):
    path = ref.split("#")[0]
    return {"kind": kind, "ref": ref, "quote": quote[:400], "captured_at": CAPTURED.get(path, TODAY), "by": "brand-import"}


def field(value, sources, cls="HARD_CONSTRAINT", approval="current", confidence="high", notes=None, permanence="core"):
    f = {
        "value": value,
        "input_class": cls,
        "sources": sources,
        "confidence": confidence,
        "last_updated": TODAY,
        "permanence": permanence,
        "approval": approval,
    }
    if notes:
        f["notes"] = notes
    return f


S = {}

S["business_truth"] = {
    "faces": field(
        "Two faces, one engine. Sift Page in front: the machine finds every piece in a creator's posts, she keeps a few, the page is built in minutes. Sift Record behind: contract, post check, invoice and payment for her, her agency and the brand.",
        [src(BRAND + "#00", "Two faces, one engine. The page, in front ... The record, behind: the back office that understands, verifies and receives every deal.")],
        cls="FACT",
    ),
    "attribution": field(
        "Through the page, never the post. Links live on the Sift Page; sales are attributed on first and last click. No affiliate links or shop tags in the feed.",
        [src(BRAND + "#00", "Attribution. Through the page, never the post.")],
    ),
    "money_needs_a_person": field(
        "Anything that moves money needs a person's approval.",
        [src(BRAND + "#09", "anything that moves money needs a person's approval.")],
    ),
}
S["category"] = {
    "claim": field(
        "Sift keeps the record of judgment: what a person chose, what she left out, and every deal behind the choice.",
        [src(BRAND + "#00", "Category claim. Sift keeps the record of judgment: what a person chose, what she left out, and every deal behind the choice.")],
        approval="locked",
    ),
}
S["positioning"] = {
    "judging_sentence": field(
        "Sift is where a choice gets an author, a history and a consequence. (PT: A Sift é onde a escolha passa a ter autor, histórico e consequência.)",
        [src(COPY, "The sentence that judges every next decision. Sift is where a choice gets an author, a history and a consequence.")],
        approval="locked",
    ),
    "lines": field(
        ["Taste, on record.", "Proof of taste.", "Fewer, better things."],
        [src(BRAND + "#00", "Lines, in JJ's order: Taste, on record. · Proof of taste. · Fewer, better things.")],
        approval="locked",
    ),
    "not_competing_in": field(
        "ShopMy says 'Your Storefront. Your standard.' Sift does not compete in that vocabulary. Sift owns choice and consequence.",
        [src(COPY, "ShopMy says \"Your Storefront. Your standard.\" and Benable says \"real people, real recs\". Sift does not compete in that vocabulary.")],
    ),
}
S["brand_beliefs"] = {
    "aphorism": field(
        "Taste without the record becomes content. The record without taste becomes software. Together, they become infrastructure.",
        [src(BRAND + "#00", "Taste without the record becomes content. The record without taste becomes software. Together, they become infrastructure.")],
    ),
    "laws": field(
        [
            "Show the few, count the many. Every edit states its ratio.",
            "Nothing is deleted. What was left out stays on record.",
            "Red points at the one: the kept thing, the live state, the thing that needs you. Never decoration.",
            "No text on pictures, except the machine's own marks.",
            "Six at most. No view holds more than six chosen things.",
            "One typeface. Helvetica, everywhere.",
            "The record uses the same page as the edit. Denser, never a different world.",
            "Placeless. Never name the city Sift is built in.",
        ],
        [src(BRAND + "#00", "Laws 1. Show the few, count the many ... 8. Placeless. Never name the city Sift is built in, on any surface.")],
        approval="locked",
    ),
    "public_promises": field(
        ["No taste score, ever.", "Disagreement is data.", "Every commercial tie is visible: organic, gifted, affiliate, paid.", "Your judgment is yours.", "Nothing is deleted quietly.", "Never discount codes, never dupes, commission never changes ranking."],
        [src(BRAND + "#07", "Public promises. No taste score, ever. Disagreement is data. Every commercial tie is visible ...")],
        approval="locked",
    ),
}
S["voice"] = {
    "english": field(
        "A 032c article crossed with a Vignelli manual, legible with zero context. Short declaratives, numbers over adjectives, no hype words, no exclamation marks, no dashes.",
        [src(BRAND + "#07", "A 032c article crossed with a Vignelli manual, legible to someone with zero context. Clear first, then editorial.")],
    ),
    "portuguese": field(
        "Written natively, never translated line by line. Register of a great Brazilian magazine, creator talk used lightly (publi, recebido, job). 'Você' in the interface.",
        [src(BRAND + "#07", "Portuguese. Written natively, never translated line by line ... Register of a great Brazilian magazine"), src(WRITING, "\"Você\" na interface, \"a gente\" quando a Sift fala de si num tom de conversa.")],
    ),
    "tests": field(
        ["See it", "Falsify it", "Only us", "Zero context", "Read aloud", "Count the cost (every word in UI is a tap of friction)"],
        [src(WRITING, "Every line passes all six, or it goes back.")],
    ),
    "sift_is_a_verb": field(
        "Use Sift as a verb in action moments (toys, buttons, shares): Sift again, Dê um sift. Never 'peneirar'.",
        [src(COPY, "Sift is a verb (JJ, 1 Oct). To sift is to choose well and leave the rest out.")],
        approval="locked",
    ),
}
S["vocabulary"] = {
    "english": field(["keep", "kept", "left out", "choose", "edit", "source", "page", "record", "proof", "trace", "on record"], [src(COPY, "English owns: keep, kept, left out, choose, edit, source, page, record, proof, trace, on record.")]),
    "portuguese": field(["fica", "ficou", "sai", "de fora", "escolha", "fonte", "página", "registro", "prova", "nome e sobrenome"], [src(COPY, "Português owns: fica, ficou, sai, de fora, escolha, fonte, página, registro, prova, nome e sobrenome.")]),
    "product_names": field(["Sift Page", "Sift Record", "Monte o look"], [src(WRITING, "One name per thing: Sift Page, Sift Record, Monte o look.")], approval="locked"),
    "deal_states": field(
        {"states": ["Draft", "Signed", "Live", "Verified", "Invoiced", "Paid"], "red_side_states": ["Late", "Rights ending", "Conflict"]},
        [src(BRAND + "#09", "States: Draft, Signed, Live, Verified, Invoiced, Paid. Side states Late, Rights ending and Conflict take red")],
    ),
}
S["banned_language"] = {
    "words": field(
        ["curated", "authentic", "community", "empower", "unlock", "discover", "seamless", "ecosystem", "monetize", "creator economy", "AI-powered", "shopping destination", "delve", "elevate", "journey", "game changer", "Shop now",
         "curadoria", "autêntico", "jornada", "ecossistema", "potencializar", "descoberta", "experiência personalizada", "monetizar", "peneirar", "vitrine", "storefront", "rolodex"],
        [src(COPY, "Avoid: curated, authentic, community, empower, unlock, discover, seamless, ecosystem ... Never call the Sift Page a storefront, vitrine or rolodex."), src(WRITING, "Also banned: delve, unlock, elevate, seamless, curated as praise, journey, game changer, empower")],
        approval="locked",
    ),
    "constructions": field(
        ["Not X but Y", "colon as punch line", "reflex triplets", "dashes", "exclamation marks", "emoji", "'In a world...' openers", "naming the city"],
        [src(WRITING, "Not X but Y ... Colon as punch line ... Reflex triplet ... Dash as drama"), src(BRAND + "#07", "\"Not X but Y\" constructions. The city.")],
        approval="locked",
    ),
}
S["logo_marks"] = {
    "primary": field(
        "The Sift square: a perfect square in Sift red #E8251A with SIFT whole in Helvetica Bold, white, edge to edge, flush to the lower margin (4% of the side). Alone (no name) under 24 px. Clear space a quarter of the side. Minimum 16 px alone, 32 px with the name.",
        [src(BRAND + "#01", "The Sift square. A perfect square in Sift red #E8251A with SIFT whole in Helvetica Bold, white, set edge to edge, flush to the lower margin (4% of the side)."), src(SITE, ".mark{display:block;width:40px;height:40px;background:var(--red)", kind="live_brand_behavior")],
        approval="conflict",
        notes="Open conflict CF-2026-10-27-logo with the Figma Identity page (plain SIFT wordmark, no square). Default until JJ resolves: the red square, as on sift.cc.",
    ),
    "never": field(
        ["rotated", "rounded", "outlined", "gradient", "retyped", "a second colour", "lowercase", "the name outside the square as a logo"],
        [src(BRAND + "#01", "Never. Rotated, rounded, outlined, gradient, retyped, a second colour, lowercase, the name outside the square as a logo.")],
        approval="locked",
    ),
}
S["color"] = {
    "paper": field("#FFFFFF", [src(BRAND + "#06", "Paper #FFFFFF")], cls="FACT", approval="locked", notes="token: color.paper"),
    "ink": field("#0D0D0C", [src(BRAND + "#06", "Ink #0D0D0C")], cls="FACT", approval="locked", notes="token: color.ink"),
    "red": field("#E8251A", [src(BRAND + "#06", "Sift red #E8251A ... Red is the one")], cls="FACT", approval="locked", notes="token: color.red. The kept thing, the live state, the thing that needs you. Never decoration, never a fill beyond the mark, the kept and the one inverted piece."),
    "wash": field("#F4F4F1", [src(BRAND + "#06", "Wash #F4F4F1 ... the wash is where products and the backstage live")], cls="FACT", approval="locked", notes="token: color.wash"),
    "ghost": field("rgba(13,13,12,.14)", [src(BRAND + "#06", "Ghost, ink at 14%")], cls="FACT", approval="locked", notes="token: color.ghost. The many, left out, dashed outlines."),
    "quiet": field("rgba(13,13,12,.56)", [src(BRAND + "#06", "Quiet, ink at 56%")], cls="FACT", approval="locked", notes="token: color.quiet. Secondary text."),
    "dark_mode": field(
        "Figma defines a dark mode (paper #0D0D0C, ink #F4F4F1, red #FF4331, wash #171716). BRAND.md v3 has no dark mode; the site ships light only.",
        [src(FIGMA, "Color (Light, Dark): color/paper 3:3, ink 3:4, ghost 3:5, quiet 3:6, red 3:7, wash 3:8.", kind="extracted_pattern")],
        cls="SOFT_CONSTRAINT", approval="provisional", confidence="medium",
        notes="Use only for the iPhone app's system dark mode, never on sift.cc, until JJ confirms.",
    ),
}
S["typography"] = {
    "family": field(
        "Helvetica (Helvetica Neue on Apple). The web ships TeX Gyre Heros as its free twin. One family everywhere.",
        [src(BRAND + "#04", "One family: Helvetica (Helvetica Neue on Apple devices). The web ships TeX Gyre Heros as its twin"), src(SITE, "--h:\"Helvetica Neue\",Helvetica,\"Heros\",Arial,sans-serif;", kind="live_brand_behavior")],
        approval="conflict",
        notes="Open conflict CF-2026-10-27-type with the Figma file (Switzer, Newsreader italic, Martian Mono). Default until JJ resolves: Helvetica only, as BRAND.md v3 and sift.cc.",
    ),
    "weights": field(
        "Regular 400 and Italic 400 everywhere. Bold 700 only inside the red square.",
        [src(BRAND + "#04", "The mark | Bold 700, only inside the square"), src(BRAND + "#04", "no bold outside the mark.")],
        approval="locked",
    ),
    "person": field("The person and their choice are set in Italic 400.", [src(BRAND + "#04", "The person and their choice | Italic 400")], approval="locked"),
}
S["type_hierarchy"] = {
    "web_scale": field(
        {"D1": "clamp(52px,12.4vw,184px) · 400 · -4.5% · 0.92", "D2": "clamp(30px,5.4vw,76px) · 400 · -4% · 0.98", "D3": "clamp(24px,2.6vw,38px) · -3% · 1.02", "lead": "clamp(18px,1.55vw,23px) · 1.34", "body": "16px · 1.45", "record": "clamp(10px,.8vw,11.5px) · caps · +6% · tabular"},
        [src(SITE, "--D1:clamp(52px,12.4vw,184px); --D2:clamp(30px,5.4vw,76px); --D3:clamp(24px,2.6vw,38px); --L:clamp(18px,1.55vw,23px); --T:16px; --M:clamp(10px,.8vw,11.5px);", kind="live_brand_behavior"), src(BRAND + "#04", "Web scale: D1 52 to 184 px · D2 30 to 84 · D3 24 to 38 · lead 18 to 34 · body 16 · record 10 to 11.5.")],
    ),
    "case_and_alignment": field("Sentence case except record lines and the mark. Flush left, ragged right.", [src(BRAND + "#04", "Sentence case except record and mark; flush left, ragged right")], approval="locked"),
}
S["grid"] = {
    "web": field(
        "Margin m = max(16px, 100vw/36). 12 columns, gutter m/2. Labels in columns 1 to 4; headlines and text hang from column 5. First fold is the full viewport, capped at 980 px.",
        [src(BRAND + "#05", "Margin m = max(16, width ÷ 36). 12 columns, gutter m ÷ 2. Labels in columns 1 to 4; headlines and text hang from column 5.")],
    ),
}
S["spacing"] = {
    "unit": field("8px vertical unit; sections 110 to 180 px apart on desktop.", [src(BRAND + "#05", "Vertical unit 8 px; sections 110 to 180 px apart on desktop.")]),
}
S["components"] = {
    "button": field("Ink fill, white record type, 52 px tall, no radius. Hover turns red.", [src("assets/official/DESIGN-site.md", "button: \"ink fill, white record type, 52px tall, no radius\"")]),
    "text_button": field("Record type with a 1 px underline (SIFT AGAIN).", [src("assets/official/DESIGN-site.md", "textbutton: \"record type with a 1px underline\"")]),
    "kept_box": field("1.5 px red outline with an 8 px red tag top left; seen and left out boxes are white and dashed.", [src("assets/official/DESIGN-site.md", "kept_box: \"1.5px red outline with an 8px red tag on the top left; seen and left out boxes are white and dashed\"")]),
    "tile": field("Wash square; kept = red outline; empty = dashed ghost outline.", [src("assets/official/DESIGN-site.md", "tile: \"wash square; kept = red outline; empty = dashed ghost outline\"")]),
    "record_line": field(
        "SIFT 00291 · KEPT BY Ana L. · 12.03.26 · OBJECT Overshirt, linen · SOURCE Reel · STATUS On record",
        [src(BRAND + "#09", "SIFT 00291 · KEPT BY Ana L. · 12.03.26 · OBJECT Overshirt, linen · SOURCE Reel · STATUS On record")],
    ),
    "never": field(["rounded corners", "UI drop shadows", "cards with shadows", "icons as decoration", "gradients", "glass", "glow"], [src(BRAND + "#forbidden", "Gradients, glass, glow, sparkles, rounded corners, UI drop shadows. Icons as decoration.")], approval="locked"),
}
S["motion"] = {
    "tempo": field(
        "Slow and settled. Easing cubic-bezier(.2,.7,.1,1). Fades 700 ms, settles 900 to 1000 ms, pictures arrive in 1.3 s. Reduced motion shows the finished state.",
        [src(BRAND + "#02", "Tempo. Everything moves slowly and settles ... fades 700 ms, settles 900 to 1000 ms, pictures arrive in 1.3 s")],
    ),
    "primitives": field(
        {"sift": "the many fade to ghost, the kept stay red", "recognise": "the machine draws boxes one by one with a label and a confidence; kept turn red, left out turn dashed", "arrive": "from the wash, never pop", "morph": "labels change in place (Request access → Sending → On record)", "shelf": "objects jump from the bottom edge, a few land on a hairline with a 400 ms squash, the rest fall back"},
        [src(BRAND + "#02", "Primitives. Sift ... Recognise ... Arrive ... Morph ... The shelf")],
    ),
    "mark_motion": field("The sieve, 5.1 s, a 25 × 25 perforated red plate; SIFT lights in dots and closes into the mark. No scan line.", [src(BRAND + "#02", "Mark motion v3, the sieve. 5.1 s ... No scan line.")]),
}
S["sound"] = {
    "track": field("JJ's own track, muted by default, 'Sound on' bottom right; voice once per session, then a loop.", [src(BRAND + "#03", "Behaviour. Muted by default, \"Sound on\" in the bottom right corner.")], cls="SOFT_CONSTRAINT"),
}
S["interaction"] = {
    "the_game": field(
        "Participation through games demonstrates the thesis: you cannot reveal taste without constraints. Monte o look: pick from many, keep at most six, the rest leave. The end screen is a shareable card.",
        [src(COPY, "Participation. The games demonstrate the thesis: you cannot reveal taste without constraints. Choosing means leaving things out.")],
        cls="SOFT_CONSTRAINT",
    ),
    "honesty": field(
        "Every guess shows its evidence; exact and similar matches stay separate; no dark patterns (streaks, fake scarcity, '$0 today').",
        [src("assets/official/README.md", "Flows brief, 2 Oct 2026: Honesty rules: every guess shows its evidence; exact vs similar matches stay separate; no dark patterns", kind="approved_brand_state")],
        approval="locked",
    ),
}
S["photography"] = {
    "classes": field(
        ["The kept object (real branded products, machine box, record caption)", "The post (lifestyle frames where the machine visibly works)", "The world (the chooser, the room of one mind, the record, the audience)", "Our products (4:5 studio standard on #F4F4F1)"],
        [src(BRAND + "#08", "Four classes. 1. The kept object ... 2. The post ... 3. The world ... 4. Our products.")],
    ),
    "rights": field("Third party pictures are references only while not commercial; credit the maker; license or reshoot before commercial use.", [src(BRAND + "#08", "Rights. Third party pictures are references for the manifesto site while it is not commercial")], approval="locked"),
}
S["product_representation"] = {
    "studio_standard": field("4:5, seamless matte paper #F4F4F1, soft daylight upper left, one contact shadow, product identical to the original, no props, hands, text or added logos.", [src(BRAND + "#08", "Our products. The 4:5 studio standard on #F4F4F1")]),
}
S["anti_references"] = {
    "forbidden": field(
        ["beige plus serif plus burgundy", "serifs", "expanded grotesks", "gradients, glass, glow, sparkles", "rounded corners", "UI drop shadows", "icons as decoration", "a taste score", "follower counts on the frontstage", "Shop now", "more than six chosen things in one view", "a scan line", "naming the city", "Celeste's faces or palette"],
        [src(BRAND + "#forbidden", "Beige plus serif plus burgundy. Serifs. Expanded grotesks. Gradients, glass, glow, sparkles, rounded corners, UI drop shadows.")],
        approval="locked",
    ),
}
S["compliance_constraints"] = {
    "disclosure": field("Every commercial tie is visible (organic, gifted, affiliate, paid); post checks include the #publi disclosure.", [src(BRAND + "#09", "Check (product, mention, length, #publi disclosure)")], approval="locked"),
    "unsigned_people": field("Never name a creator who has not signed with Sift on any demo or public surface; use @criadora.", [src("assets/official/README.md", "JJ, 21 Oct 2026: do not name the MVP creator until she signs.", kind="user_instruction")], approval="locked"),
}
S["known_uncertainties"] = {
    "creative_direction": field(
        "Creative direction v2 (27 Oct 2026) proposes three worlds: Verso, Livro, Garimpo. JJ has not picked one. The system above draws any of the three.",
        [src("assets/official/README.md", "creative direction v2 draft (27 Oct, not yet chosen by JJ)", kind="approved_brand_state")],
        cls="OPEN_CREATIVE_SPACE", approval="unknown", confidence="medium",
    ),
}

conflicts = [
    {
        "id": "CF-2026-10-27-type",
        "field": "typography.family",
        "positions": [
            {"value": "Helvetica only (TeX Gyre Heros on the web)", "source": src(BRAND + "#04", "One family: Helvetica (Helvetica Neue on Apple devices).")},
            {"value": "Switzer 300/400, Newsreader Light Italic for names, Martian Mono for record lines", "source": src(FIGMA, "Text styles target Switzer; until Switzer syncs to Figma ... they use Inter Light and Regular as a stand-in.")},
        ],
        "default_until_resolved": "Helvetica only",
        "status": "open",
        "owner": "JJ",
        "notes": "BRAND.md v3 (29 Sep) is newer than the Figma build (28 Sep) and says Figma is a view of it. Its forbidden list bans serifs, which rules out Newsreader.",
    },
    {
        "id": "CF-2026-10-27-logo",
        "field": "logo_marks.primary",
        "positions": [
            {"value": "Red square with SIFT in Helvetica Bold", "source": src(BRAND + "#01", "The Sift square. A perfect square in Sift red #E8251A with SIFT whole in Helvetica Bold")},
            {"value": "Plain SIFT wordmark, caps, +16% tracking, no symbol", "source": src("https://www.figma.com/design/8igZ9lqi2khpkKRgAmwfV5 (page 01 Identity)", "SIFT wordmark, no symbol, top left at text size", kind="extracted_pattern")},
        ],
        "default_until_resolved": "Red square",
        "status": "open",
        "owner": "JJ",
        "notes": "sift.cc ships the red square today.",
    },
]

ingested = []
for p in sorted(OFF.rglob("*")):
    if p.is_file() and p.name != ".keep":
        ingested.append({"ref": str(p.relative_to(ROOT)), "kind": "official_asset", "hash": hashlib.sha256(p.read_bytes()).hexdigest(), "date": TODAY})
ingested.append({"ref": "https://www.figma.com/design/8igZ9lqi2khpkKRgAmwfV5", "kind": "figma", "date": TODAY, "notes": "Sift · Brand System v1: identity, type, colour, components, applications, prototypes 19 (Registro) and 22 (Sift Page) read by screenshot"})

path = ROOT / "brand" / "brand-system.json"
bs = json.loads(path.read_text())
bs["metadata"].update({"updated": TODAY, "status": "imported", "owner": "JJ", "stage": "prelaunch", "languages": ["en", "pt-BR"], "markets": ["BR"], "version": "v3-import-1"})
bs["provenance"]["ingested"] = ingested
bs["provenance"]["gaps"] = [
    {"looked_for": "licensed Helvetica for the app", "where": "assets/official/fonts has only TeX Gyre Heros", "status": "needs_owner"},
    {"looked_for": "creative direction pick (Verso, Livro, Garimpo)", "where": "JJ", "status": "needs_owner"},
]
for k, v in S.items():
    bs["sections"][k] = v
bs["conflicts"] = conflicts
path.write_text(json.dumps(bs, ensure_ascii=False, indent=2) + "\n")
print("fields:", sum(len(v) for v in S.values()), "sections:", len(S), "conflicts:", len(conflicts))
