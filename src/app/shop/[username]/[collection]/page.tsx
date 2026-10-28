import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { siftPage, type PagePiece } from "@/lib/page";
import { FORMATS, PRICE_BANDS, bandOf } from "@/lib/taxonomy";
import { Piece, Rec } from "@/components/ui";
import { CopyLink, ShareButton } from "@/components/share";

// Uma coleção da Sift Page. Ajuda a comprar: filtro fixo (categoria, preço, exato) em cima do formato dela.
// Primeira pessoa sempre. Só o que ficou; o que saiu nunca aparece aqui (JJ, 28 out).

type SP = Record<string, string | undefined>;

const brl = (cents: number) => `R$ ${Math.round(cents / 100).toLocaleString("pt-BR")}`;

export default async function CollectionView({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; collection: string }>;
  searchParams: Promise<SP>;
}) {
  const { username, collection } = await params;
  const sp = await searchParams;
  const page = siftPage(db(), username);
  const section = page?.sections.find((s) => String(s.id) === collection);
  if (!page || !section || !section.all_kept.length) notFound();

  const handle = page.user.name;
  const path = `/shop/${username}/${section.id}`;
  const fmt = FORMATS[section.format] ?? FORMATS.livre;
  const all = section.all_kept;

  const filtered = all.filter(
    (p) =>
      (!sp.cat || p.category === sp.cat) &&
      (!sp.preco || bandOf(p.price_cents) === sp.preco) &&
      (!sp.match || p.match === sp.match),
  );
  const filtering = Boolean(sp.cat || sp.preco || sp.match);

  const qs = (patch: SP) => {
    const next = { ...sp, ...patch };
    const q = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return q ? `${path}?${q}` : path;
  };
  const count = (pred: (p: PagePiece) => boolean) => all.filter(pred).length;
  const cats = [...new Set(all.map((p) => p.category))];
  const bands = PRICE_BANDS.filter((b) => all.some((p) => bandOf(p.price_cents) === b.id));
  const hasSimilar = all.some((p) => p.match === "similar");

  return (
    <>
      <p className="small" style={{ margin: "0 0 32px" }}>
        <Link href={`/shop/${username}`}>{handle}</Link>
      </p>

      <section className="grid12 edit-head settle">
        <div className="c-label">
          <Rec>
            {fmt.label ? `${fmt.label} · ` : ""}
            {all.length} {all.length === 1 ? "peça" : "peças"}
          </Rec>
          {section.quote_source && <Rec className="quiet">{section.quote_source}</Rec>}
        </div>
        <div className="c-body">
          <h1 className="it" style={{ marginBottom: 12 }}>
            “{section.title}”
          </h1>
          {fmt.hint && <p className="lead quiet" style={{ margin: 0 }}>{fmt.hint}</p>}
        </div>
      </section>

      {all.length > 2 && (
        <nav className="filters" aria-label="Filtrar esta coleção">
          {cats.length > 1 && (
            <div className="line">
              <span className="rec">O quê</span>
              <Link className={!sp.cat ? "on" : ""} href={qs({ cat: undefined })}>
                Tudo {all.length}
              </Link>
              {cats.map((c) => (
                <Link key={c} className={sp.cat === c ? "on" : ""} href={qs({ cat: sp.cat === c ? undefined : c })}>
                  {c} {count((p) => p.category === c)}
                </Link>
              ))}
            </div>
          )}
          {bands.length > 1 && (
            <div className="line">
              <span className="rec">Preço</span>
              {bands.map((b) => (
                <Link key={b.id} className={sp.preco === b.id ? "on" : ""} href={qs({ preco: sp.preco === b.id ? undefined : b.id })}>
                  {b.label}
                </Link>
              ))}
            </div>
          )}
          {hasSimilar && (
            <div className="line">
              <span className="rec">Da foto</span>
              <Link className={sp.match === "exact" ? "on" : ""} href={qs({ match: sp.match === "exact" ? undefined : "exact" })}>
                Só a peça exata
              </Link>
              <Link className={sp.match === "similar" ? "on" : ""} href={qs({ match: sp.match === "similar" ? undefined : "similar" })}>
                Parecidas
              </Link>
            </div>
          )}
        </nav>
      )}

      {filtering ? (
        <Grid pieces={filtered} clear={path} />
      ) : section.format === "rotina" ? (
        <Routine pieces={all} />
      ) : section.format === "high_low" ? (
        <HighLow pieces={all} />
      ) : (
        <Grid pieces={all} clear={path} />
      )}

      <div className="row" style={{ marginTop: 48 }}>
        <ShareButton
          title={`“${section.title}”, de ${handle}`}
          text={`“${section.title}”: as peças que ${handle} usa, na Sift.`}
          path={path}
          label="Compartilhar esta coleção"
        />
        <CopyLink path={path} />
      </div>

      <footer className="record-foot rec">
        <span>
          Sift Page · {handle} · {section.title}
        </span>
        <span>Cada relação comercial à vista: orgânico, recebido, afiliado, publi</span>
      </footer>
    </>
  );
}

