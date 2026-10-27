import type Database from "better-sqlite3";
import { getUserByUsername, type User } from "./repo";

// A Sift Page: o que ela guardou, o que saiu, e a prova de cada coisa.
// Lei 1: mostrar poucos, contar muitos. Lei 2: nada se apaga. Lei 5: seis no máximo.

type DB = Database.Database;

export type Tie = "organic" | "gifted" | "affiliate" | "paid";
export type Market = "br" | "abroad";

/** O filtro da página: onde dá para comprar. Rótulos em PT e EN. */
export const MARKET_LABEL: Record<Market, { pt: string; en: string }> = {
  br: { pt: "Compra no Brasil", en: "Shoppable in Brazil" },
  abroad: { pt: "Só lá fora", en: "Available abroad" },
};

export function parseMarket(v: string | undefined | null): Market | null {
  return v === "br" || v === "abroad" ? v : null;
}

export interface PagePiece {
  pin_id: number;
  product_id: number;
  title: string;
  brand: string;
  price_cents: number;
  price_label: string | null;
  img: string | null;
  match: "exact" | "similar";
  market: Market;
  tie: Tie;
  tie_brand: string | null;
  source: string | null;
  kept: boolean;
}

export interface PageSection {
  id: number;
  title: string;
  quote_source: string | null;
  kept: PagePiece[];
  left_out: PagePiece[];
}

export interface SiftPage {
  user: User & { line: string | null; seen_count: number };
  kept_count: number;
  seen_count: number;
  favourites: PagePiece[];
  sections: PageSection[];
  /** Quantas ficaram em cada lado do filtro, contando a página toda. */
  market_counts: Record<"all" | Market, number>;
  market: Market | null;
}

const MAX_PER_VIEW = 6;

export function siftPage(db: DB, username: string, opts: { market?: Market | null } = {}): SiftPage | null {
  const market = opts.market ?? null;
  const user = getUserByUsername(db, username) as SiftPage["user"] | undefined;
  if (!user || user.role !== "creator" || user.status !== "active") return null;
  const rows = db
    .prepare(
      `SELECT pi.id AS pin_id, pi.collection_id, pi.archived, pi.match, pi.tie, pi.tie_brand, pi.source,
              p.id AS product_id, p.title, p.price_cents, p.price_label, p.img, p.market, b.name AS brand
       FROM pins pi JOIN products p ON p.id = pi.product_id JOIN brands b ON b.id = p.brand_id
       WHERE pi.user_id = ? ORDER BY pi.id`,
    )
    .all(user.id) as (Omit<PagePiece, "kept"> & { collection_id: number | null; archived: number })[];
  const collections = db
    .prepare("SELECT id, name, quote_source FROM collections WHERE user_id = ? ORDER BY position, id")
    .all(user.id) as { id: number; name: string; quote_source: string | null }[];

  const piece = (r: (typeof rows)[number]): PagePiece => ({
    pin_id: r.pin_id,
    product_id: r.product_id,
    title: r.title,
    brand: r.brand,
    price_cents: r.price_cents,
    price_label: r.price_label,
    img: r.img,
    match: r.match,
    market: r.market,
    tie: r.tie,
    tie_brand: r.tie_brand,
    source: r.source,
    kept: !r.archived,
  });

  const sections: PageSection[] = collections
    .map((c) => {
      const mine = rows.filter((r) => r.collection_id === c.id && (!market || r.market === market)).map(piece);
      // Exato antes de parecido; nunca mais de seis à mostra.
      const kept = mine.filter((p) => p.kept).sort((a, b) => (a.match === b.match ? 0 : a.match === "exact" ? -1 : 1));
      return { id: c.id, title: c.name, quote_source: c.quote_source, kept: kept.slice(0, MAX_PER_VIEW), left_out: mine.filter((p) => !p.kept) };
    })
    .filter((s) => s.kept.length || s.left_out.length);

  const kept = rows.filter((r) => !r.archived);
  const kept_count = kept.length;
  const market_counts = { all: kept_count, br: kept.filter((r) => r.market === "br").length, abroad: kept.filter((r) => r.market === "abroad").length };
  const favourites = sections.map((s) => s.kept.find((p) => p.img) ?? s.kept[0]).filter(Boolean).slice(0, 4) as PagePiece[];
  return { user, kept_count, seen_count: Math.max(user.seen_count ?? 0, rows.length), favourites, sections, market_counts, market };
}

export const TIE_LABEL: Record<Tie, string | null> = {
  organic: null,
  affiliate: null,
  gifted: "Recebido",
  paid: "Publi",
};
