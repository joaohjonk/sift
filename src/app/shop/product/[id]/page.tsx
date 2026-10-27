import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProduct, productPromoters } from "@/lib/repo";
import { Avatar, ProductImage, TierBadge } from "@/components/ui";
import { formatCompact, formatMoney } from "@/lib/money";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const p = getProduct(d, Number(id));
  if (!p) notFound();
  const promoters = productPromoters(d, p.id);
  return (
    <div className="grid split" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 40 }}>
      <div className="product">
        <ProductImage product={p} />
      </div>
      <div>
        <div className="small muted">
          {p.industry} › {p.department} › {p.category}
        </div>
        <h1>{p.title}</h1>
        <p>
          {p.brand_name} · {formatMoney(p.price_cents)}
        </p>
        <p className="muted small">
          {formatCompact(p.clicks_month)} cliques este mês · {formatCompact(p.clicks_week)} esta semana · indicado por {p.num_promoters}{" "}
          curador{p.num_promoters === 1 ? "" : "es"}
        </p>
        <h3 className="section">Quem indica</h3>
        <div className="stack">
          {promoters.map((c) => (
            <div key={c.id} className="card row between">
              <Link href={`/shop/${c.username}`} className="row" style={{ textDecoration: "none" }}>
                <Avatar name={c.name} />
                <div>
                  <div>
                    {c.name} <TierBadge score={c.trust_score} />
                  </div>
                  <div className="small muted">{c.clicks_month} cliques pelo link dele(a) este mês</div>
                </div>
              </Link>
              <a className="btn small" href={`/go/${c.pin_id}`}>
                Comprar
              </a>
            </div>
          ))}
          {!promoters.length && <p className="muted">Ninguém indica este produto ainda.</p>}
        </div>
      </div>
    </div>
  );
}
