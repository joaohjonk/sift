"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { siftPiece } from "@/app/record-actions";
import type { BuildPost, Decision } from "@/lib/build";
import { MARKET_LABEL } from "@/lib/page";

const KEY: Record<string, Decision> = { ArrowRight: "exact", ArrowUp: "similar", ArrowLeft: "out" };
const WORD: Record<Decision, string> = { exact: "Exato", similar: "Parecido", out: "Sai" };

/** O jogo: direita é Exato, cima é Parecido, esquerda tira. Termina em "Sift · k de n". */
export function SiftThisPost({ posts, username }: { posts: BuildPost[]; username: string }) {
  const flat = posts.flatMap((p) => p.pieces.map((x) => ({ ...x, post: p })));
  const [dec, setDec] = useState<Record<number, Decision>>(() => Object.fromEntries(flat.map((x) => [x.pin_id, x.decision])));
  const [cur, setCur] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const card = useRef<HTMLDivElement>(null);

  const choose = useCallback(
    (d: Decision) => {
      const x = flat[cur];
      if (!x) return;
      const prev = dec[x.pin_id];
      setDec((m) => ({ ...m, [x.pin_id]: d }));
      setCur((c) => c + 1);
      start(async () => {
        try {
          await siftPiece(x.pin_id, d);
        } catch {
          setDec((m) => ({ ...m, [x.pin_id]: prev }));
          setError("Não deu para guardar essa escolha. Tente de novo.");
        }
      });
    },
    [cur, dec, flat],
  );

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const d = KEY[e.key];
      if (d) {
        e.preventDefault();
        choose(d);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [choose]);

  // Arrastar a peça: mais de 70 px para o lado ou 60 px para cima decide.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    let sx = 0, sy = 0, on = false;
    const down = (e: PointerEvent) => { on = true; sx = e.clientX; sy = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (on) el.style.transform = `translate(${e.clientX - sx}px, ${Math.min(0, e.clientY - sy)}px)`; };
    const up = (e: PointerEvent) => {
      if (!on) return;
      on = false;
      el.style.transform = "";
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (dx > 70) choose("exact");
      else if (dx < -70) choose("out");
      else if (dy < -60) choose("similar");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [choose, cur]);

  const kept = flat.filter((x) => dec[x.pin_id] !== "out").length;
  const progress = (
    <div className="sift-progress" aria-hidden>
      {flat.map((x, j) => (
        <i key={x.pin_id} className={`${dec[x.pin_id] === "exact" ? "k" : dec[x.pin_id] === "similar" ? "s" : "o"} ${j === cur ? "now" : ""}`} />
      ))}
    </div>
  );

  if (!flat.length) {
    return (
      <div className="section">
        <p className="lead">Nenhum post para dar sift.</p>
        <p className="quiet">Quando a Sift ler um post seu, as peças que a máquina achar aparecem aqui para você confirmar.</p>
      </div>
    );
  }

  if (cur >= flat.length) {
    const exact = flat.filter((x) => dec[x.pin_id] === "exact").length;
    return (
      <div className="section sift-done">
        <div className="rec red">
          Sift · {kept} de {flat.length}
        </div>
        <h2 className="d2" style={{ marginTop: 16 }}>
          Ficaram {kept} peças. {exact} Exato, {kept - exact} Parecido.
        </h2>
        <p className="quiet">{flat.length - kept} ficaram de fora e continuam no registro, em pontilhado na página. Nada some.</p>
        {progress}
        <div className="row" style={{ marginTop: 24 }}>
          <Link className="btn" href={`/shop/${username}`}>
            Ver a página
          </Link>
          <button type="button" className="ghost" onClick={() => setCur(0)}>
            Jogar de novo
          </button>
        </div>
      </div>
    );
  }

  const x = flat[cur];
  const inPost = x.post.pieces.findIndex((p) => p.pin_id === x.pin_id);
  const d = dec[x.pin_id];
  return (
    <div className="grid12 sift-game section" style={{ marginTop: 40 }}>
      <div className="sift-post">
        <div className="rec quiet">{x.post.source ?? "Post"}</div>
        <p className="quote">“{x.post.title}”</p>
        <div className="sift-strip">
          {x.post.pieces.map((p, j) => (
            <div key={p.pin_id} className={`frame ${j === inPost ? "focus" : ""} ${dec[p.pin_id] === "out" ? "gone" : ""}`}>
              {p.img ? <img src={p.img} alt="" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="sift-card">
        <div className="rec quiet">
          Peça {inPost + 1} de {x.post.pieces.length} neste post · {cur + 1} de {flat.length}
        </div>
        <div className="sift-piece" ref={card}>
          <div className="frame">{x.img ? <img src={x.img} alt={`${x.brand}, ${x.title}`} draggable={false} /> : null}</div>
          <div>
            <div className="rec quiet">
              {x.brand} · {MARKET_LABEL[x.market].pt}
            </div>
            <h2 style={{ marginTop: 8 }}>{x.title}</h2>
            <div className="rec">Agora: {WORD[d]}</div>
          </div>
        </div>
        <div className="sift-choices">
          <button type="button" className={`ghost ${d === "out" ? "on" : ""}`} onClick={() => choose("out")}>
            <span className="kbd">←</span> Sai
          </button>
          <button type="button" className={`ghost ${d === "similar" ? "on" : ""}`} onClick={() => choose("similar")}>
            <span className="kbd">↑</span> Parecido
          </button>
          <button type="button" className={d === "exact" ? "keep" : "ghost"} onClick={() => choose("exact")}>
            <span className="kbd">→</span> Exato
          </button>
        </div>
        {error && (
          <p className="red small" role="alert">
            {error}
          </p>
        )}
        {progress}
        <div className="row">
          <button type="button" className="link rec" disabled={cur === 0} onClick={() => setCur((c) => Math.max(0, c - 1))}>
            Voltar
          </button>
          <button type="button" className="link rec" onClick={() => setCur(flat.length)}>
            Pular para o fim
          </button>
        </div>
      </div>
    </div>
  );
}
