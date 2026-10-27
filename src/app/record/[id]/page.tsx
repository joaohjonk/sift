import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ACTION_LABEL, MAX_TERMS_DAYS, SIDE_LABEL, getDeal, suggestedAction, type ActionKind } from "@/lib/record";
import { requireUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Rec } from "@/components/ui";
import { DealSteps, day } from "@/components/record-ui";
import { HoldButton, QueuedAction } from "@/components/hold";

// Um contrato: os campos, as entregas conferidas e o que a Sift faz por ela.

const SIDE_TEXT = {
  late: "O prazo passou e o dinheiro não entrou. A Sift cobra com o contrato e a prova de entrega na mão, e você não aparece na conversa.",
  conflict: `O contrato pede mais dias para pagar do que você aceita. Seu máximo é ${MAX_TERMS_DAYS} dias.`,
  rights_ending: "O uso de imagem acaba em menos de duas semanas. Se a marca continuar usando, a Sift avisa e propõe renovar.",
  needs_her: "Uma entrega marca a marca sem aviso de publi. Foi presente ou faz parte do contrato? A resposta protege você no CONAR.",
} as const;

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = `/record/${id}`;
  const user = await requireUser(["creator"], back);
  const deal = getDeal(db(), user.id, Number(id));
  if (!deal) notFound();
  const suggested = suggestedAction(deal.side);
  const clause: ActionKind | null = !suggested && (deal.state === "signed" || deal.state === "live" || deal.state === "draft") ? "propose_clause" : null;
  const kind = suggested ?? clause;
  const last = kind ? deal.actions.find((a) => a.kind === kind && a.status !== "undone") : undefined;

  return (
    <CreatorShell>
      <Rec className="quiet">
        <Link href="/record">Sift Record</Link> · {deal.brand_name}
      </Rec>
      <h1 style={{ marginTop: 16 }}>{deal.title}</h1>
      <DealSteps state={deal.state} wide />

      <div className="grid12 section" style={{ marginTop: 48, rowGap: 32 }}>
        <div className="deal-fields">
          <dl className="kv">
            <dt>Valor</dt>
            <dd className="num">
              {formatMoney(deal.fee_cents)} {deal.example ? <span className="rec quiet">exemplo</span> : null}
            </dd>
            <dt>Assinado</dt>
            <dd className="num">{day(deal.signed_on) || "Ainda não"}</dd>
            <dt>Prazo</dt>
            <dd>
              {deal.pay_terms_days ? `${deal.pay_terms_days} dias` : "Sem prazo no contrato"}
              {deal.side.includes("conflict") && <span className="red"> · acima dos seus {MAX_TERMS_DAYS}</span>}
            </dd>
            <dt>Recebe</dt>
            <dd className="num">{deal.state === "paid" ? "Pago" : day(deal.due_on) || "A combinar"}</dd>
            <dt>Uso de imagem</dt>
            <dd className="num">{deal.rights_until ? `Até ${day(deal.rights_until)}` : "Sem uso de imagem"}</dd>
            <dt>Entregas</dt>
            <dd>
              {deal.posts.length ? (
                <ul className="plain">
                  {deal.posts.map((p) => (
                    <li key={p.id}>
                      <span className="num">{day(p.posted_on)}</span> ·{" "}
                      {p.disclosed ? <span>Aviso de publi presente</span> : <span className="red">Sem aviso de publi</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                "Nenhuma ainda"
              )}
            </dd>
          </dl>
        </div>

        <div className="deal-act">
          {deal.side.map((s) => (
            <div key={s} className="need">
              <Rec className="red">{SIDE_LABEL[s]} · precisa de você</Rec>
              <p>{SIDE_TEXT[s]}</p>
            </div>
          ))}
          {clause && (
            <div className="need calm">
              <Rec>Proposta para este contrato</Rec>
              <p>A marca entra a partir do quarto segundo. Nos três primeiros, você conduz a história.</p>
              <div className="wash small">
                Cláusula de narrativa escalonada. Em troca, a criadora entrega o relatório de retenção do vídeo em 7 dias. A Sift anexa o seu dado: alcance mediano dos posts com publi e sem publi.
              </div>
            </div>
          )}
          {kind && (
            <div style={{ marginTop: 24 }}>
              {last?.status === "queued" ? (
                <QueuedAction id={last.id} sendsAt={last.sends_at} label="Pronto para sair em seu nome" back={back} />
              ) : last?.status === "sent" ? (
                <p className="rec">Saiu · {ACTION_LABEL[kind].done}</p>
              ) : (
                <HoldButton label={ACTION_LABEL[kind].hold} dealId={deal.id} kind={kind} back={back} />
              )}
            </div>
          )}
          {!deal.side.length && !clause && (
            <div className="need calm">
              <Rec>Nada precisa de você</Rec>
              <p className="quiet">{deal.state === "paid" ? "Pago e conciliado." : "A Sift acompanha. Você só é chamada se algo mudar."}</p>
            </div>
          )}
        </div>
      </div>
    </CreatorShell>
  );
}
