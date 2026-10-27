import Link from "next/link";
import { db } from "@/lib/db";
import { chatMessages, chatThreads, listBrands } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { sendChat } from "../actions";
import { tierFor } from "@/lib/tiers";
import { BrandShell, CreatorShell } from "@/components/shells";
import { Flash } from "@/components/ui";

export default async function Chat({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser(["creator", "brand"], "/chat");
  const d = db();
  const isBrand = user.role === "brand";
  const threads = chatThreads(d, isBrand ? { brandId: user.brand_id! } : { userId: user.id });
  const brandId = isBrand ? user.brand_id! : Number(sp.brand ?? threads[0]?.brand_id ?? 0);
  const userId = isBrand ? Number(sp.user ?? threads[0]?.user_id ?? 0) : user.id;
  const msgs = brandId && userId ? chatMessages(d, brandId, userId) : [];
  const Shell = isBrand ? BrandShell : CreatorShell;
  const canStart = !isBrand && tierFor(user.trust_score).canChatBrands;
  return (
    <Shell>
      <Flash sp={sp} />
      <h1>Chat</h1>
      <div className="grid split" style={{ gridTemplateColumns: "240px 1fr" }}>
        <div className="stack">
          {threads.map((t) => (
            <Link
              key={`${t.brand_id}-${t.user_id}`}
              href={`/chat?brand=${t.brand_id}&user=${t.user_id}`}
              className="card"
              style={{ textDecoration: "none", padding: 10 }}
            >
              <div>{isBrand ? t.creator_name : t.brand_name}</div>
              <div className="small muted">{t.last_body.slice(0, 60)}</div>
            </Link>
          ))}
          {!isBrand && (
            <form action="/chat" className="card" style={{ padding: 10 }}>
              <label>Nova conversa</label>
              <select name="brand">
                {listBrands(d).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button className="small" style={{ marginTop: 6 }}>
                Abrir
              </button>
              {!canStart && <p className="small muted">Iniciar conversa libera no tier Trendsetter.</p>}
            </form>
          )}
        </div>
        <div className="card">
          {brandId && userId ? (
            <>
              <div className="stack" style={{ minHeight: 200 }}>
                {msgs.map((m) => {
                  const mine = isBrand ? !!m.from_brand : !m.from_brand;
                  return (
                    <div key={m.id} style={{ textAlign: mine ? "right" : "left" }}>
                      <span className="card" style={{ display: "inline-block", padding: "8px 12px", background: mine ? "var(--bg)" : undefined }}>
                        {m.body}
                      </span>
                    </div>
                  );
                })}
                {!msgs.length && <p className="muted">Nenhuma mensagem ainda.</p>}
              </div>
              <form action={sendChat} className="row" style={{ marginTop: 16 }}>
                <input type="hidden" name="brand_id" value={brandId} />
                <input type="hidden" name="user_id" value={userId} />
                <input name="body" placeholder="Escreva uma mensagem" required style={{ flex: 1 }} />
                <button>Enviar</button>
              </form>
            </>
          ) : (
            <p className="muted">Escolha uma conversa.</p>
          )}
        </div>
      </div>
    </Shell>
  );
}
