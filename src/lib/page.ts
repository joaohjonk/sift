import type Database from "better-sqlite3";
import { getUserByUsername, type User } from "./repo";
import type { Format } from "./taxonomy";

// A Sift Page: o que ela guardou, o que saiu, e a prova de cada coisa.
// Lei 1: mostrar poucos, contar muitos. Lei 2: nada se apaga. Lei 5: seis no máximo.

type DB = Database.Database;

export type Tie = "organic" | "gifted" | "affiliate" | "paid";

export interface PagePiece {
  pin_id: number;
  product_id: number;
  title: string;
  brand: string;
  price_cents: number;
  price_label: string | null;
  img: string | null;
  match: "exact" | "similar";
  tie: Tie;
  tie_brand: string | null;
  source: string | null;
  kept: boolean;
  department: string;
  category: string;
  owned_since: string | null;
  repurchased: number;
  step: number | null;
  pair_pin: number | null;
}

export interface PageSection {
  id: number;
  title: string;
  format: Format;
  quote_source: string | null;
  kept: PagePiece[];
  /** Tudo que ficou, sem o corte de seis: a página da coleção filtra em cima disso. */
  all_kept: PagePiece[];
  left_out: PagePiece[];
}

export interface SiftPage {
  user: User & { line: string | null; seen_count: number };
  kept_count: number;
  seen_count: number;
  favourites: PagePiece[];
  sections: PageSection[];
}

const MAX_PER_VIEW = 6;

export function siftPage(db: DB, username: string): SiftPage | null {
  const user = getUserByUsername(db, username) as SiftPage["user"] | undefined;
  if (!user || user.role !== "creator" || user.status !== "active") return null;
  const rows = db
    .prepare(
      `SELECT pi.id AS pin_id, pi.collection_id, pi.archived, pi.match, pi.tie, pi.tie_brand, pi.source,
              pi.owned_since, pi.repurchased, pi.step, pi.pair_pin,
              p.id AS product_id, p.title, p.price_cents, p.price_label, p.img, b.name AS brand,
              c.industry AS department, c.department AS category
       FROM pins pi JOIN products p ON p.id = pi.product_id JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE pi.user_id = ? ORDER BY pi.id`,
    )
    .all(user.id) as (Omit<PagePiece, "kept"> & { collection_id: number | null; archived: number })[];
  const collections = db
    .prepare("SELECT id, name, quote_source, format FROM collections WHERE user_id = ? ORDER BY position, id")
    .all(user.id) as { id: number; name: string; quote_source: string | null; format: Format }[];

  const piece = (r: (typeof rows)[number]): PagePiece => ({
    pin_id: r.pin_id,
    product_id: r.product_id,
    title: r.title,
    brand: r.brand,
    price_cents: r.price_cents,
    price_label: r.price_label,
    img: r.img,
    match: r.match,
    tie: r.tie,
    tie_brand: r.tie_brand,
    source: r.source,
    kept: !r.archived,
    department: r.department,
    category: r.category,
    owned_since: r.owned_since,
    repurchased: r.repurchased,
    step: r.step,
    pair_pin: r.pair_pin,
  });

  const sections: PageSection[] = collections
    .map((c) => {
      const mine = rows.filter((r) => r.collection_id === c.id).map(piece);
      // Exato antes de parecido; nunca mais de seis à mostra.
      const kept = mine.filter((p) => p.kept).sort((a, b) => (a.match === b.match ? 0 : a.match === "exact" ? -1 : 1));
      return { id: c.id, title: c.name, format: c.format, quote_source: c.quote_source, all_kept: kept, kept: kept.slice(0, MAX_PER_VIEW), left_out: mine.filter((p) => !p.kept) };
    })
    .filter((s) => s.kept.length || s.left_out.length);

  const kept_count = rows.filter((r) => !r.archived).length;
  const favourites = sections.map((s) => s.kept.find((p) => p.img) ?? s.kept[0]).filter(Boolean).slice(0, 4) as PagePiece[];
  return { user, kept_count, seen_count: Math.max(user.seen_count ?? 0, rows.length), favourites, sections };
}

/** A linha pessoal da peça, em primeira pessoa e caixa de registro: RECOMPREI 6 VEZES · DESDE 03.23. */
export function signalOf(p: PagePiece): string | null {
  const parts: string[] = [];
  if (p.repurchased > 1) parts.push(`Recomprei ${p.repurchased} vezes`);
  else if (p.repurchased === 1) parts.push("Recomprei");
  if (p.owned_since) parts.push(p.repurchased ? `desde ${p.owned_since}` : `Tenho desde ${p.owned_since}`);
  return parts.length ? parts.join(" · ") : null;
}

export const TIE_LABEL: Record<Tie, string | null> = {
  organic: null,
  affiliate: null,
  gifted: "Recebido",
  paid: "Publi",
};
