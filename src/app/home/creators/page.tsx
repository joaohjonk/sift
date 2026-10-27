import Link from "next/link";
import { TIERS } from "@/lib/tiers";
import { formatMoney } from "@/lib/money";

export default function ForCreators() {
  return (
    <>
      <section className="hero">
        <h1>Sua recomendação vale dinheiro.</h1>
        <p className="muted">
          Crie links de qualquer produto das lojas parceiras, monte sua vitrine e receba comissão por cada venda. Quanto mais as pessoas
          confiam em você, mais o app destrava.
        </p>
        <Link className="btn" href="/apply/creator">
          Quero entrar
        </Link>
      </section>
      <h2 className="section">Tiers por confiança</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Pontuação mínima</th>
              <th>Bônus</th>
              <th>Créditos de indicação</th>
              <th>O que libera</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.name}>
                <td>
                  <span className={`tier tier-${t.name}`}>{t.name}</span>
                </td>
                <td>{t.minScore}</td>
                <td>{t.bonusCents ? formatMoney(t.bonusCents) : "—"}</td>
                <td>{t.referralCredits || "—"}</td>
                <td>{t.perks.join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
