import Link from "next/link";
import { db } from "@/lib/db";
import { siftPage } from "@/lib/page";
import { Frame, Rec } from "@/components/ui";

// A capa. Valor antes de qualquer cadastro: a primeira coisa que se vê é uma página pronta.

const STATES = ["Rascunho", "Assinado", "No ar", "Verificado", "Nota emitida", "Pago"];

export default function Home() {
  const page = siftPage(db(), "criadora");
  const four = page?.favourites ?? [];
  return (
    <>
      <section className="poster">
        <Rec className="quiet settle">Sift · gosto, no registro</Rec>
        <div style={{ alignSelf: "center" }}>
          <h1 className="d1 settle d1s" style={{ fontSize: "clamp(44px, 7.6vw, 124px)", maxWidth: "15ch" }}>
            Seus posts viram uma página. Cada publi vira um recibo.
          </h1>
        </div>
        <div className="foot">
          <div className="l settle d2s">
            <p className="lead">
              A Sift acha as peças nas suas fotos. Você fica com poucas e a página sai em minutos. Quando a marca paga, contrato, post, nota e
              Pix ficam no mesmo lugar.
            </p>
            <div className="row" style={{ marginTop: 24 }}>
              <Link className="btn" href="/shop/criadora">
                Ver uma Sift Page
              </Link>
              <Link className="btn ghost" href="/home/creators">
                Sou criadora
              </Link>
            </div>
          </div>
          {four.length > 0 && page && (
            <Link href="/shop/criadora" className="r piece settle d3s" aria-label="Abrir a página de @criadora">
              <div className="four" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {four.map((p) => (
                  <Frame key={p.pin_id} src={p.img} alt={`${p.brand}, ${p.title}`} />
                ))}
              </div>
              <div className="cap">
                <div className="rec row" style={{ gap: 8 }}>
                  <span className="kept-tag" aria-hidden />
                  <span>
                    {page.user.name} · ficaram {page.kept_count} de {page.seen_count}
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="section grid12" style={{ rowGap: 24 }}>
        <div className="c-label">
          <Rec>01 · A página, na frente</Rec>
        </div>
        <div className="c-body">
          <h2>Bom gosto merece nome e sobrenome.</h2>
          <p className="quiet">
            Cada peça diz se é exatamente aquela ou uma parecida, e de onde veio a relação com a marca: orgânico, recebido, afiliado ou publi.
            O que ela viu e deixou de fora continua lá, tracejado.
          </p>
        </div>
      </section>

      <section className="section grid12" style={{ rowGap: 24 }}>
        <div className="c-label">
          <Rec>02 · O registro, por trás</Rec>
        </div>
        <div className="c-body">
          <h2>Cada publi, com contrato e recibo.</h2>
          <p className="quiet">
            A Sift lê o contrato, confere se a marca não bate com uma exclusividade, olha o post no ar e emite a nota. O dinheiro só se move
            quando uma pessoa aprova.
          </p>
          <ol className="steps" style={{ marginTop: 32 }}>
            {STATES.map((s, i) => (
              <li key={s} className={i < 4 ? "done" : ""}>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section grid12" style={{ rowGap: 24 }}>
        <div className="c-label">
          <Rec>03 · O que a gente promete</Rec>
        </div>
        <div className="c-body">
          <table>
            <tbody>
              <tr>
                <td>Nota de gosto</td>
                <td className="quiet">Nunca.</td>
              </tr>
              <tr>
                <td>Discordar</td>
                <td className="quiet">É dado, fica no registro.</td>
              </tr>
              <tr>
                <td>Comissão</td>
                <td className="quiet">Nunca muda a ordem das peças.</td>
              </tr>
              <tr>
                <td>Cupom e dupe</td>
                <td className="quiet">Nunca.</td>
              </tr>
              <tr>
                <td>O que saiu</td>
                <td className="quiet">Não se apaga em silêncio.</td>
              </tr>
            </tbody>
          </table>
          <p className="small quiet" style={{ marginTop: 24 }}>
            Por enquanto, é pouca gente. De propósito.
          </p>
        </div>
      </section>
    </>
  );
}
