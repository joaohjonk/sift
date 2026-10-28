import Link from "next/link";
import type { ReactNode } from "react";
import { tierFor } from "@/lib/tiers";
import { formatMoney } from "@/lib/money";
import type { Product, ProductWithStats } from "@/lib/repo";
import { TIE_LABEL, signalOf, type PagePiece } from "@/lib/page";

/** O quadrado da Sift. Abaixo de 24 px aparece sozinho, sem o nome. */
export function Mark({ size }: { size?: "alone" | "lg" }) {
  return (
    <span className={`mark ${size ?? ""}`} aria-hidden>
      {size === "alone" ? null : "SIFT"}
    </span>
  );
}

/** Linha de registro: caixa alta, +6%, números tabulares. */
export function Rec({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`rec ${className ?? ""}`}>{children}</div>;
}

/** 12.03.26, a data do registro. */
export function recDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso.replace(" ", "T")) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

export function priceOf(p: { price_cents: number; price_label?: string | null }) {
  return p.price_label ?? formatMoney(p.price_cents);
}

/** Sem rosto inventado: o nome basta. Mantido para as telas antigas. */
export function Avatar(_: { name: string; size?: "lg" }) {
  return null;
}

/** Nível só no bastidor, em linha de registro. Nunca uma nota de gosto na frente. */
export function TierBadge({ score }: { score: number }) {
  return <span className="tier">{tierFor(score).name}</span>;
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!ok && !error) return null;
  return (
    <div className={`flash ${error ? "error" : "ok"}`} role={error ? "alert" : "status"}>
      {error ?? ok}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="small muted">{hint}</div>}
    </div>
  );
}

/** A moldura 4:5 no wash. A imagem chega devagar, nunca pisca. */
export function Frame({ src, alt, photo }: { src: string | null | undefined; alt: string; photo?: boolean }) {
  return (
    <div className={`frame ${photo ? "photo" : ""}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="ph rec" aria-label={alt}>
          Foto a caminho
        </div>
      )}
    </div>
  );
}

export function ProductImage({ product, children }: { product: Pick<Product, "color" | "title"> & { img?: string | null }; children?: ReactNode }) {
  return (
    <div className="img">
      {product.img ? <img src={product.img} alt={product.title} loading="lazy" /> : null}
      {children}
    </div>
  );
}

/** Peça do catálogo. A prova é quem guardou, nunca clique nem seguidor. */
export function ProductCard({ product, href, note }: { product: Product & Partial<ProductWithStats>; href?: string; note?: ReactNode }) {
  return (
    <Link className="piece" href={href ?? `/shop/product/${product.id}`}>
      <Frame src={product.img} alt={`${product.brand_name}, ${product.title}`} />
      <div className="cap">
        <div className="rec">{product.brand_name}</div>
        <div className="name">{product.title}</div>
        <div className="price">{priceOf(product)}</div>
        {product.num_promoters ? (
          <div className="rec quiet">
            Guardada por {product.num_promoters} {product.num_promoters > 1 ? "pessoas" : "pessoa"}
          </div>
        ) : null}
        {note}
      </div>
    </Link>
  );
}

/** Uma peça que ficou numa Sift Page: exato ou parecido, e a relação comercial à vista. */
export function Piece({ piece, href, index }: { piece: PagePiece; href: string; index?: number }) {
  const tie = TIE_LABEL[piece.tie];
  return (
    <a className="piece settle" href={href} style={index ? { animationDelay: `${index * 90}ms` } : undefined}>
      <Frame src={piece.img} alt={`${piece.brand}, ${piece.title}`} />
      <div className="cap">
        <div className="rec">
          {piece.match === "exact" ? <span className="kept-tag" aria-hidden /> : <span className="similar-tag" aria-hidden />}
          <span>{piece.match === "exact" ? "Exato" : "Parecido"}</span>
          {tie && (
            <span className="tie">
              · {tie}
              {piece.tie_brand ? ` ${piece.tie_brand}` : ""}
            </span>
          )}
        </div>
        <div className="name">
          {piece.brand}, {piece.title.charAt(0).toLowerCase() + piece.title.slice(1)}
        </div>
        <div className="price">{priceOf(piece)}</div>
        {signalOf(piece) && <div className="rec signal">{signalOf(piece)}</div>}
      </div>
    </a>
  );
}

/** O que saiu fica no registro, como caixa tracejada. */
export function OutBox({ piece }: { piece: PagePiece }) {
  return (
    <div>
      <div className="out-box" aria-hidden>
        {piece.img ? <img src={piece.img} alt="" loading="lazy" /> : null}
        <span className="rec">De fora</span>
      </div>
      <div className="cap">
        <div className="name">
          {piece.brand}, {piece.title.charAt(0).toLowerCase() + piece.title.slice(1)}
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const good = ["accepted", "active", "approved", "paid", "sent", "completed", "ordered"];
  const warn = ["invited", "pending", "proposed", "submitted", "scheduled", "waitlist"];
  const cls = good.includes(status) ? "good" : warn.includes(status) ? "warn" : "bad";
  return <span className={`status ${cls}`}>{STATUS_LABEL[status] ?? status}</span>;
}

const STATUS_LABEL: Record<string, string> = {
  invited: "convidada",
  accepted: "aceito",
  declined: "recusado",
  submitted: "enviado",
  paid: "pago",
  pending: "pendente",
  approved: "aprovado",
  cancelled: "cancelado",
  proposed: "proposta",
  active: "ativo",
  rejected: "recusado",
  completed: "concluído",
  ordered: "pedido feito",
  scheduled: "agendado",
  sent: "enviado",
  waitlist: "lista de espera",
};

export function Bars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars" aria-label="Cliques por dia">
      {values.map((v, i) => (
        <div key={i} style={{ height: `${(v / max) * 100}%` }} title={String(v)} />
      ))}
    </div>
  );
}

export function SideNav({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav className="sidenav" aria-label={title}>
      <div className="label">{title}</div>
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
