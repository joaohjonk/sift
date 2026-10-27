import Link from "next/link";
import { db } from "@/lib/db";
import { catalogHierarchy, discoverCreators, rateFor } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { setCustomRate } from "../../actions";
import { formatCompact, formatMoney, formatRate } from "@/lib/money";
import { BrandShell } from "@/components/shells";
import { Avatar, Flash, TierBadge } from "@/components/ui";

export default async function Discover({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand/discover");
  const d = db();
  const departments = [...new Set(catalogHierarchy(d).map((c) => c.department))];
  const creators = discoverCreators(d, brandId, {
    q: sp.q,
    minFollowers: Number(sp.min_followers) || undefined,
    minScore: Number(sp.min_score) || undefined,
    department: sp.department,
  });
  return (
    <BrandShell>
      <Flash sp={sp} />
      <h1>Discover</h1>
      <form className="card row" action="/brand/discover">
        <input name="q" placeholder="Nome, bio ou cidade (ex.: Rio de Janeiro)" defaultValue={sp.q} style={{ flex: 2, minWidth: 200 }} />
        <select name="department" defaultValue={sp.department ?? ""} style={{ flex: 1, minWidth: 140 }}>
          <option value="">Qualquer categoria</option>
          {departments.map((dep) => (
            <option key={dep}>{dep}</option>
          ))}
        </select>
        <select name="min_score" defaultValue={sp.min_score ?? ""} style={{ flex: 1, minWidth: 140 }}>
          <option value="">Qualquer tier</option>
          <option value="30">Ambassador ou mais</option>
          <option value="70">Trendsetter ou mais</option>
          <option value="85">Só Icon</option>
        </select>
        <input name="min_followers" type="number" placeholder="Seguidores mín." defaultValue={sp.min_followers} style={{ flex: 1, minWidth: 120 }} />
        <button>Buscar</button>
      </form>
      <p className="small muted">{creators.length} criadores</p>
      <div className="stack">
        {creators.map((c) => (
          <div key={c.id} className="card row between">
            <div className="row" style={{ flex: 1, minWidth: 260 }}>
              <Avatar name={c.name} />
              <div>
                <Link href={`/shop/${c.username}`}>{c.name}</Link> <TierBadge score={c.trust_score} />
                <div className="small muted">
                  {c.bio} · {c.location}
                </div>
                <div className="small muted">
                  {formatCompact(c.followers)} seguidores · {formatMoney(c.total_sales)} em vendas · {c.departments ?? "sem links"}
                  {c.brand_pins ? ` · já indica ${c.brand_pins} produto(s) seu(s)` : ""}
                </div>
              </div>
            </div>
            <div className="row">
              <form action={setCustomRate} className="row">
                <input type="hidden" name="user_id" value={c.id} />
                <input
                  name="rate"
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  defaultValue={Math.round(rateFor(d, brandId, c.id) * 1000) / 10}
                  style={{ width: 80 }}
                  aria-label="Comissão em %"
                />
                <button className="small ghost">Taxa {formatRate(rateFor(d, brandId, c.id))}</button>
              </form>
              <Link className="btn small ghost" href={`/chat?user=${c.id}`}>
                Conversar
              </Link>
              <Link className="btn small" href={`/brand/collaborations?user=${c.id}`}>
                Propor collaboration
              </Link>
            </div>
          </div>
        ))}
      </div>
    </BrandShell>
  );
}
