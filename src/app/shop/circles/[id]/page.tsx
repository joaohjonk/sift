import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCircle } from "@/lib/repo";
import { Avatar, ProductCard, TierBadge } from "@/components/ui";

export default async function Circle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getCircle(db(), Number(id));
  if (!g) notFound();
  return (
    <>
      <h1>{g.name}</h1>
      {g.description && <p className="muted">{g.description}</p>}
      <div className="row">
        {g.curators.map((c) => (
          <Link key={c.id} href={`/shop/${c.username}`} className="card row" style={{ textDecoration: "none", padding: 10 }}>
            <Avatar name={c.name} />
            <span>
              {c.name} <TierBadge score={c.trust_score} />
            </span>
          </Link>
        ))}
      </div>
      <h2 className="section">Loja combinada</h2>
      <div className="grid grid-products">
        {g.products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            note={
              p.in_circle > 1 ? <div className="proof">{p.in_circle} pessoas deste círculo guardaram</div> : null
            }
          />
        ))}
      </div>
    </>
  );
}
