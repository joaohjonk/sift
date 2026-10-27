import { db } from "@/lib/db";
import { listContracts } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { respondContract, submitTask } from "../actions";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Flash, StatusPill } from "@/components/ui";

export default async function Collaborations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/collaborations");
  const contracts = listContracts(db(), { userId: user.id });
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <h1>Collaborations</h1>
      <p className="muted">Propostas das marcas com entregáveis, prazos e valores.</p>
      <div className="stack">
        {contracts.map((c) => (
          <div key={c.id} className="card">
            <div className="row between">
              <h3>
                {c.brand_name}: {c.title}
              </h3>
              <StatusPill status={c.status} />
            </div>
            {c.terms && <p className="small">{c.terms}</p>}
            <table>
              <thead>
                <tr>
                  <th>Entregável</th>
                  <th>Prazo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {c.tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.due_date ?? "sem data"}</td>
                    <td>{formatMoney(t.price_cents)}</td>
                    <td>
                      <StatusPill status={t.status} />
                    </td>
                    <td>
                      {c.status === "active" && t.status === "pending" && (
                        <form action={submitTask} className="row">
                          <input type="hidden" name="task_id" value={t.id} />
                          <input name="content_url" placeholder="Link do conteúdo" required style={{ width: 200 }} />
                          <button className="small">Enviar</button>
                        </form>
                      )}
                      {t.content_url && <span className="small muted">{t.content_url}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row between" style={{ marginTop: 10 }}>
              <strong>Total {formatMoney(c.total_cents)}</strong>
              {c.status === "proposed" && (
                <div className="row">
                  <form action={respondContract}>
                    <input type="hidden" name="contract_id" value={c.id} />
                    <input type="hidden" name="accept" value="1" />
                    <button className="small">Aceitar</button>
                  </form>
                  <form action={respondContract}>
                    <input type="hidden" name="contract_id" value={c.id} />
                    <input type="hidden" name="accept" value="0" />
                    <button className="small ghost">Recusar</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ))}
        {!contracts.length && <p className="muted">Nenhuma proposta ainda.</p>}
      </div>
    </CreatorShell>
  );
}
