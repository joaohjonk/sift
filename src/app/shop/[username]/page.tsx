import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isFollowing } from "@/lib/repo";
import { MARKET_LABEL, parseMarket, siftPage, type Market } from "@/lib/page";
import { currentUser } from "@/lib/session";
import { toggleFollow } from "../../actions";
import { Flash, OutBox, Piece, Rec, recDate } from "@/components/ui";
import { CopyLink, ShareButton } from "@/components/share";

// A Sift Page. Mostrar poucos, contar muitos; o que saiu fica no registro.

export default async function SiftPageView({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const d = db();
  const market = parseMarket(sp.onde);
  const en = sp.lang === "en";
  const page = siftPage(d, username, { market });
  if (!page) notFound();
  const me = await currentUser();
  const following = me ? isFollowing(d, me.id, page.user.id) : false;
  const path = `/shop/${username}`;
  const handle = page.user.name.startsWith("@") ? page.user.name : page.user.name;
  const since = recDate(page.user.created_at);

  return (
    <>
      <Flash sp={sp} />

      <section className="sp-head">
        <div className="who-is settle">
          <Rec className="quiet">Sift Page{since ? ` · no registro desde ${since}` : ""}</Rec>
          <h1 style={{ marginTop: 16 }}>{handle}</h1>
          <p className="lead it" style={{ marginBottom: 0 }}>
            {page.user.line ?? page.user.bio}
          </p>
        </div>
        <div className="ratio settle d1s" aria-label={`Ficaram ${page.kept_count} de ${page.seen_count}`}>
          <Rec className="quiet">Ficaram</Rec>
          <div className="d1 num">{page.kept_count}</div>
          <div className="of num">de {page.seen_count}</div>
        </div>
      </section>

      <nav className="tabs market-tabs" aria-label={en ? "Where to buy" : "Onde comprar"}>
        {([null, "br", "abroad"] as (Market | null)[]).map((m) => {
          const q = new URLSearchParams();
          if (m) q.set("onde", m);
          if (en) q.set("lang", "en");
          const label = m ? MARKET_LABEL[m][en ? "en" : "pt"] : en ? "All" : "Tudo";
          return (
            <Link key={m ?? "all"} href={`${path}${q.size ? `?${q}` : ""}`} className={market === m ? "active" : ""} aria-current={market === m ? "page" : undefined}>
              {label} <span className="num quiet">{page.market_counts[m ?? "all"]}</span>
            </Link>
          );
        })}
        <Link className="lang" href={`${path}?${new URLSearchParams({ ...(market ? { onde: market } : {}), ...(en ? {} : { lang: "en" }) })}`}>
          {en ? "PT" : "EN"}
        </Link>
      </nav>
      {market && (
        <p className="small quiet market-note">
          {market === "abroad"
            ? en
              ? "Pieces that only ship abroad. For each one, Sift looks for a Similar that ships in Brazil, and she approves it first."
              : "Peças que só entregam lá fora. Para cada uma, a Sift procura um Parecido que entrega no Brasil, e ela aprova antes de aparecer."
            : en
              ? "Pieces sold in Brazil. Commission never changes the order."
              : "Peças com loja no Brasil. A comissão nunca muda a ordem."}
        </p>
      )}

      {!market && page.favourites.length > 0 && (
        <section className="section" aria-labelledby="as-quatro">
          <div className="grid12 edit-head">
            <div className="c-label">
              <Rec>
                <span id="as-quatro">As quatro</span>
              </Rec>
            </div>
            <div className="c-body">
              <p className="quiet" style={{ margin: 0 }}>
                Se só desse para ficar com quatro.
              </p>
            </div>
          </div>
          <div className="four">
            {page.favourites.map((p, i) => (
              <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
            ))}
          </div>
          <div className="row" style={{ marginTop: 32 }}>
            <ShareButton
              title={`As quatro de ${handle}`}
              text={`${handle} na Sift. Ficaram ${page.kept_count} de ${page.seen_count}.`}
              path={path}
              label="Compartilhar as quatro"
            />
            <CopyLink path={path} />
            {me && me.id !== page.user.id && (
              <form action={toggleFollow}>
                <input type="hidden" name="curator_id" value={page.user.id} />
                <input type="hidden" name="back" value={path} />
                <button className="ghost">{following ? "Acompanhando" : "Acompanhar esta página"}</button>
              </form>
            )}
          </div>
        </section>
      )}

      {page.sections.map((s, n) => {
        const total = s.kept.length + s.left_out.length;
        return (
          <section key={s.id} className="section edit" aria-label={s.title}>
            <div className="grid12 edit-head">
              <div className="c-label">
                <Rec>
                  {String(n + 1).padStart(2, "0")} · Ficaram {s.kept.length} de {total}
                </Rec>
                {s.quote_source && <Rec className="quiet">{s.quote_source}</Rec>}
              </div>
              <div className="c-body">
                <p className="quote">“{s.title}”</p>
              </div>
            </div>
            <div className="six">
              {s.kept.map((p, i) => (
                <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
              ))}
            </div>
            {s.left_out.length > 0 && (
              <div className="grid12" style={{ marginTop: 40 }}>
                <div className="c-label">
                  <Rec className="quiet">De fora, {s.left_out.length}</Rec>
                  <p className="small quiet" style={{ marginTop: 8 }}>
                    Apareceu, ela olhou e não ficou. Continua no registro.
                  </p>
                </div>
                <div className="c-body">
                  <div className="left-out">
                    {s.left_out.slice(0, 6).map((p) => (
                      <OutBox key={p.pin_id} piece={p} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {!page.sections.length && (
        <section className="section edit">
          <p className="lead">Nada guardado ainda.</p>
          <p className="quiet">Quando ela der um sift no primeiro post, as peças que ficarem aparecem aqui.</p>
        </section>
      )}

      <footer className="record-foot rec">
        <span>Sift Page · {handle}</span>
        <span>
          Cada relação comercial à vista: orgânico, recebido, afiliado, publi
        </span>
        <span>Nada se apaga</span>
      </footer>
      <p className="small quiet" style={{ marginTop: 16 }}>
        As imagens dos produtos pertencem às marcas. <Link href="/shop">Ver todas as peças</Link>
      </p>
    </>
  );
}
