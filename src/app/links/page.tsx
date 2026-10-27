import Link from "next/link";
import { db } from "@/lib/db";
import { listProducts, userCollections, userPins } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { createCollection, createPin, deletePin } from "../actions";
import { formatMoney, formatRate } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Flash } from "@/components/ui";

export default async function Links({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/links");
  const d = db();
  const pins = userPins(d, user.id);
  const collections = userCollections(d, user.id);
  const products = listProducts(d);
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <h1>Links e coleções</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <form action={createPin} className="card">
          <h3>Novo link</h3>
          <div className="field">
            <label>Produto</label>
            <select name="product_id" required>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · {p.brand_name} · {formatMoney(p.price_cents)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Coleção</label>
            <select name="collection_id">
              <option value="">Sem coleção</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nota (opcional)</label>
            <input name="note" placeholder="Por que você indica" />
          </div>
          <button>Criar link</button>
        </form>
        <form action={createCollection} className="card">
          <h3>Nova coleção</h3>
          <div className="field">
            <label>Nome</label>
            <input name="name" required />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select name="kind">
              <option value="shelf">Prateleira</option>
              <option value="look">Look</option>
              <option value="post">Post comprável</option>
              <option value="guide">Guia de presentes</option>
            </select>
          </div>
          <button>Criar coleção</button>
          <p className="small muted" style={{ marginTop: 10 }}>
            Sua vitrine pública: <Link href={`/shop/${user.username}`}>/shop/{user.username}</Link>
          </p>
        </form>
      </div>
      <h2 className="section">Seus links ({pins.length})</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Coleção</th>
              <th>Comissão</th>
              <th>Cliques (mês / total)</th>
              <th>Pedidos</th>
              <th>Ganho</th>
              <th>Link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pins.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.product.title}
                  <div className="small muted">{p.product.brand_name}</div>
                </td>
                <td>{collections.find((c) => c.id === p.collection_id)?.name ?? "—"}</td>
                <td>{formatRate(p.rate)}</td>
                <td>
                  {p.clicks_month} / {p.clicks_total}
                </td>
                <td>{p.orders}</td>
                <td>{formatMoney(p.commission_cents)}</td>
                <td>
                  <code className="small">/go/{p.id}</code>
                </td>
                <td>
                  <form action={deletePin} className="inline">
                    <input type="hidden" name="pin_id" value={p.id} />
                    <button className="ghost small">Remover</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CreatorShell>
  );
}
