// Tiers do criador por pontuação de confiança, como no ShopMy.
// Fonte: relatório de engenharia reversa (tabela "Tiers por confiança").

export type TierName = "Icon" | "Trendsetter" | "Ambassador" | "Enthusiast";

export interface Tier {
  name: TierName;
  minScore: number;
  bonusCents: number;
  referralCredits: number;
  perks: string[];
  canChatBrands: boolean;
  canRequestGifting: boolean;
}

export const TIERS: Tier[] = [
  {
    name: "Icon",
    minScore: 85,
    bonusCents: 100_00,
    referralCredits: 8,
    perks: ["Recomendação prioritária às marcas", "Tudo do Trendsetter"],
    canChatBrands: true,
    canRequestGifting: true,
  },
  {
    name: "Trendsetter",
    minScore: 70,
    bonusCents: 50_00,
    referralCredits: 4,
    perks: ["Iniciar chat com marcas", "Pedir gifting e códigos", "Prioridade em Opportunities"],
    canChatBrands: true,
    canRequestGifting: true,
  },
  {
    name: "Ambassador",
    minScore: 30,
    bonusCents: 10_00,
    referralCredits: 1,
    perks: ["Mais visibilidade na busca das marcas"],
    canChatBrands: false,
    canRequestGifting: false,
  },
  {
    name: "Enthusiast",
    minScore: 0,
    bonusCents: 0,
    referralCredits: 0,
    perks: ["Vitrine", "Links comissionados em qualquer loja parceira"],
    canChatBrands: false,
    canRequestGifting: false,
  },
];

export function tierFor(score: number): Tier {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return TIERS.find((t) => s >= t.minScore)!;
}

/** Próximo tier e quantos pontos faltam; null se já está no topo. */
export function nextTier(score: number): { tier: Tier; pointsNeeded: number } | null {
  const current = tierFor(score);
  const idx = TIERS.indexOf(current);
  if (idx === 0) return null;
  const tier = TIERS[idx - 1];
  return { tier, pointsNeeded: tier.minScore - Math.round(score) };
}
