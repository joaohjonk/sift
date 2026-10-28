import Link from "next/link";
import { Rec } from "@/components/ui";

// Para criadoras. Sem tabela de níveis na frente: nenhuma nota de gosto, nunca.

const STEPS: [string, string][] = [
  ["Dê um sift no seu post", "A máquina acha cada peça na foto. Você diz se é exatamente aquela, parecida ou se sai."],
  ["Fique com poucas", "A página mostra o que ficou e conta o que você viu. O que saiu continua no registro, tracejado."],
  ["Cada publi, com contrato e recibo", "A Sift lê o contrato, avisa se bate com uma exclusividade, confere o post, emite a nota e paga no Pix."],
];

export default function ForCreators() {
  return (
    <>
      <section className="poster" style={{ minHeight: "min(calc(100svh - 64px), 820px)" }}>
        <Rec className="quiet settle">Para criadoras</Rec>
        <h1 className="d1 settle d1s" style={{ alignSelf: "center", maxWidth: "12ch" }}>
          Bom gosto merece nome e sobrenome.
        </h1>
        <div className="foot">
          <div className="l settle d2s">
            <p className="lead">Você continua postando do seu jeito. Os links moram na página, nunca no feed.</p>
            <div className="row" style={{ marginTop: 24 }}>
              <Link className="btn" href="/apply/creator">
                Pedir convite
              </Link>
              <Link className="btn ghost" href="/shop/criadora">
                Ver uma Sift Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section grid12" style={{ rowGap: 24 }}>
        <div className="c-label">
          <Rec>Como funciona</Rec>
        </div>
        <div className="c-body">
          <ol className="steps">
            {STEPS.map(([t, d]) => (
              <li key={t} className="done">
                <div className="lead">{t}</div>
                <p className="quiet" style={{ margin: "6px 0 0" }}>
                  {d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section grid12" style={{ rowGap: 24 }}>
        <div className="c-label">
          <Rec>Quem entra</Rec>
        </div>
        <div className="c-body">
          <h2>Por enquanto, é pouca gente. De propósito.</h2>
          <p className="quiet">Entra uma turma de criadoras por vez, por convite.</p>
        </div>
      </section>
    </>
  );
}
