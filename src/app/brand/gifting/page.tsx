import { db } from "@/lib/db";
import { brandLookbooks, discoverCreators, listProducts } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { createLookbook } from "../../actions";
import { BrandShell } from "@/components/shells";
import { Flash, StatusPill, TierBadge } from "@/components/ui";

export default async function BrandGifting({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand/gifting");
  const d = db();
  const lookbooks = brandLookbooks(d, brandId);
  const products = listProducts(d, { brandId });
  const creators = discoverCreators(d, brandId);
  return (
    <BrandShell>
      <Flash sp={sp} />
      <h1>Gifting</h1>
      <p className="muted">Monte um lookbook, convide criadores de uma vez e o pedido cai na sua loja.</p>
      <form action={createLookbook} className="card">
        <h3>Novo lookbook</h3>
        <div className="field">
          <label>Título</label>
          <input name="title" required />
        </div>
        <div className="field">
          <label>Mensagem</label>
          <input name="message" />
        </div>
        <label>Produtos</label>
        {products.map((p) => (
          <label key={p.id} className="check">
            <input type="checkbox" name="product_ids" value={p.id} /> {p.title}
          </label>
        ))}
        <label style={{ marginTop: 12 }}>Convidar</label>
        <div className="grid grid-cards" style={{ gap: 4, marginBottom: 12 }}>
          {creators.map((c) => (
            <label key={c.id} className="check">
              <input type="checkbox" name="invite_ids" value={c.id} /> {c.name} <TierBadge score={c.trust_score} />
            </label>
          ))}
        </div>
        <button>Criar e convidar</button>
      </form>
      <div className="stack section">
        {lookbooks.map((lb) => (
          <div key={lb.id} className="card">
            <h3>{lb.title}</h3>
            <p className="small muted">{lb.items.map((i) => i.title).join(" · ")}</p>
            <table>
              <tbody>
                {lb.invites.map((i) => (
                  <tr key={i.user_id}>
                    <td>{i.name}</td>
                    <td>
                      <StatusPill status={i.status} />
                    </td>
                    <td className="small">{i.product_title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </BrandShell>
  );
}
