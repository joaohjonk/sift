import type Database from "better-sqlite3";

// Sift Record: o contrato da criadora, do rascunho ao dinheiro na conta.
// Estados andam numa linha só. Os estados de lado são calculados a partir das datas
// e das entregas, para nunca ficarem velhos no banco.

type DB = Database.Database;

export type DealState = "draft" | "signed" | "live" | "verified" | "invoiced" | "paid";
export type SideState = "late" | "conflict" | "rights_ending" | "needs_her";
export type ActionKind = "charge" | "ask_terms" | "propose_clause" | "advance_cash";

export const DEAL_STEPS: { key: DealState; label: string }[] = [
  { key: "draft", label: "Rascunho" },
  { key: "signed", label: "Assinado" },
  { key: "live", label: "No ar" },
  { key: "verified", label: "Verificado" },
  { key: "invoiced", label: "Nota emitida" },
  { key: "paid", label: "Pago" },
];

export const SIDE_LABEL: Record<SideState, string> = {
  late: "Atrasado",
  conflict: "Conflito",
  rights_ending: "Direitos acabando",
  needs_her: "Precisa dela",
};

export const ACTION_LABEL: Record<ActionKind, { hold: string; done: string }> = {
  charge: { hold: "Segure para a Sift cobrar", done: "Cobrança enviada pela Sift, com contrato e prova de entrega" },
  ask_terms: { hold: "Segure para pedir o seu prazo", done: "Pedido de prazo enviado à marca" },
  propose_clause: { hold: "Segure para propor à marca", done: "Cláusula de narrativa proposta, com o dado anexado" },
  advance_cash: { hold: "Segure para receber hoje", done: "Pedido de antecipação registrado" },
};

/** Quanto tempo ela tem para desfazer depois de segurar. */
export const UNDO_SECONDS = 10;
/** Prazo máximo que a criadora aceita, em dias. Na call de 26.10 a referência foi 90. */
export const MAX_TERMS_DAYS = 90;

export interface Deal {
  id: number;
  user_id: number;
  brand_name: string;
  title: string;
  fee_cents: number;
  state: DealState;
  signed_on: string | null;
  pay_terms_days: number | null;
  due_on: string | null;
  rights_until: string | null;
  example: number;
  created_at: string;
}

export interface DealPost {
  id: number;
  deal_id: number;
  url: string;
  posted_on: string;
  disclosed: number;
}

export interface DealAction {
  id: number;
  deal_id: number;
  kind: ActionKind;
  status: "queued" | "undone" | "sent";
  sends_at: string;
  created_at: string;
}

const DAY = 864e5;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export function stepIndex(state: DealState) {
  return DEAL_STEPS.findIndex((s) => s.key === state);
}

/** Estados de lado, em ordem de urgência. Vermelho só para estes. */
export function sideStates(deal: Pick<Deal, "state" | "due_on" | "pay_terms_days" | "rights_until">, posts: Pick<DealPost, "disclosed">[], today: string, maxTerms = MAX_TERMS_DAYS): SideState[] {
  const out: SideState[] = [];
  if (deal.state !== "paid" && deal.due_on && deal.due_on < today) out.push("late");
  if (deal.state !== "paid" && (deal.pay_terms_days ?? 0) > maxTerms) out.push("conflict");
  if (deal.rights_until && deal.rights_until >= today && daysBetween(today, deal.rights_until) <= 14) out.push("rights_ending");
  if (posts.some((p) => !p.disclosed)) out.push("needs_her");
  return out;
}

/** A ação que a Sift sugere para um estado de lado. Sem estado de lado, nada precisa dela. */
export function suggestedAction(side: SideState[]): ActionKind | null {
  if (side.includes("late")) return "charge";
  if (side.includes("conflict")) return "ask_terms";
  return null;
}

export interface DealRow extends Deal {
  posts: DealPost[];
  side: SideState[];
  actions: DealAction[];
}

function hydrate(db: DB, d: Deal, today: string): DealRow {
  const posts = db.prepare("SELECT * FROM deal_posts WHERE deal_id = ? ORDER BY posted_on").all(d.id) as DealPost[];
  const actions = db.prepare("SELECT * FROM deal_actions WHERE deal_id = ? ORDER BY id DESC").all(d.id) as DealAction[];
  return { ...d, posts, actions, side: sideStates(d, posts, today) };
}

export function listDeals(db: DB, userId: number, now = new Date()): DealRow[] {
  settleActions(db, now);
  const today = iso(now);
  const rows = db.prepare("SELECT * FROM deals WHERE user_id = ? ORDER BY CASE state WHEN 'paid' THEN 1 ELSE 0 END, due_on").all(userId) as Deal[];
  // O que precisa dela vem primeiro.
  return rows.map((d) => hydrate(db, d, today)).sort((a, b) => Number(b.side.length > 0) - Number(a.side.length > 0));
}

export function getDeal(db: DB, userId: number, id: number, now = new Date()): DealRow | null {
  settleActions(db, now);
  const d = db.prepare("SELECT * FROM deals WHERE id = ? AND user_id = ?").get(id, userId) as Deal | undefined;
  return d ? hydrate(db, d, iso(now)) : null;
}

