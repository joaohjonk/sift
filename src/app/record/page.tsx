import Link from "next/link";
import { db } from "@/lib/db";
import { listDeals } from "@/lib/record";
import { requireUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Rec, Stat } from "@/components/ui";
import { DealSteps, SideTags, day } from "@/components/record-ui";

// Sift Record: a lista dos contratos. O que precisa dela vem primeiro.

export default async function RecordPage() {
  const user = await requireUser(["creator"], "/record");
  const deals = listDeals(db(), user.id);
  const open = deals.filter((d) => d.state !== "paid" && d.state !== "draft");
  const needs = deals.filter((d) => d.side.length);
  const paid = deals.filter((d) => d.state === "paid");
  const anyExample = deals.some((d) => d.example);

  return (
    <CreatorShell>
      <Rec className="quiet">Sift Record</Rec>
      <h1 style={{ marginTop: 16 }}>Cada contrato, do rascunho ao dinheiro na conta</h1>
      <p className="lead quiet">Vermelho é o que precisa de você. Nada sai em seu nome sem você segurar o quadrado.</p>

      <div className="grid grid-stats section" style={{ marginTop: 32 }}>
        <Stat label="A receber" value={formatMoney(open.reduce((a, d) => a + d.fee_cents, 0))} hint={`${open.length} ${open.length === 1 ? "contrato" : "contratos"} em aberto`} />
        <Stat label="Precisa de você" value={<span className={needs.length ? "red" : ""}>{needs.length}</span>} />
        <Stat label="Pago" value={formatMoney(paid.reduce((a, d) => a + d.fee_cents, 0))} hint={`${paid.length} ${paid.length === 1 ? "contrato" : "contratos"}`} />
      </div>

      {deals.length ? (
        <div className="table-scroll" style={{ marginTop: 48 }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Campanha</th>
                <th className="r">Valor</th>
                <th>Estado</th>
                <th>Recebe</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/record/${d.id}`}>{d.brand_name}</Link>
                  </td>
                  <td>
                    <Link href={`/record/${d.id}`}>{d.title}</Link>
                  </td>
                  <td className="r num">
                    {formatMoney(d.fee_cents)}
                    {d.example ? <span className="rec quiet"> ex.</span> : null}
                  </td>
                  <td>
                    <DealSteps state={d.state} />
                  </td>
                  <td className="num">{d.state === "paid" ? "Pago" : day(d.due_on) || "A combinar"}</td>
                  <td>
                    <SideTags side={d.side} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="section">
          <p className="lead">Nenhum contrato ainda.</p>
          <p className="quiet">Quando uma marca mandar uma proposta, ela entra aqui como Rascunho. A Sift lê o contrato e avisa o que não bate com o seu jeito de trabalhar.</p>
        </div>
      )}
      {anyExample && <p className="small quiet" style={{ marginTop: 16 }}>Valores marcados com ex. são exemplos de demonstração.</p>}
    </CreatorShell>
  );
}
