import { db } from "@/lib/db";
import { brandOpportunities, discoverCreators } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { createOpportunity, markOpportunityPaid } from "../../actions";
import { formatMoney } from "@/lib/money";
import { BrandShell } from "@/components/shells";
import { Flash, StatusPill, TierBadge } from "@/components/ui";

export default async function BrandOpportunities({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand/opportunities");
  const d = db();
  const opps = brandOpportunities(d, brandId);
  const creators = discoverCreators(d, brandId);
  return (
    <BrandShell>
      <Flash sp={sp} />
      <h1>Opportunities</h1>
      <form action={createOpportunity} className="card">
        <h3>Nova opportunity</h3>
        <div className="field">
          <label>Título</label>
          <input name="title" required />
        </div>
        <div className="field">
          <label>Brief</label>
          <textarea name="brief" required placeholder="O que você quer que o criador poste, onde e por quanto tempo" />
        </div>
        <div className="field">
          <label>Pagamento fixo por criador (R$). Deixe 0 para só comissão.</label>
          <input name="payment" type="number" min="0" step="50" defaultValue="0" style={{ maxWidth: 200 }} />
        </div>
        <label>Convidar</label>
        <div className="grid grid-cards" style={{ gap: 4, marginBottom: 12 }}>
          {creators.map((c) => (
            <label key={c.id} className="check">
              <input type="checkbox" name="invite_ids" value={c.id} /> {c.name} <TierBadge score={c.trust_score} />
            </label>
          ))}
        </div>
        <button>Enviar</button>
      </form>
      <div className="stack section">
        {opps.map((o) => (
          <div key={o.id} className="card">
            <div className="row between">
              <h3>{o.title}</h3>
              <span className="small muted">{o.payment_cents ? formatMoney(o.payment_cents) + " por criador" : "Só comissão"}</span>
            </div>
            <p className="small">{o.brief}</p>
            <table>
              <tbody>
                {o.members.map((m) => (
                  <tr key={m.user_id}>
                    <td>
                      {m.name} <TierBadge score={m.trust_score} />
                    </td>
                    <td>
                      <StatusPill status={m.status} />
                    </td>
                    <td className="small">{m.submission_url}</td>
                    <td>
                      {m.status === "submitted" && (
                        <form action={markOpportunityPaid}>
                          <input type="hidden" name="opportunity_id" value={o.id} />
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <button className="small">Aprovar e pagar</button>
                        </form>
                      )}
                    </td>
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
