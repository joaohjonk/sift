import { db } from "@/lib/db";
import { creatorGifting } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { orderGift } from "../actions";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Flash, ProductImage, StatusPill } from "@/components/ui";

export default async function Gifting({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/gifting");
  const lbs = creatorGifting(db(), user.id);
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <h1>Gifting</h1>
      <p className="muted">Marcas mandam um lookbook e você escolhe o que quer testar.</p>
      <div className="stack">
        {lbs.map((lb) => (
          <div key={lb.id} className="card">
            <div className="row between">
              <h3>
                {lb.brand_name}: {lb.title}
              </h3>
              <StatusPill status={lb.my_status} />
            </div>
            <p className="small">{lb.message}</p>
            <div className="grid grid-products">
              {lb.items.map((p) => (
                <form key={p.id} action={orderGift} className="product">
                  <input type="hidden" name="lookbook_id" value={lb.id} />
                  <input type="hidden" name="product_id" value={p.id} />
                  <ProductImage product={p} />
                  <div className="title">{p.title}</div>
                  <div className="small muted">{formatMoney(p.price_cents)}</div>
                  {lb.my_status === "invited" && (
                    <button className="small" style={{ marginTop: 6 }}>
                      Quero este
                    </button>
                  )}
                </form>
              ))}
            </div>
          </div>
        ))}
        {!lbs.length && <p className="muted">Nenhum convite de gifting ainda.</p>}
      </div>
    </CreatorShell>
  );
}
