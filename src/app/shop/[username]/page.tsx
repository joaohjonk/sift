import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isFollowing } from "@/lib/repo";
import { siftPage } from "@/lib/page";
import { FORMATS } from "@/lib/taxonomy";
import { currentUser } from "@/lib/session";
import { toggleFollow } from "../../actions";
import { Flash, Piece, Rec, recDate } from "@/components/ui";
import { CopyLink, ShareButton } from "@/components/share";

// A Sift Page. Fala sempre em primeira pessoa: é o perfil dela, assinado por ela (JJ, 28 out).
// Como numa galeria: mostra só o que ficou. O que saiu nunca aparece na página pública (JJ, 28 out); fica no registro privado dela.

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
  const page = siftPage(d, username);
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
        <div className="ratio settle d1s" aria-label={`${page.kept_count} peças que eu uso de verdade`}>
          <Rec className="quiet">Peças que eu uso de verdade</Rec>
          <div className="d1 num">{page.kept_count}</div>
          <p className="quiet" style={{ margin: "8px 0 0" }}>Todas tiradas dos meus posts.</p>
        </div>
      </section>

      {page.favourites.length > 0 && (
        <section className="section" aria-labelledby="as-quatro">
          <div className="grid12 edit-head">
            <div className="c-label">
              <Rec>
                <span id="as-quatro">Minhas quatro</span>
              </Rec>
            </div>
            <div className="c-body">
              <p className="quiet" style={{ margin: 0 }}>
                Se eu só pudesse ficar com quatro, seriam estas.
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
              text={`As peças que ${handle} usa de verdade, na Sift.`}
              path={path}
              label="Compartilhar minhas quatro"
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
        return (
          <section key={s.id} className="section edit" aria-label={s.title}>
            <div className="grid12 edit-head">
              <div className="c-label">
                <Rec>
                  {String(n + 1).padStart(2, "0")} · {s.kept.length} {s.kept.length === 1 ? "peça" : "peças"}
                </Rec>
                {s.quote_source && <Rec className="quiet">{s.quote_source}</Rec>}
              </div>
              <div className="c-body">
                <p className="quote">
                  <Link href={`${path}/${s.id}`}>“{s.title}”</Link>
                </p>
                <p className="small" style={{ margin: "12px 0 0" }}>
                  <Link href={`${path}/${s.id}`}>{FORMATS[s.format]?.label || "Ver a coleção"}</Link>
                </p>
              </div>
            </div>
            <div className="six">
              {s.kept.map((p, i) => (
                <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
              ))}
            </div>
          </section>
        );
      })}

      {!page.sections.length && (
        <section className="section edit">
          <p className="lead">Ainda não guardei nada aqui.</p>
          <p className="quiet">Quando eu der um sift no primeiro post, o que eu guardar aparece aqui.</p>
        </section>
      )}

      <footer className="record-foot rec">
        <span>Sift Page · {handle}</span>
        <span>
          Cada relação comercial à vista: orgânico, recebido, afiliado, publi
        </span>
      </footer>
      <p className="small quiet" style={{ marginTop: 16 }}>
        As imagens dos produtos pertencem às marcas. <Link href="/shop">Ver todas as peças</Link>
      </p>
    </>
  );
}
