import Link from "next/link";
import { db } from "@/lib/db";
import { listCircles, listCurators } from "@/lib/repo";
import { currentUser } from "@/lib/session";
import { createCircle } from "../../actions";
import { Avatar, Flash, TierBadge } from "@/components/ui";

export default async function Circles({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const d = db();
  const me = await currentUser();
  const editorial = listCircles(d);
  const mine = me ? listCircles(d, me.id) : [];
  const curators = listCurators(d);
  const Card = ({ g }: { g: (typeof editorial)[number] }) => (
    <Link href={`/shop/circles/${g.id}`} className="card" style={{ textDecoration: "none" }}>
      <h3>{g.name}</h3>
      {g.description && <p className="small muted">{g.description}</p>}
      <div className="avatars">
        {g.curators.map((c) => (
          <Avatar key={c.id} name={c.name} />
        ))}
      </div>
    </Link>
  );
  return (
    <>
      <Flash sp={sp} />
      <h1>Circles</h1>
      <p className="muted">Um circle junta curadores e mostra a loja combinada: o que mais aparece entre eles vem primeiro.</p>
      <h2 className="section">Editoriais</h2>
      <div className="grid grid-cards">
        {editorial.map((g) => (
          <Card key={g.id} g={g} />
        ))}
      </div>
      {me && (
        <>
          <h2 className="section">Meus circles</h2>
          <div className="grid grid-cards">
            {mine.map((g) => (
              <Card key={g.id} g={g} />
            ))}
            <form action={createCircle} className="card">
              <h3>Novo circle</h3>
              <div className="field">
                <input name="name" placeholder="Nome do circle" required />
              </div>
              {curators.map((c) => (
                <label key={c.id} className="check">
                  <input type="checkbox" name="curator_ids" value={c.id} /> {c.name} <TierBadge score={c.trust_score} />
                </label>
              ))}
              <button className="small" style={{ marginTop: 10 }}>
                Criar
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
