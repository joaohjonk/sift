import Link from "next/link";
import { db } from "@/lib/db";
import { creatorSummary, trustedByCount } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { nextTier, tierFor } from "@/lib/tiers";
import { formatMoney } from "@/lib/money";
import { CreatorShell } from "@/components/shells";
import { Bars, Flash, Stat, TierBadge } from "@/components/ui";

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator"], "/dashboard");
  if (user.status !== "active") {
    return (
      <div style={{ maxWidth: 560 }}>
        <Flash sp={sp} />
        <h1>Você está na lista de espera</h1>
        <p className="muted">
          Recebemos sua candidatura, @{user.username}. Assim que for aprovada, você poderá criar links, montar a vitrine e receber
          convites de marcas.
        </p>
      </div>
    );
  }
  const d = db();
  const s = creatorSummary(d, user.id);
  const tier = tierFor(user.trust_score);
  const next = nextTier(user.trust_score);
  const days: number[] = [];
  const byDay = new Map(s.daily.map((r) => [r.day, r.clicks]));
  for (let i = 29; i >= 0; i--) days.push(byDay.get(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)) ?? 0);
  return (
    <CreatorShell>
      <Flash sp={sp} />
      <div className="row between">
        <h1>Olá, {user.name.split(" ")[0]}</h1>
        <Link className="btn" href="/links">
          Criar link
        </Link>
      </div>
      <div className="grid grid-stats">
        <Stat label="Cliques (30 dias)" value={s.clicks30} />
        <Stat label="Pedidos (30 dias)" value={s.orders30} hint={`${(s.conversion * 100).toFixed(1)}% de conversão`} />
        <Stat label="Comissão pendente" value={formatMoney(s.commissionPending)} hint="Libera após a janela de devolução" />
        <Stat label="Disponível para saque" value={formatMoney(s.available)} />
      </div>
      <div className="card section">
        <h3>Cliques por dia</h3>
        <Bars values={days} />
      </div>
      <div className="card section">
        <div className="row between">
          <h3>
            Seu tier: <TierBadge score={user.trust_score} />
          </h3>
          <span className="muted small">
            Pontuação {user.trust_score}/100 · confiado por {trustedByCount(d, user.id)}
          </span>
        </div>
        <div className="progress" style={{ margin: "10px 0" }}>
          <div style={{ width: `${user.trust_score}%` }} />
        </div>
        <p className="small">
          {next
            ? `Faltam ${next.pointsNeeded} pontos para ${next.tier.name}: ${next.tier.perks.join(", ").toLowerCase()}.`
            : "Você está no tier mais alto."}
        </p>
        <p className="small muted">Liberado agora: {tier.perks.join(" · ")}</p>
      </div>
    </CreatorShell>
  );
}
