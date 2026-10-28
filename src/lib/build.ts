import type Database from "better-sqlite3";
import type { Market } from "./page";

// Sift this post: a máquina sugere, ela confirma peça por peça.
// Direita é Exato, cima é Parecido, esquerda tira. Tirar não apaga: a peça vai para o pontilhado.

type DB = Database.Database;
export type Decision = "exact" | "similar" | "out";

export interface BuildPiece {
  pin_id: number;
  title: string;
  brand: string;
  img: string | null;
  price_label: string | null;
  price_cents: number;
  market: Market;
  decision: Decision;
}

export interface BuildPost {
  id: number;
  title: string;
  source: string | null;
  pieces: BuildPiece[];
}

export function postsToSift(db: DB, userId: number): BuildPost[] {
  const posts = db.prepare("SELECT id, name AS title, quote_source AS source FROM collections WHERE user_id = ? ORDER BY position, id").all(userId) as Omit<BuildPost, "pieces">[];
  const pins = db
    .prepare(
      `SELECT pi.id AS pin_id, pi.collection_id, pi.archived, pi.match, p.title, p.img, p.price_label, p.price_cents, p.market, b.name AS brand
       FROM pins pi JOIN products p ON p.id = pi.product_id JOIN brands b ON b.id = p.brand_id
       WHERE pi.user_id = ? AND pi.collection_id IS NOT NULL ORDER BY pi.id`,
    )
    .all(userId) as (Omit<BuildPiece, "decision"> & { collection_id: number; archived: number; match: "exact" | "similar" })[];
  return posts
    .map((p) => ({
      ...p,
      pieces: pins
        .filter((x) => x.collection_id === p.id)
        .map(({ collection_id: _c, archived, match, ...x }) => ({ ...x, decision: (archived ? "out" : match) as Decision })),
    }))
    .filter((p) => p.pieces.length);
}

/** Guarda a escolha dela. Só a dona da peça decide. */
export function decidePin(db: DB, userId: number, pinId: number, d: Decision) {
  if (!["exact", "similar", "out"].includes(d)) throw new Error("Escolha inválida.");
  const r =
    d === "out"
      ? db.prepare("UPDATE pins SET archived = 1 WHERE id = ? AND user_id = ?").run(pinId, userId)
      : db.prepare("UPDATE pins SET archived = 0, match = ? WHERE id = ? AND user_id = ?").run(d, pinId, userId);
  if (!r.changes) throw new Error("Peça não encontrada.");
}

/** "Sift · k de n": quantas ficaram de quantas ela viu. */
export function tally(pieces: Pick<BuildPiece, "decision">[]) {
  const kept = pieces.filter((p) => p.decision !== "out").length;
  return { kept, total: pieces.length, exact: pieces.filter((p) => p.decision === "exact").length };
}
