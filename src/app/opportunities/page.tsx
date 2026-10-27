import { db } from "@/lib/db";
import { creatorOpportunities } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { respondOpportunity } from "../actions";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Flash, StatusPill } from "@/components/ui";

export default async function Opportunities({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/opportunities");
  const opps = creatorOpportunities(db(), user.id);
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <h1>Opportunities</h1>
      <p className="muted">A marca convida, você aceita, cria os links e envia o post para contar.</p>
      <div className="stack">
        {opps.map((o) => (
          <div key={o.id} className="card">
            <div className="row between">
              <h3>
                {o.brand_name}: {o.title}
              </h3>
              <StatusPill status={o.my_status} />
            </div>
            <p>{o.brief}</p>
            <p className="small muted">{o.payment_cents ? `Pagamento fixo de ${formatMoney(o.payment_cents)} + comissão` : "Só comissão"}</p>
            {o.my_status === "invited" && (
              <div className="row">
                <form action={respondOpportunity}>
                  <input type="hidden" name="opportunity_id" value={o.id} />
                  <input type="hidden" name="status" value="accepted" />
                  <button className="small">Aceitar</button>
                </form>
                <form action={respondOpportunity}>
                  <input type="hidden" name="opportunity_id" value={o.id} />
                  <input type="hidden" name="status" value="declined" />
                  <button className="small ghost">Recusar</button>
                </form>
              </div>
            )}
            {o.my_status === "accepted" && (
              <form action={respondOpportunity} className="row">
                <input type="hidden" name="opportunity_id" value={o.id} />
                <input type="hidden" name="status" value="submitted" />
                <input name="submission_url" placeholder="Link do post" required style={{ maxWidth: 360 }} />
                <button className="small">Enviar post</button>
              </form>
            )}
            {o.submission_url && <p className="small muted">Post enviado: {o.submission_url}</p>}
          </div>
        ))}
        {!opps.length && <p className="muted">Nenhum convite ainda.</p>}
      </div>
    </CreatorShell>
  );
}
