import Link from "next/link";
import type { ReactNode } from "react";
import { tierFor } from "@/lib/tiers";
import { formatCompact, formatMoney } from "@/lib/money";
import type { Product, ProductWithStats } from "@/lib/repo";

const AVATAR_COLORS = ["#7b5e57", "#4f6d5a", "#5a5f7d", "#8a6d3b", "#6d4f6f", "#3f6470", "#7d5a3c"];

export function Avatar({ name, size }: { name: string; size?: "lg" }) {
  const color = AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span className={`avatar ${size ?? ""}`} style={{ background: color }} aria-hidden>
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}

export function TierBadge({ score }: { score: number }) {
  const t = tierFor(score);
  return <span className={`tier tier-${t.name}`}>{t.name}</span>;
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!ok && !error) return null;
  return <div className={`flash ${error ? "error" : "ok"}`}>{error ?? ok}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="small muted">{hint}</div>}
    </div>
  );
}

export function ProductImage({ product, children }: { product: Pick<Product, "color">; children?: ReactNode }) {
  return (
    <div className="img" style={{ background: product.color }}>
      {children}
    </div>
  );
}

/** Card de produto com prova social: quantos indicam e cliques no mês. */
export function ProductCard({ product, href, note }: { product: Product & Partial<ProductWithStats>; href?: string; note?: ReactNode }) {
  return (
    <Link className="product" href={href ?? `/shop/product/${product.id}`}>
      <ProductImage product={product}>
        {product.clicks_month ? <span className="chip">{formatCompact(product.clicks_month)} cliques este mês</span> : null}
      </ProductImage>
      <div className="brand">{product.brand_name}</div>
      <div className="title">{product.title}</div>
      <div className="small">{formatMoney(product.price_cents)}</div>
      {product.num_promoters ? (
        <div className="proof">
          Indicado por {product.num_promoters} curador{product.num_promoters > 1 ? "es" : ""}
        </div>
      ) : null}
      {note}
    </Link>
  );
}

export function StatusPill({ status }: { status: string }) {
  const good = ["accepted", "active", "approved", "paid", "sent", "completed", "ordered"];
  const warn = ["invited", "pending", "proposed", "submitted", "scheduled", "waitlist"];
  const cls = good.includes(status) ? "good" : warn.includes(status) ? "warn" : "bad";
  return <span className={`status ${cls}`}>{STATUS_LABEL[status] ?? status}</span>;
}

const STATUS_LABEL: Record<string, string> = {
  invited: "convidado",
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
    <nav className="sidenav">
      <div className="label">{title}</div>
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
