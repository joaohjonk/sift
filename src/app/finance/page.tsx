import Link from "next/link";
import { db } from "@/lib/db";
import { advanceQuote, feeCompare, listDeals, receivables } from "@/lib/record";
import { requireUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Rec } from "@/components/ui";
import { day } from "@/components/record-ui";
import { HoldButton, QueuedAction } from "@/components/hold";

// Dinheiro: quanto entra, de quem e quando. Receber hoje com o custo à vista.

const RATE = 0.022;

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/finance");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const deals = listDeals(db(), user.id, now);
  const rec = receivables(deals, today);
  const upcoming = rec.filter((r) => !r.late);
  const late = rec.filter((r) => r.late);
  const total = upcoming.reduce((a, r) => a + r.amount_cents, 0);
  const pick = upcoming.find((r) => r.deal_id === Number(sp.receber)) ?? upcoming[upcoming.length - 1];
  const quote = pick ? advanceQuote(pick.amount_cents, pick.due_on, today, RATE) : null;
  const queued = pick ? deals.find((d) => d.id === pick.deal_id)?.actions.find((a) => a.kind === "advance_cash" && a.status !== "undone") : undefined;
  const cmp = feeCompare(total);

  // Linha do tempo em escala: hoje até o último vencimento.
  const end = upcoming.length ? Date.parse(upcoming[upcoming.length - 1].due_on) : Date.parse(today) + 90 * 864e5;
  const span = Math.max(1, end - Date.parse(today));
  const max = Math.max(1, ...upcoming.map((r) => r.amount_cents));

  return (
    <CreatorShell>
      <Rec className="quiet">Dinheiro</Rec>
      <h1 style={{ marginTop: 16 }}>Quanto entra, de quem e quando</h1>
      <p className="lead quiet">
        {formatMoney(total)} a receber de {upcoming.length} contratos.
        {late.length ? <span className="red"> {formatMoney(late.reduce((a, r) => a + r.amount_cents, 0))} atrasados.</span> : null}
      </p>

      {upcoming.length ? (
        <div className="money-line section" role="img" aria-label="Recebíveis por data, em escala">
          {upcoming.map((r) => (
            <Link
              key={r.deal_id}
              href={`/finance?receber=${r.deal_id}`}
              className={`tick ${pick?.deal_id === r.deal_id ? "on" : ""}`}
              style={{ left: `${((Date.parse(r.due_on) - Date.parse(today)) / span) * 92 + 4}%`, height: `${(r.amount_cents / max) * 70 + 10}%` }}
            >
              <span className="rec">
                {r.brand_name}
                <br />
                <span className="quiet">{day(r.due_on)}</span>
              </span>
            </Link>
          ))}
          <span className="today rec quiet">Hoje</span>
        </div>
      ) : (
        <p className="section quiet">Nada a receber agora. Quando um contrato for assinado, a data de pagamento aparece nesta linha.</p>
      )}

      {late.length > 0 && (
        <div className="need" style={{ marginTop: 32 }}>
          <Rec className="red">Atrasado · precisa de você</Rec>
          {late.map((r) => (
            <p key={r.deal_id} style={{ margin: "8px 0 0" }}>
              <Link href={`/record/${r.deal_id}`}>{r.brand_name}</Link>: {formatMoney(r.amount_cents)}, venceu em {day(r.due_on)}
            </p>
          ))}
        </div>
      )}

      <div className="grid12 section" style={{ rowGap: 40 }}>
        <div className="deal-fields">
          <h2>Receber hoje, com o custo à vista</h2>
          <p className="quiet">Escolha um recebível. A Sift mostra o valor hoje e quanto custa, em reais.</p>
          <div className="pick">
            {upcoming.map((r) => (
              <Link key={r.deal_id} href={`/finance?receber=${r.deal_id}`} className={pick?.deal_id === r.deal_id ? "on" : ""}>
                <span>
                  {r.brand_name} <span className="quiet">· {day(r.due_on)}</span>
                </span>
                <span className="num">{formatMoney(r.amount_cents)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="deal-act">
          {pick && quote && (
            <div className="wash">
              <Rec className="quiet">
                {pick.brand_name} paga {formatMoney(pick.amount_cents)} em {day(pick.due_on)}
              </Rec>
              <div className="d2 num" style={{ margin: "8px 0" }}>
                {formatMoney(quote.today_cents)} hoje
              </div>
              <p>
                Custo de {formatMoney(quote.cost_cents)}. São {quote.months.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} meses a{" "}
                {(RATE * 100).toLocaleString("pt-BR")}% ao mês.
              </p>
              <p className="rec quiet">Taxa de exemplo. O custo aparece antes, sempre em reais.</p>
              {queued?.status === "queued" ? (
                <QueuedAction id={queued.id} sendsAt={queued.sends_at} label={`${formatMoney(quote.today_cents)} na sua conta hoje`} back="/finance" />
              ) : queued?.status === "sent" ? (
                <p className="rec">Pedido de antecipação registrado</p>
              ) : (
                <HoldButton label="Segure para receber hoje" dealId={pick.deal_id} kind="advance_cash" back="/finance" />
              )}
            </div>
          )}
          <h3 style={{ marginTop: 40 }}>Agência e Sift sobre o mesmo valor</h3>
          <div className="grid grid-stats">
            <div className="stat">
              <div className="label">Agência, 30%</div>
              <div className="value">{formatMoney(cmp.agency_cents)}</div>
            </div>
            <div className="stat">
              <div className="label red">Sift, 10%</div>
              <div className="value">{formatMoney(cmp.sift_cents)}</div>
              <div className="small muted">{formatMoney(cmp.kept_cents)} ficam com você</div>
            </div>
          </div>
          <p className="small quiet" style={{ marginTop: 8 }}>
            Cenário sobre {formatMoney(total)} a receber.
          </p>
        </div>
      </div>
    </CreatorShell>
  );
}