/** Ela segurou o quadrado: a ação entra na fila e só sai depois de dez segundos. */
export function queueAction(db: DB, userId: number, dealId: number, kind: ActionKind, now = new Date()): DealAction {
  const deal = db.prepare("SELECT id FROM deals WHERE id = ? AND user_id = ?").get(dealId, userId);
  if (!deal) throw new Error("Contrato não encontrado.");
  const pending = db.prepare("SELECT id FROM deal_actions WHERE deal_id = ? AND kind = ? AND status = 'queued'").get(dealId, kind);
  if (pending) throw new Error("Essa ação já está na fila.");
  const sends = new Date(now.getTime() + UNDO_SECONDS * 1000).toISOString();
  const id = Number(
    db.prepare("INSERT INTO deal_actions (deal_id, kind, sends_at, created_at) VALUES (?, ?, ?, ?)").run(dealId, kind, sends, now.toISOString()).lastInsertRowid,
  );
  return db.prepare("SELECT * FROM deal_actions WHERE id = ?").get(id) as DealAction;
}

/** Desfazer só vale antes de sair. Depois, a Sift avisa que já saiu. */
export function undoAction(db: DB, userId: number, actionId: number, now = new Date()) {
  const a = db
    .prepare("SELECT a.* FROM deal_actions a JOIN deals d ON d.id = a.deal_id WHERE a.id = ? AND d.user_id = ?")
    .get(actionId, userId) as DealAction | undefined;
  if (!a) throw new Error("Ação não encontrada.");
  if (a.status !== "queued" || a.sends_at <= now.toISOString()) throw new Error("Já saiu. Para voltar atrás, fale com a Sift.");
  db.prepare("UPDATE deal_actions SET status = 'undone' WHERE id = ?").run(actionId);
}

/** Tudo que passou dos dez segundos sai. */
export function settleActions(db: DB, now = new Date()) {
  db.prepare("UPDATE deal_actions SET status = 'sent' WHERE status = 'queued' AND sends_at <= ?").run(now.toISOString());
}

// ---------- Dinheiro ----------

export interface Receivable {
  deal_id: number;
  brand_name: string;
  amount_cents: number;
  due_on: string;
  late: boolean;
  example: boolean;
}

/** O que falta entrar, por data. Atrasado primeiro. */
export function receivables(deals: Deal[], today: string): Receivable[] {
  return deals
    .filter((d) => d.state !== "paid" && d.state !== "draft" && d.due_on)
    .map((d) => ({ deal_id: d.id, brand_name: d.brand_name, amount_cents: d.fee_cents, due_on: d.due_on!, late: d.due_on! < today, example: !!d.example }))
    .sort((a, b) => Number(b.late) - Number(a.late) || a.due_on.localeCompare(b.due_on));
}

/** Receber hoje: o valor e o custo em reais, antes de ela decidir. Juros compostos ao mês. */
export function advanceQuote(amountCents: number, dueOn: string, today: string, monthlyRate = 0.022) {
  const months = Math.max(0, daysBetween(today, dueOn) / 30.4);
  const todayCents = Math.round(amountCents / Math.pow(1 + monthlyRate, months));
  return { months, today_cents: todayCents, cost_cents: amountCents - todayCents, monthly_rate: monthlyRate };
}

/** O mesmo ano com agência e com a Sift. Cenário, não promessa. */
export function feeCompare(totalCents: number, agencyRate = 0.3, siftRate = 0.1) {
  const agency = Math.round(totalCents * agencyRate);
  const sift = Math.round(totalCents * siftRate);
  return { agency_cents: agency, sift_cents: sift, kept_cents: agency - sift };
}

// ---------- Demo ----------

/** Contratos de exemplo para a @criadora. Marcas fictícias, valores de exemplo. */
export function seedRecord(db: DB, userId: number, now = new Date()) {
  const d = (n: number) => iso(new Date(now.getTime() + n * DAY));
  const ins = db.prepare(
    `INSERT INTO deals (user_id, brand_name, title, fee_cents, state, signed_on, pay_terms_days, due_on, rights_until, example)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  );
  const post = db.prepare("INSERT INTO deal_posts (deal_id, url, posted_on, disclosed) VALUES (?, ?, ?, ?)");
  const rows: [string, string, number, DealState, number, number | null, number | null, number | null, [number, number][]][] = [
    // marca, título, valor, estado, assinado há (dias), prazo, vence em (dias), direitos até (dias), posts [há dias, avisado]
    ["Ateliê Norte", "Lançamento bolsa Mar", 2_500_000, "live", -40, 90, 50, 120, [[-20, 1], [-6, 1]]],
    ["Lume Beauty", "Base nova, três reels", 1_800_000, "invoiced", -50, 60, 18, null, [[-30, 1]]],
    ["Casa Linho", "Coleção inverno", 2_200_000, "verified", -45, 90, 70, 9, [[-14, 1], [-12, 0]]],
    ["Brisa Swim", "Verão, carrossel e reel", 1_500_000, "live", -10, 120, 160, null, [[-3, 1]]],
    ["Aurora Skincare", "Sérum, campanha do ano passado", 4_000_000, "verified", -400, 30, -330, null, [[-380, 1]]],
    ["Lume Beauty", "Acessórios de festa", 900_000, "paid", -70, 45, -20, null, [[-60, 1]]],
    ["Ateliê Norte", "Proposta de verão", 1_200_000, "draft", 0, 60, null, null, []],
  ];
  for (const [brand, title, fee, state, signed, terms, due, rights, posts] of rows) {
    const id = Number(
      ins.run(userId, brand, title, fee, state, state === "draft" ? null : d(signed), terms, due == null ? null : d(due), rights == null ? null : d(rights)).lastInsertRowid,
    );
    for (const [ago, ok] of posts) post.run(id, `https://www.instagram.com/p/exemplo-${id}-${-ago}/`, d(ago), ok);
  }
}
