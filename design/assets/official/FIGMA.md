# Sift · Figma ledger

File: Sift · Brand System v1 · https://www.figma.com/design/8igZ9lqi2khpkKRgAmwfV5 (Personal team)

Figma is a view of BRAND.md. Text styles target Switzer; until Switzer syncs to Figma (installed in ~/Library/Fonts on 28 Sep, Figma needs a restart to see it) they use Inter Light and Regular as a stand-in. Swapping the family inside the text styles retypes the whole file.

## Variables
- Color (Light, Dark): color/paper 3:3, ink 3:4, ghost 3:5, quiet 3:6, red 3:7, wash 3:8. Collection VariableCollectionId:3:2, modes Light 3:0, Dark 3:1.
- Space (Desktop, Mobile): space/margin 3:10, gutter 3:11, u 3:12, section 3:13, slot-gap 3:14. Collection 3:9.

## Text styles
Display/D1 · 168, D2 · 80, D3 · 40, D1 mobile · 52, D2 mobile · 32, Text/Lead · 22, Text/Body · 15, Person/Name · 28, Person/Inline · 22, Record/M · 11, Record/M small · 9, Wordmark/SIFT · 15.

## Grid styles
Grid/Desktop 1440 · 12 col, Grid/Mobile 390 · 4 col, Grid/Slide 1920 · 12 col.

## Pages

## Built 28 Sep (node ids)
- Cover 13:158
- Components (section 6:118): Wordmark 6:2 · Button set 6:21 · Field 6:43 · Slot 6:51 · Ratio 6:53 · Record line 6:56 · List row 6:71 · Status 6:100 · Mark 6:108 · Nav 6:110
- Boards: 00 Thesis 8:2 · 01 Identity 8:45 · 02 Typography 8:100 · 03 Grid 9:2 · 04 Colour 9:53 · 05 Image 9:123 · 06 Record 10:2 · 07 Graphic language 10:84 · 08 Motion 10:151
- Applications: Homepage 11:2 · Creator profile 11:48 · Collection 11:104 · Object detail 11:136 · Deal record 12:65 · Poster A2 12:136 · Instagram 12:144 · Mobile 12:153

## Switching to Switzer once Figma sees it
Restart Figma (or the Figma font helper) so it picks up ~/Library/Fonts/Switzer-*.otf, then run in use_figma:

```js
for (const f of [{family:'Switzer',style:'Light'},{family:'Switzer',style:'Regular'}]) await figma.loadFontAsync(f);
const ts = await figma.getLocalTextStylesAsync();
for (const s of ts) if (s.fontName.family==='Inter') s.fontName = {family:'Switzer', style: s.fontName.style==='Light'?'Light':'Regular'};
return ts.map(s=>s.name+' → '+s.fontName.family+' '+s.fontName.style);
```
Then check the headlines for reflow (Switzer sets a little wider than Inter).
