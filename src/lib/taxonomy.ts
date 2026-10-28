// Taxonomia fixa da Sift (doc "Sift · taxonomia de categorias e coleções").
// Parte fixa: departamento e categoria, iguais para todas, para filtrar e comparar.
// Parte flexível: o formato da coleção (rotina, high low, na bolsa...), que é dela.

export const DEPARTMENTS = ["Moda", "Beleza", "Fragrância", "Bem-estar", "Treino", "Casa"] as const;
export type Department = (typeof DEPARTMENTS)[number];

type CatalogItem = { category: string; slot: string; name: string };

/** [departamento, categoria] de uma peça do catálogo. */
export function classify(item: CatalogItem): [Department, string] {
  const n = item.name;
  if (item.category === "beauty") return ["Beleza", /Batom|Base|Gloss|Blush|Rímel/i.test(n) ? "Maquiagem" : /Sabonete|Corpo/i.test(n) ? "Corpo e banho" : "Skincare"];
  if (item.category === "fragrance") return ["Fragrância", "Perfume"];
  if (item.category === "home") {
    if (/Vela/i.test(n)) return ["Fragrância", "Vela"];
    if (/Aroma|Difusor/i.test(n)) return ["Fragrância", "Difusor"];
    if (/Bule|Chaleira|xícaras|matcha/i.test(n)) return ["Casa", "Mesa e café"];
    if (/Toalha|Lençol/i.test(n)) return ["Casa", "Cama e banho"];
    return ["Casa", "Objetos"];
  }
  if (/Bolsa/i.test(n)) return ["Moda", "Bolsas"];
  if (/Brinco|Gargantilha|Colar|Anel/i.test(n)) return ["Moda", "Joias"];
  if (/Óculos/i.test(n)) return ["Moda", "Óculos"];
  if (item.slot === "shoes") return ["Moda", "Calçados"];
  if (item.slot === "head" || item.slot === "accessory") return ["Moda", "Acessórios"];
  return ["Moda", "Roupas"];
}

/** Faixas de preço em reais, as mesmas em toda página. */
export const PRICE_BANDS = [
  { id: "ate-300", label: "Até R$ 300", max: 30000 },
  { id: "300-1500", label: "R$ 300 a 1.500", max: 150000 },
  { id: "1500-5000", label: "R$ 1.500 a 5.000", max: 500000 },
  { id: "5000", label: "Acima de R$ 5.000", max: Infinity },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["id"];

export function bandOf(cents: number): PriceBand {
  return PRICE_BANDS.find((b) => cents < b.max)!.id;
}

/** Formatos de coleção: a parte flexível. O rótulo é dela, em primeira pessoa. */
export const FORMATS = {
  rotina: { label: "Minha rotina", hint: "Na ordem em que eu uso." },
  ocasiao: { label: "Pra uma ocasião", hint: "O que eu levaria." },
  uniforme: { label: "Meu uniforme", hint: "O que eu repito sem pensar." },
  recomprei: { label: "Recomprei", hint: "Acabou, comprei de novo." },
  tenho_ha_anos: { label: "Tenho há anos", hint: "Usei muito e continua aqui." },
  high_low: { label: "High low", hint: "O caro que eu uso e o que faz quase o mesmo. Testei os dois." },
  na_bolsa: { label: "Na minha bolsa", hint: "O que sai comigo todo dia." },
  presente: { label: "Pra dar de presente", hint: "O que eu já dei e deu certo." },
  livre: { label: "", hint: "" },
} as const;
export type Format = keyof typeof FORMATS;
