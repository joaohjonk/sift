import { db } from "@/lib/db";
import { discoverCreators, listContracts } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { approveTask, createContract } from "../../actions";
import { formatMoney } from "@/lib/money";
import { BrandShell } from "@/components/shells";
import { Flash, StatusPill } from "@/components/ui";

export default async function BrandCollaborations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand/collaborations");
  const d = db();
  const contracts = listContracts(d, { brandId });
  const creators = discoverCreators(d, brandId);
  return (
    <BrandShell>
      <Flash sp={sp} />
      <h1>Collaborations</h1>
      <form action={createContract} className="card">
        <h3>Nova proposta</h3>
        <div className="grid split" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label>Criador</label>
            <select name="user_id" defaultValue={sp.user}>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Título</label>
            <input name="title" required />
          </div>
        </div>
        <div className="field">
          <label>Termos</label>
          <textarea name="terms" placeholder="Uso de imagem, exclusividade, prazos de aprovação" />
        </div>
        <label>Entregáveis</label>
        {[0, 1, 2].map((i) => (
          <div key={i} className="row" style={{ marginBottom: 6 }}>
            <input name="task_title" placeholder={`Entregável ${i + 1}`} style={{ flex: 2 }} required={i === 0} />
            <input name="task_price" type="number" min="0" step="50" placeholder="R$" style={{ flex: 1 }} />
            <input name="task_due" type="date" style={{ flex: 1 }} />
          </div>
        ))}
        <button>Enviar proposta</button>
      </form>
      <div className="stack section">
        {contracts.map((c) => (
          <div key={c.id} className="card">
            <div className="row between">
              <h3>
                {c.creator_name}: {c.title}
              </h3>
              <StatusPill status={c.status} />
            </div>
            <table>
              <tbody>
                {c.tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.due_date ?? "sem data"}</td>
                    <td>{formatMoney(t.price_cents)}</td>
                    <td>
                      <StatusPill status={t.status} />
                    </td>
                    <td className="small">{t.content_url}</td>
                    <td>
                      {t.status === "submitted" && (
                        <form action={approveTask}>
                          <input type="hidden" name="task_id" value={t.id} />
                          <button className="small">Aprovar</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small" style={{ marginTop: 8 }}>
              Total {formatMoney(c.total_cents)}
            </p>
          </div>
        ))}
      </div>
    </BrandShell>
  );
}
