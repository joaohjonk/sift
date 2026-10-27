export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

/** Comissão de um pedido: taxa personalizada da marca para o criador ou a padrão. */
export function commissionFor(amountCents: number, rate: number): number {
  return Math.round(amountCents * rate);
}
