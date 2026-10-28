"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { holdDealAction, undoDealAction } from "@/app/record-actions";
import type { ActionKind } from "@/lib/record";

const HOLD_MS = 1100;

/** Segurar o quadrado vermelho. Soltar antes do fim cancela. Teclado: segure espaço ou Enter. */
export function HoldButton({ label, dealId, kind, back }: { label: string; dealId: number; kind: ActionKind; back: string }) {
  const [holding, setHolding] = useState(false);
  const [pending, start] = useTransition();
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const begin = () => {
    if (pending) return;
    setHolding(true);
    t.current = setTimeout(() => {
      setHolding(false);
      start(() => holdDealAction(dealId, kind, back));
    }, HOLD_MS);
  };
  const stop = () => {
    if (t.current) clearTimeout(t.current);
    setHolding(false);
  };
  return (
    <button
      type="button"
      className={`hold ${holding ? "holding" : ""}`}
      aria-label={`${label}. Segure por um segundo.`}
      disabled={pending}
      onPointerDown={(e) => {
        e.preventDefault();
        begin();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
    >
      <span className="pad" aria-hidden>
        <i />
      </span>
      {pending ? "Guardando" : label}
    </button>
  );
}

/** Dez segundos para desfazer, contados a partir do relógio do servidor. */
export function QueuedAction({ id, sendsAt, label, back }: { id: number; sendsAt: string; label: string; back: string }) {
  const router = useRouter();
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((Date.parse(sendsAt) - Date.now()) / 1000)));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (left <= 0) {
      router.refresh();
      return;
    }
    const iv = setTimeout(() => setLeft(Math.max(0, Math.ceil((Date.parse(sendsAt) - Date.now()) / 1000))), 250);
    return () => clearTimeout(iv);
  }, [left, sendsAt, router]);
  return (
    <div className="undo" role="status">
      <span>{label}</span>
      <span className="rec quiet num">Sai em {left}s</span>
      <button
        type="button"
        className="link"
        disabled={pending || left <= 0}
        onClick={() =>
          start(async () => {
            const r = await undoDealAction(id, back);
            if (r.error) setError(r.error);
          })
        }
      >
        Desfazer
      </button>
      {error && <span className="red">{error}</span>}
    </div>
  );
}
