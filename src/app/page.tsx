import Link from "next/link";
import { db } from "@/lib/db";
import { listCurators, listProducts, listCircles } from "@/lib/repo";
import { Avatar, ProductCard, TierBadge } from "@/components/ui";
import { formatCompact } from "@/lib/money";

export default function Home() {
  const d = db();
  const curators = listCurators(d, 6);
  const trending = listProducts(d, { sort: "month" }).slice(0, 8);
  const circles = listCircles(d);
  return (
    <>
      <section className="hero">
        <h1>Curadoria de quem entende, não do algoritmo.</h1>
        <p className="muted">
          Compre o que dermatologistas, stylists e designers de interiores realmente usam. Cada produto mostra quem indica e quantas
          pessoas clicaram este mês.
        </p>
        <div className="row">
          <Link className="btn" href="/shop">
            Explorar a loja
          </Link>
          <Link className="btn ghost" href="/apply/creator">
            Sou criador
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="row between">
          <h2>Curadores</h2>
          <Link href="/shop" className="small">
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cards">
          {curators.map((c) => (
            <Link key={c.id} href={`/shop/${c.username}`} className="card row" style={{ textDecoration: "none" }}>
              <Avatar name={c.name} />
              <div>
                <div>
                  {c.name} <TierBadge score={c.trust_score} />
                </div>
                <div className="small muted">{c.bio}</div>
                <div className="small muted">
                  {formatCompact(c.followers)} seguidores · {c.num_pins} indicações
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Em alta este mês</h2>
        <div className="grid grid-products">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Circles</h2>
        <p className="muted">Junte curadores num grupo e veja a loja combinada deles.</p>
        <div className="grid grid-cards">
          {circles.map((g) => (
            <Link key={g.id} href={`/shop/circles/${g.id}`} className="card" style={{ textDecoration: "none" }}>
              <h3>{g.name}</h3>
              <p className="small muted">{g.description}</p>
              <div className="avatars">
                {g.curators.map((c) => (
                  <Avatar key={c.id} name={c.name} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
