"use client";

import { useState } from "react";

/** Compartilhar é a ação principal do fim. Sem Web Share, copia o link. O rótulo muda no lugar. */
export function ShareButton({ title, text, path, label = "Compartilhar" }: { title: string; text: string; path: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2400);
    } catch {
      /* a pessoa desistiu do compartilhamento; nada a fazer */
    }
  }
  return (
    <button type="button" onClick={share} aria-live="polite">
      {state === "copied" ? "Link copiado" : label}
    </button>
  );
}

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }}
    >
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}
