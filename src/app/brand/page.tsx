import Link from "next/link";
import { db } from "@/lib/db";
import { brandAnalytics, getBrand } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { BrandShell } from "@/components/shells";
import { Avatar, Flash, Stat, TierBadge } from "@/components/ui";

// Track: o que os criadores estão gerando para a marca.
export default async function BrandTrack({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand");
  const d = db();
  const brand = getBrand(d, brandId)!;
  const a = brandAnalytics(d, brandId);
  return (
    <BrandShell>
      <Flash sp={sp} />
      {!brand.onboarded_at && (
        <div className="flash error">
          A integração da loja não está completa, então pedidos não estão sendo atribuídos. <Link href="/brand/onboarding">Concluir agora</Link>
        </div>
      )}
      <h1>{brand.name}</h1>
      <div className="grid grid-stats">
        <Stat label="Cliques (30 dias)" value={a.clicks30} />
        <Stat label="Pedidos" value={a.orders} />
        <Stat label="Receita atribuída" value={formatMoney(a.revenue)} />
        <Stat label="Comissão devida" value={formatMoney(a.commission)} />
        <Stat label="Icon promoters" value={a.byTier.Icon} />
        <Stat label="Trendsetter promoters" value={a.byTier.Trendsetter} />
      </div>
      <h2 className="section">Criadores que indicam você</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Criador</th>
              <th>Tier</th>
              <th>Links</th>
              <th>Cliques (mês)</th>
              <th>Receita</th>
            </tr>
          </thead>
          <tbody>
            {a.promoters.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/shop/${p.username}`} className="row" style={{ textDecoration: "none" }}>
                    <Avatar name={p.name} /> {p.name}
                  </Link>
                </td>
                <td>
                  <TierBadge score={p.trust_score} />
                </td>
                <td>{p.pins}</td>
                <td>{p.clicks_month}</td>
                <td>{formatMoney(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="section">Produtos</h2>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Curadores</th>
            <th>Cliques (semana / mês / total)</th>
          </tr>
        </thead>
        <tbody>
          {a.products.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.num_promoters}</td>
              <td>
                {p.clicks_week} / {p.clicks_month} / {p.clicks_total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </BrandShell>
  );
}