function Grid({ pieces, clear }: { pieces: PagePiece[]; clear: string }) {
  if (!pieces.length)
    return (
      <section className="section">
        <p className="lead">Nada com esse filtro aqui.</p>
        <Link href={clear}>Ver a coleção inteira</Link>
      </section>
    );
  return (
    <div className="six">
      {pieces.map((p, i) => (
        <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
      ))}
    </div>
  );
}

/** Rotina: na ordem em que eu uso, com o total no fim. */
function Routine({ pieces }: { pieces: PagePiece[] }) {
  const steps = pieces.filter((p) => p.step != null).sort((a, b) => a.step! - b.step!);
  const rest = pieces.filter((p) => p.step == null);
  const total = steps.reduce((s, p) => s + p.price_cents, 0);
  return (
    <>
      <ol className="routine">
        {steps.map((p, i) => (
          <li key={p.pin_id}>
            <div className="n">{String(i + 1).padStart(2, "0")}</div>
            <Piece piece={p} href={`/go/${p.pin_id}`} index={i} />
          </li>
        ))}
      </ol>
      <div className="total">
        <Rec>A rotina inteira</Rec>
        <span className="lead num">cerca de {brl(total)}</span>
      </div>
      {rest.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <Rec className="quiet">Também uso</Rec>
          <div className="six" style={{ marginTop: 16 }}>
            {rest.map((p, i) => (
              <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** High low: o caro que eu uso ao lado do que faz quase o mesmo. */
function HighLow({ pieces }: { pieces: PagePiece[] }) {
  const byPin = new Map(pieces.map((p) => [p.pin_id, p]));
  const pairs = pieces.filter((p) => p.pair_pin && byPin.has(p.pair_pin)).map((p) => [p, byPin.get(p.pair_pin!)!] as const);
  const paired = new Set(pairs.flatMap(([a, b]) => [a.pin_id, b.pin_id]));
  const rest = pieces.filter((p) => !paired.has(p.pin_id));
  return (
    <>
      {pairs.map(([high, low]) => (
        <div className="pair" key={high.pin_id}>
          <div>
            <Rec className="quiet">O que eu uso</Rec>
            <Piece piece={high} href={`/go/${high.pin_id}`} />
          </div>
          <div>
            <Rec className="quiet">Faz quase o mesmo</Rec>
            <Piece piece={low} href={`/go/${low.pin_id}`} />
          </div>
          {high.price_cents > low.price_cents && (
            <div className="diff">
              <Rec className="quiet">Diferença</Rec>
              <div className="d3 num">{brl(high.price_cents - low.price_cents)}</div>
            </div>
          )}
        </div>
      ))}
      {rest.length > 0 && (
        <>
          <Rec className="quiet">E o resto do look</Rec>
          <div className="six" style={{ marginTop: 16 }}>
            {rest.map((p, i) => (
              <Piece key={p.pin_id} piece={p} href={`/go/${p.pin_id}`} index={i} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
