import { db } from "@/lib/db";
import { earningsSummary, listPayouts, monthlyEarnings } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { requestPayout } from "../actions";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Flash, Stat, StatusPill } from "@/components/ui";

export default async function Payouts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/payouts");
  const d = db();
  const e = earningsSummary(d, user.id);
  const payouts = listPayouts(d, user.id);
  const months = monthlyEarnings(d, user.id);
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <h1>Ganhos</h1>
      <div className="grid grid-stats">
        <Stat label="Comissão pendente" value={formatMoney(e.commissionPending)} />
        <Stat label="Comissão liberada" value={formatMoney(e.commissionAvailable)} />
        <Stat label="Collaborations e opportunities" value={formatMoney(e.contractEarned + e.opportunityEarned)} />
        <Stat label="Já sacado" value={formatMoney(e.paidOut)} />
      </div>
      <form action={requestPayout} className="card section row between">
        <div>
          <h3>Disponível para saque: {formatMoney(e.available)}</h3>
          <p className="small muted">No ShopMy o pagamento é semanal, às sextas, por PayPal ou Stripe.</p>
        </div>
        <div className="row">
          <select name="method" style={{ width: 160 }}>
            <option value="pix">Pix</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Conta bancária</option>
          </select>
          <button disabled={e.available <= 0}>Sacar</button>
        </div>
      </form>
      <h2 className="section">Por mês</h2>
      <table>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Pedidos</th>
            <th>Vendas</th>
            <th>Comissão</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <td>{m.month}</td>
              <td>{m.orders}</td>
              <td>{formatMoney(m.sales_cents)}</td>
              <td>{formatMoney(m.commission_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="section">Saques</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Valor</th>
            <th>Método</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td>{p.created_at.slice(0, 10)}</td>
              <td>{formatMoney(p.amount_cents)}</td>
              <td>{p.method}</td>
              <td>
                <StatusPill status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CreatorShell>
  );
}
