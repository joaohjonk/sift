# Sift · brand workspace (cstack)

The Sift brand as files an agent can read, check and keep. Made with [cstack](https://github.com/joaohjonk/cstack) on 27 Oct 2026 from JJ's brand system v3, copy system and the Figma file "Sift · Brand System v1".

Start here:

- `CONSTITUTION.md` · the design constitution: sources of truth, the seven pillars (taste as proof, the game, tasteful virality, honesty, the record as a document, our own images, slow time), checkable screen rules, how a screen is made and approved, open decisions.
- `assets/official/BRAND.md` · brand system v3, the source of truth. `COPY-SYSTEM.md` and `WRITING.md` for every word.
- `brand/brand-system.json` · 55 sourced fields, 2 open conflicts with the Figma file (type and logo).
- `brand/tokens/*.tokens.json` → `brand/generated/tokens.css` · the only colours, type, space and motion the app may use.
- `brand/rules/brand-rules.yaml` · 18 rules, each deterministic or judged.
- `references/gold`, `references/anti` · what to borrow (as mechanism) and what to avoid.
- `../DESIGN.md` · the same tokens in the format gstack's design skills read.

Commands (from this folder, with cstack installed):

```bash
cstack brand check --ws .     # schemas, conflicts, unknowns
cstack tokens check --ws . && cstack tokens build --ws .
cstack tokens lint ../src/app/globals.css
cstack brand guide --ws .     # brand/generated/guide.html
cstack brand resolve CF-2026-10-27-type --pick 1 --by JJ
```

Rebuild the brand state after editing a source: `python3 work/import/build_brand_system.py`.
