import type Database from "better-sqlite3";
import { commissionFor } from "./money";
import { tierFor } from "./tiers";

// Consultas e mutações. Cada função recebe a conexão para poder ser testada
// com um banco em memória.

type DB = Database.Database;

export interface User {
  id: number;
  username: string;
  name: string;
  legal_name: string | null;
  phone: string | null;
  role: "shopper" | "creator" | "brand" | "admin";
  status: "active" | "waitlist" | "rejected";
  bio: string;
  instagram: string | null;
  followers: number;
  location: string | null;
  trust_score: number;
  brand_id: number | null;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  domain: string;
  description: string;
  default_commission_rate: number;
  integration: string | null;
  click_tracking_ok: number;
  order_tracking_ok: number;
  order_updates_ok: number;
  order_cancellations_ok: number;
  onboarded_at: string | null;
}

export interface Product {
  id: number;
  title: string;
  brand_id: number;
  brand_name: string;
  category_id: number;
  category: string;
  department: string;
  industry: string;
  price_cents: number;
  url: string;
  color: string;
}

export interface ProductWithStats extends Product {
  num_promoters: number;
  clicks_week: number;
  clicks_month: number;
  clicks_total: number;
}

export interface PinRow {
  id: number;
  user_id: number;
  product_id: number;
  collection_id: number | null;
  note: string;
  created_at: string;
  product: Product;
  clicks_month: number;
  clicks_total: number;
  orders: number;
  commission_cents: number;
  rate: number;
}

const PRODUCT_SELECT = `
  SELECT p.*, b.name AS brand_name, c.name AS category, c.department, c.industry
  FROM products p JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id`;

const PRODUCT_STATS = `
  (SELECT count(DISTINCT pi.user_id) FROM pins pi WHERE pi.product_id = p.id) AS num_promoters,
  (SELECT count(*) FROM clicks k JOIN pins pi ON pi.id = k.pin_id WHERE pi.product_id = p.id AND k.created_at >= datetime('now','-7 days')) AS clicks_week,
  (SELECT count(*) FROM clicks k JOIN pins pi ON pi.id = k.pin_id WHERE pi.product_id = p.id AND k.created_at >= datetime('now','-30 days')) AS clicks_month,
  (SELECT count(*) FROM clicks k JOIN pins pi ON pi.id = k.pin_id WHERE pi.product_id = p.id) AS clicks_total`;

// ---------- Usuários ----------

export function getUser(db: DB, id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getUserByUsername(db: DB, username: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
}

export function listUsersForLogin(db: DB): User[] {
  return db.prepare("SELECT * FROM users ORDER BY role, trust_score DESC, name").all() as User[];
}

export function trustedByCount(db: DB, curatorId: number): number {
  return (db.prepare("SELECT count(*) AS n FROM follows WHERE curator_id = ?").get(curatorId) as { n: number }).n;
}

export function isFollowing(db: DB, followerId: number, curatorId: number): boolean {
  return !!db.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND curator_id = ?").get(followerId, curatorId);
}

export function toggleFollow(db: DB, followerId: number, curatorId: number) {
  if (isFollowing(db, followerId, curatorId)) {
    db.prepare("DELETE FROM follows WHERE follower_id = ? AND curator_id = ?").run(followerId, curatorId);
  } else {
    db.prepare("INSERT INTO follows (follower_id, curator_id) VALUES (?, ?)").run(followerId, curatorId);
  }
}

export interface CreatorApplication {
  username: string;
  name: string;
  legal_name: string;
  phone: string;
  instagram: string;
  followers: number;
  bio: string;
}

// Segmentos de rota que não podem virar /shop/<username>
const RESERVED_USERNAMES = new Set(["circles", "product", "my", "collections", "discover", "group", "admin", "brand"]);

/** Candidatura do criador (/apply/creator): entra na lista de espera. */
export function applyCreator(db: DB, a: CreatorApplication): number {
  const username = a.username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
  if (!username || username.length < 3) throw new Error("Nome de usuário precisa de pelo menos 3 letras ou números.");
  if (!a.name.trim()) throw new Error("Informe o nome público.");
  if (RESERVED_USERNAMES.has(username) || getUserByUsername(db, username)) throw new Error("Esse nome de usuário já existe.");
  return Number(
    db
      .prepare(
        `INSERT INTO users (username, name, legal_name, phone, role, status, bio, instagram, followers)
         VALUES (?, ?, ?, ?, 'creator', 'waitlist', ?, ?, ?)`,
      )
      .run(username, a.name.trim(), a.legal_name.trim(), a.phone.trim(), a.bio.trim(), a.instagram.trim(), a.followers || 0)
      .lastInsertRowid,
  );
}

export function setUserStatus(db: DB, userId: number, status: User["status"]) {
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
}

// ---------- Catálogo (lado consumidor) ----------

export function catalogHierarchy(db: DB) {
  return db.prepare("SELECT * FROM categories ORDER BY industry, department, name").all() as {
    id: number;
    industry: string;
    department: string;
    name: string;
  }[];
}

export function listProducts(
  db: DB,
  opts: { categoryId?: number; department?: string; q?: string; sort?: "month" | "week" | "promoters"; brandId?: number } = {},
): ProductWithStats[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.categoryId) {
    where.push("p.category_id = ?");
    params.push(opts.categoryId);
  }
  if (opts.department) {
    where.push("c.department = ?");
    params.push(opts.department);
  }
  if (opts.brandId) {
    where.push("p.brand_id = ?");
    params.push(opts.brandId);
  }
  if (opts.q) {
    where.push("(p.title LIKE ? OR b.name LIKE ?)");
    params.push(`%${opts.q}%`, `%${opts.q}%`);
  }
  const order = opts.sort === "week" ? "clicks_week" : opts.sort === "promoters" ? "num_promoters" : "clicks_month";
  const sql = `
    SELECT p.*, b.name AS brand_name, c.name AS category, c.department, c.industry, ${PRODUCT_STATS}
    FROM products p JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY ${order} DESC, p.id`;
  return db.prepare(sql).all(...params) as ProductWithStats[];
}

export function getProduct(db: DB, id: number): ProductWithStats | undefined {
  return db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category, c.department, c.industry, ${PRODUCT_STATS}
       FROM products p JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    )
    .get(id) as ProductWithStats | undefined;
}

/** Curadores que recomendam o produto, com o link de cada um. */
export function productPromoters(db: DB, productId: number) {
  return db
    .prepare(
      `SELECT u.id, u.username, u.name, u.trust_score, pi.id AS pin_id,
         (SELECT count(*) FROM clicks k WHERE k.pin_id = pi.id AND k.created_at >= datetime('now','-30 days')) AS clicks_month
       FROM pins pi JOIN users u ON u.id = pi.user_id
       WHERE pi.product_id = ? AND pi.archived = 0 AND u.status = 'active'
       GROUP BY u.id ORDER BY u.trust_score DESC`,
    )
    .all(productId) as { id: number; username: string; name: string; trust_score: number; pin_id: number; clicks_month: number }[];
}

export function listCurators(db: DB, limit = 50) {
  return db
    .prepare(
      `SELECT u.*, (SELECT count(*) FROM follows f WHERE f.curator_id = u.id) AS trusted_by,
         (SELECT count(*) FROM pins pi WHERE pi.user_id = u.id) AS num_pins
       FROM users u WHERE u.role = 'creator' AND u.status = 'active'
       ORDER BY u.trust_score DESC LIMIT ?`,
    )
    .all(limit) as (User & { trusted_by: number; num_pins: number })[];
}

// ---------- Links rastreados (Pins) ----------

function pinStatsSql(where: string) {
  return `
    SELECT pi.*,
      (SELECT count(*) FROM clicks k WHERE k.pin_id = pi.id AND k.created_at >= datetime('now','-30 days')) AS clicks_month,
      (SELECT count(*) FROM clicks k WHERE k.pin_id = pi.id) AS clicks_total,
      (SELECT count(*) FROM orders o WHERE o.pin_id = pi.id AND o.status != 'cancelled') AS orders,
      (SELECT coalesce(sum(o.commission_cents),0) FROM orders o WHERE o.pin_id = pi.id AND o.status != 'cancelled') AS commission_cents
    FROM pins pi WHERE ${where}`;
}

function hydratePins(db: DB, rows: Omit<PinRow, "product" | "rate">[]): PinRow[] {
  const getProd = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`);
  return rows.map((r) => {
    const product = getProd.get(r.product_id) as Product;
    return { ...r, product, rate: rateFor(db, product.brand_id, r.user_id) };
  });
}

export function userPins(db: DB, userId: number): PinRow[] {
  return hydratePins(db, db.prepare(pinStatsSql("pi.user_id = ? AND pi.archived = 0") + " ORDER BY pi.created_at DESC").all(userId) as never);
}

export function collectionPins(db: DB, collectionId: number): PinRow[] {
  return hydratePins(db, db.prepare(pinStatsSql("pi.collection_id = ? AND pi.archived = 0") + " ORDER BY pi.id").all(collectionId) as never);
}

export function getPin(db: DB, pinId: number) {
  return db.prepare("SELECT * FROM pins WHERE id = ?").get(pinId) as
    | { id: number; user_id: number; product_id: number; collection_id: number | null }
    | undefined;
}

export function createPin(db: DB, userId: number, productId: number, collectionId: number | null, note = ""): number {
  const user = getUser(db, userId);
  if (!user || user.role !== "creator") throw new Error("Só criadores criam links.");
  if (user.status !== "active") throw new Error("Sua candidatura ainda está na lista de espera.");
  if (collectionId) {
    const c = db.prepare("SELECT user_id FROM collections WHERE id = ?").get(collectionId) as { user_id: number } | undefined;
    if (!c || c.user_id !== userId) throw new Error("Coleção inválida.");
  }
  return Number(
    db.prepare("INSERT INTO pins (user_id, product_id, collection_id, note) VALUES (?, ?, ?, ?)").run(userId, productId, collectionId, note)
      .lastInsertRowid,
  );
}

export function deletePin(db: DB, userId: number, pinId: number) {
  const pin = getPin(db, pinId);
  if (!pin || pin.user_id !== userId) throw new Error("Link não encontrado.");
  // Arquiva em vez de apagar: cliques e pedidos já atribuídos continuam no histórico.
  db.prepare("UPDATE pins SET archived = 1, collection_id = NULL WHERE id = ?").run(pinId);
}

/**
 * Redirecionador: registra o clique e devolve o destino.
 * Equivale a go.shopmy.us/p-<id>; o parâmetro de atribuição vai na URL.
 */
export function recordClick(db: DB, pinId: number, country: string | null = null): string | null {
  const row = db
    .prepare("SELECT pr.url FROM pins pi JOIN products pr ON pr.id = pi.product_id WHERE pi.id = ?")
    .get(pinId) as { url: string } | undefined;
  if (!row) return null;
  db.prepare("INSERT INTO clicks (pin_id, country) VALUES (?, ?)").run(pinId, country);
  const url = new URL(row.url);
  url.searchParams.set("sift_pin", String(pinId));
  return url.toString();
}

/** Taxa efetiva: personalizada (CustomRates) ou padrão da marca. */
export function rateFor(db: DB, brandId: number, userId: number): number {
  const custom = db.prepare("SELECT rate FROM custom_rates WHERE brand_id = ? AND user_id = ?").get(brandId, userId) as
    | { rate: number }
    | undefined;
  if (custom) return custom.rate;
  return (db.prepare("SELECT default_commission_rate AS r FROM brands WHERE id = ?").get(brandId) as { r: number }).r;
}

export function setCustomRate(db: DB, brandId: number, userId: number, rate: number) {
  if (!(rate > 0 && rate <= 0.5)) throw new Error("Taxa deve ficar entre 0% e 50%.");
  db.prepare(
    "INSERT INTO custom_rates (brand_id, user_id, rate) VALUES (?, ?, ?) ON CONFLICT(brand_id, user_id) DO UPDATE SET rate = excluded.rate",
  ).run(brandId, userId, rate);
}

/** Webhook de pedido da loja (Shopify, Nuvemshop...): atribui a venda ao link. */
export function recordOrder(db: DB, pinId: number, amountCents: number): number {
  const pin = db
    .prepare("SELECT pi.user_id, pr.brand_id FROM pins pi JOIN products pr ON pr.id = pi.product_id WHERE pi.id = ?")
    .get(pinId) as { user_id: number; brand_id: number } | undefined;
  if (!pin) throw new Error("Link não encontrado.");
  const commission = commissionFor(amountCents, rateFor(db, pin.brand_id, pin.user_id));
  return Number(
    db.prepare("INSERT INTO orders (pin_id, amount_cents, commission_cents) VALUES (?, ?, ?)").run(pinId, amountCents, commission)
      .lastInsertRowid,
  );
}

// ---------- Coleções e vitrine ----------

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  kind: "shelf" | "look" | "post" | "guide";
  position: number;
}

export function userCollections(db: DB, userId: number): Collection[] {
  return db.prepare("SELECT * FROM collections WHERE user_id = ? ORDER BY position, id").all(userId) as Collection[];
}

export function createCollection(db: DB, userId: number, name: string, kind: Collection["kind"]): number {
  if (!name.trim()) throw new Error("Dê um nome à coleção.");
  const { m } = db.prepare("SELECT coalesce(max(position),0) AS m FROM collections WHERE user_id = ?").get(userId) as { m: number };
  return Number(
    db.prepare("INSERT INTO collections (user_id, name, kind, position) VALUES (?, ?, ?, ?)").run(userId, name.trim(), kind, m + 1)
      .lastInsertRowid,
  );
}

export function curatorShop(db: DB, username: string) {
  const user = getUserByUsername(db, username);
  if (!user || user.role !== "creator" || user.status !== "active") return null;
  const collections = userCollections(db, user.id).map((c) => ({ ...c, pins: collectionPins(db, c.id) }));
  const all = userPins(db, user.id);
  const popular = [...all].sort((a, b) => b.clicks_month - a.clicks_month).slice(0, 8);
  const latest = all.slice(0, 8);
  return { user, tier: tierFor(user.trust_score), trustedBy: trustedByCount(db, user.id), collections, popular, latest };
}

// ---------- Circles ----------

export function listCircles(db: DB, ownerId?: number) {
  const rows = (
    ownerId
      ? db.prepare("SELECT * FROM curator_groups WHERE owner_id = ? ORDER BY id").all(ownerId)
      : db.prepare("SELECT * FROM curator_groups WHERE owner_id IS NULL ORDER BY id").all()
  ) as { id: number; owner_id: number | null; name: string; description: string }[];
  return rows.map((g) => ({ ...g, curators: circleCurators(db, g.id) }));
}

export function circleCurators(db: DB, groupId: number) {
  return db
    .prepare(
      "SELECT u.* FROM curator_group_users gu JOIN users u ON u.id = gu.user_id WHERE gu.group_id = ? ORDER BY u.trust_score DESC",
    )
    .all(groupId) as User[];
}

export function getCircle(db: DB, id: number) {
  const g = db.prepare("SELECT * FROM curator_groups WHERE id = ?").get(id) as
    | { id: number; owner_id: number | null; name: string; description: string }
    | undefined;
  if (!g) return null;
  const curators = circleCurators(db, id);
  // Loja combinada: produtos recomendados por qualquer curador do circle
  const products = db
    .prepare(
      `SELECT p.*, b.name AS brand_name, c.name AS category, c.department, c.industry, ${PRODUCT_STATS},
         (SELECT count(DISTINCT pi.user_id) FROM pins pi JOIN curator_group_users gu ON gu.user_id = pi.user_id
          WHERE pi.product_id = p.id AND gu.group_id = ?) AS in_circle
       FROM products p JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id
       WHERE in_circle > 0 ORDER BY in_circle DESC, clicks_month DESC`,
    )
    .all(id) as (ProductWithStats & { in_circle: number })[];
  return { ...g, curators, products };
}

export function createCircle(db: DB, ownerId: number, name: string, curatorIds: number[]): number {
  if (!name.trim()) throw new Error("Dê um nome ao circle.");
  return db.transaction(() => {
    const id = Number(db.prepare("INSERT INTO curator_groups (owner_id, name) VALUES (?, ?)").run(ownerId, name.trim()).lastInsertRowid);
    const ins = db.prepare("INSERT OR IGNORE INTO curator_group_users (group_id, user_id) VALUES (?, ?)");
    for (const c of curatorIds) ins.run(id, c);
    return id;
  })();
}

// ---------- Painel do criador ----------

export function creatorSummary(db: DB, userId: number) {
  const q = (sql: string) => (db.prepare(sql).get(userId) as { n: number }).n;
  const clicks30 = q(
    "SELECT count(*) AS n FROM clicks k JOIN pins pi ON pi.id = k.pin_id WHERE pi.user_id = ? AND k.created_at >= datetime('now','-30 days')",
  );
  const orders30 = q(
    "SELECT count(*) AS n FROM orders o JOIN pins pi ON pi.id = o.pin_id WHERE pi.user_id = ? AND o.status != 'cancelled' AND o.created_at >= datetime('now','-30 days')",
  );
  const earnings = earningsSummary(db, userId);
  const daily = db
    .prepare(
      `SELECT date(k.created_at) AS day, count(*) AS clicks FROM clicks k JOIN pins pi ON pi.id = k.pin_id
       WHERE pi.user_id = ? AND k.created_at >= datetime('now','-30 days') GROUP BY day ORDER BY day`,
    )
    .all(userId) as { day: string; clicks: number }[];
  return { clicks30, orders30, conversion: clicks30 ? orders30 / clicks30 : 0, ...earnings, daily };
}

/** Saldo do criador. Comissão vira "aprovada" depois da janela de devolução. */
export function earningsSummary(db: DB, userId: number) {
  const sum = (where: string) =>
    (
      db
        .prepare(
          `SELECT coalesce(sum(o.commission_cents),0) AS n FROM orders o JOIN pins pi ON pi.id = o.pin_id WHERE pi.user_id = ? AND ${where}`,
        )
        .get(userId) as { n: number }
    ).n;
  const commissionPending = sum("o.status = 'pending'");
  const commissionAvailable = sum("o.status IN ('approved','paid')");
  const contractEarned = (
    db
      .prepare(
        `SELECT coalesce(sum(t.price_cents),0) AS n FROM contract_tasks t JOIN contracts c ON c.id = t.contract_id
         WHERE c.user_id = ? AND t.status = 'approved'`,
      )
      .get(userId) as { n: number }
  ).n;
  const opportunityEarned = (
    db
      .prepare(
        `SELECT coalesce(sum(o.payment_cents),0) AS n FROM opportunity_users ou JOIN opportunities o ON o.id = ou.opportunity_id
         WHERE ou.user_id = ? AND ou.status = 'paid'`,
      )
      .get(userId) as { n: number }
  ).n;
  const paidOut = (
    db.prepare("SELECT coalesce(sum(amount_cents),0) AS n FROM payouts WHERE user_id = ?").get(userId) as { n: number }
  ).n;
  const available = Math.max(0, commissionAvailable + contractEarned + opportunityEarned - paidOut);
  return { commissionPending, commissionAvailable, contractEarned, opportunityEarned, paidOut, available };
}

export function listPayouts(db: DB, userId: number) {
  return db.prepare("SELECT * FROM payouts WHERE user_id = ? ORDER BY created_at DESC").all(userId) as {
    id: number;
    amount_cents: number;
    method: string;
    status: string;
    created_at: string;
  }[];
}

export function requestPayout(db: DB, userId: number, method: string): number {
  const { available } = earningsSummary(db, userId);
  if (available <= 0) throw new Error("Não há saldo disponível para saque.");
  return Number(
    db.prepare("INSERT INTO payouts (user_id, amount_cents, method) VALUES (?, ?, ?)").run(userId, available, method).lastInsertRowid,
  );
}

export function monthlyEarnings(db: DB, userId: number) {
  return db
    .prepare(
      `SELECT strftime('%Y-%m', o.created_at) AS month, count(*) AS orders, sum(o.amount_cents) AS sales_cents,
         sum(o.commission_cents) AS commission_cents
       FROM orders o JOIN pins pi ON pi.id = o.pin_id WHERE pi.user_id = ? AND o.status != 'cancelled'
       GROUP BY month ORDER BY month DESC`,
    )
    .all(userId) as { month: string; orders: number; sales_cents: number; commission_cents: number }[];
}

// ---------- Brands ----------

export function getBrand(db: DB, id: number): Brand | undefined {
  return db.prepare("SELECT * FROM brands WHERE id = ?").get(id) as Brand | undefined;
}

export function listBrands(db: DB): Brand[] {
  return db.prepare("SELECT * FROM brands ORDER BY name").all() as Brand[];
}

export function updateIntegration(
  db: DB,
  brandId: number,
  patch: Partial<Pick<Brand, "integration" | "click_tracking_ok" | "order_tracking_ok" | "order_updates_ok" | "order_cancellations_ok">>,
) {
  const brand = getBrand(db, brandId);
  if (!brand) throw new Error("Marca não encontrada.");
  const next = { ...brand, ...patch };
  const done = next.integration && next.click_tracking_ok && next.order_tracking_ok;
  db.prepare(
    `UPDATE brands SET integration = ?, click_tracking_ok = ?, order_tracking_ok = ?, order_updates_ok = ?,
       order_cancellations_ok = ?, onboarded_at = ? WHERE id = ?`,
  ).run(
    next.integration,
    next.click_tracking_ok,
    next.order_tracking_ok,
    next.order_updates_ok,
    next.order_cancellations_ok,
    done ? (brand.onboarded_at ?? new Date().toISOString().slice(0, 10)) : null,
    brandId,
  );
}

/** Track: visão geral da marca (Pins/analytics/brand/*). */
export function brandAnalytics(db: DB, brandId: number) {
  const one = (sql: string) => (db.prepare(sql).get(brandId) as { n: number }).n;
  const clicks30 = one(
    `SELECT count(*) AS n FROM clicks k JOIN pins pi ON pi.id = k.pin_id JOIN products pr ON pr.id = pi.product_id
     WHERE pr.brand_id = ? AND k.created_at >= datetime('now','-30 days')`,
  );
  const sales = db
    .prepare(
      `SELECT count(*) AS orders, coalesce(sum(o.amount_cents),0) AS revenue, coalesce(sum(o.commission_cents),0) AS commission
       FROM orders o JOIN pins pi ON pi.id = o.pin_id JOIN products pr ON pr.id = pi.product_id
       WHERE pr.brand_id = ? AND o.status != 'cancelled'`,
    )
    .get(brandId) as { orders: number; revenue: number; commission: number };
  const promoters = db
    .prepare(
      `SELECT u.*, count(DISTINCT pi.id) AS pins,
         (SELECT count(*) FROM clicks k JOIN pins p2 ON p2.id = k.pin_id JOIN products r2 ON r2.id = p2.product_id
          WHERE p2.user_id = u.id AND r2.brand_id = ? AND k.created_at >= datetime('now','-30 days')) AS clicks_month,
         (SELECT coalesce(sum(o.amount_cents),0) FROM orders o JOIN pins p2 ON p2.id = o.pin_id JOIN products r2 ON r2.id = p2.product_id
          WHERE p2.user_id = u.id AND r2.brand_id = ? AND o.status != 'cancelled') AS revenue
       FROM pins pi JOIN products pr ON pr.id = pi.product_id JOIN users u ON u.id = pi.user_id
       WHERE pr.brand_id = ? GROUP BY u.id ORDER BY revenue DESC, clicks_month DESC`,
    )
    .all(brandId, brandId, brandId) as (User & { pins: number; clicks_month: number; revenue: number })[];
  const byTier: Record<string, number> = { Icon: 0, Trendsetter: 0, Ambassador: 0, Enthusiast: 0 };
  for (const p of promoters) byTier[tierFor(p.trust_score).name]++;
  const products = listProducts(db, { brandId });
  return { clicks30, ...sales, promoters, byTier, products };
}

/** Discover: busca de criadores por vendas reais, audiência e tier. */
export function discoverCreators(
  db: DB,
  brandId: number,
  f: { q?: string; minFollowers?: number; minScore?: number; department?: string } = {},
) {
  const where = ["u.role = 'creator'", "u.status = 'active'"];
  const params: unknown[] = [];
  if (f.q) {
    where.push("(u.name LIKE ? OR u.bio LIKE ? OR u.location LIKE ? OR u.username LIKE ?)");
    params.push(...Array(4).fill(`%${f.q}%`));
  }
  if (f.minFollowers) {
    where.push("u.followers >= ?");
    params.push(f.minFollowers);
  }
  if (f.minScore) {
    where.push("u.trust_score >= ?");
    params.push(f.minScore);
  }
  if (f.department) {
    where.push(
      "EXISTS (SELECT 1 FROM pins pi JOIN products pr ON pr.id = pi.product_id JOIN categories c ON c.id = pr.category_id WHERE pi.user_id = u.id AND c.department = ?)",
    );
    params.push(f.department);
  }
  return db
    .prepare(
      `SELECT u.*,
         (SELECT coalesce(sum(o.amount_cents),0) FROM orders o JOIN pins pi ON pi.id = o.pin_id
          WHERE pi.user_id = u.id AND o.status != 'cancelled') AS total_sales,
         (SELECT count(*) FROM pins pi JOIN products pr ON pr.id = pi.product_id WHERE pi.user_id = u.id AND pr.brand_id = ?) AS brand_pins,
         (SELECT group_concat(DISTINCT c.department) FROM pins pi JOIN products pr ON pr.id = pi.product_id
          JOIN categories c ON c.id = pr.category_id WHERE pi.user_id = u.id) AS departments
       FROM users u WHERE ${where.join(" AND ")} ORDER BY u.trust_score DESC`,
    )
    .all(brandId, ...params) as (User & { total_sales: number; brand_pins: number; departments: string | null })[];
}

// ---------- Opportunities ----------

export interface Opportunity {
  id: number;
  brand_id: number;
  brand_name: string;
  title: string;
  brief: string;
  payment_cents: number;
  status: string;
  created_at: string;
}

export function brandOpportunities(db: DB, brandId: number) {
  const opps = db
    .prepare("SELECT o.*, b.name AS brand_name FROM opportunities o JOIN brands b ON b.id = o.brand_id WHERE o.brand_id = ? ORDER BY o.id DESC")
    .all(brandId) as Opportunity[];
  const members = db.prepare(
    "SELECT ou.*, u.name, u.username, u.trust_score FROM opportunity_users ou JOIN users u ON u.id = ou.user_id WHERE ou.opportunity_id = ?",
  );
  return opps.map((o) => ({
    ...o,
    members: members.all(o.id) as { user_id: number; status: string; submission_url: string | null; name: string; username: string; trust_score: number }[],
  }));
}

export function creatorOpportunities(db: DB, userId: number) {
  return db
    .prepare(
      `SELECT o.*, b.name AS brand_name, ou.status AS my_status, ou.submission_url
       FROM opportunity_users ou JOIN opportunities o ON o.id = ou.opportunity_id JOIN brands b ON b.id = o.brand_id
       WHERE ou.user_id = ? ORDER BY o.id DESC`,
    )
    .all(userId) as (Opportunity & { my_status: string; submission_url: string | null })[];
}

export function createOpportunity(db: DB, brandId: number, title: string, brief: string, paymentCents: number, inviteIds: number[]) {
  if (!title.trim() || !brief.trim()) throw new Error("Título e brief são obrigatórios.");
  return db.transaction(() => {
    const id = Number(
      db.prepare("INSERT INTO opportunities (brand_id, title, brief, payment_cents) VALUES (?, ?, ?, ?)").run(
        brandId, title.trim(), brief.trim(), Math.max(0, paymentCents),
      ).lastInsertRowid,
    );
    const ins = db.prepare("INSERT OR IGNORE INTO opportunity_users (opportunity_id, user_id) VALUES (?, ?)");
    for (const u of inviteIds) ins.run(id, u);
    return id;
  })();
}

const OPP_TRANSITIONS: Record<string, string[]> = {
  invited: ["accepted", "declined"],
  accepted: ["submitted"],
  submitted: ["paid"],
};

export function updateOpportunityStatus(db: DB, opportunityId: number, userId: number, status: string, submissionUrl?: string) {
  const row = db.prepare("SELECT status FROM opportunity_users WHERE opportunity_id = ? AND user_id = ?").get(opportunityId, userId) as
    | { status: string }
    | undefined;
  if (!row) throw new Error("Convite não encontrado.");
  if (!OPP_TRANSITIONS[row.status]?.includes(status)) throw new Error(`Não dá para ir de "${row.status}" para "${status}".`);
  if (status === "submitted" && !submissionUrl?.trim()) throw new Error("Envie o link do post.");
  db.prepare("UPDATE opportunity_users SET status = ?, submission_url = coalesce(?, submission_url) WHERE opportunity_id = ? AND user_id = ?").run(
    status, submissionUrl?.trim() || null, opportunityId, userId,
  );
}

// ---------- Collaborations (Contracts) ----------

export interface ContractTask {
  id: number;
  contract_id: number;
  title: string;
  price_cents: number;
  due_date: string | null;
  status: "pending" | "submitted" | "approved";
  content_url: string | null;
}

export function listContracts(db: DB, by: { brandId?: number; userId?: number }) {
  const rows = db
    .prepare(
      `SELECT c.*, b.name AS brand_name, u.name AS creator_name, u.username
       FROM contracts c JOIN brands b ON b.id = c.brand_id JOIN users u ON u.id = c.user_id
       WHERE ${by.brandId ? "c.brand_id = ?" : "c.user_id = ?"} ORDER BY c.id DESC`,
    )
    .all(by.brandId ?? by.userId) as {
    id: number;
    brand_id: number;
    user_id: number;
    title: string;
    terms: string;
    status: string;
    brand_name: string;
    creator_name: string;
    username: string;
  }[];
  const tasks = db.prepare("SELECT * FROM contract_tasks WHERE contract_id = ? ORDER BY due_date, id");
  return rows.map((c) => {
    const t = tasks.all(c.id) as ContractTask[];
    return { ...c, tasks: t, total_cents: t.reduce((s, x) => s + x.price_cents, 0) };
  });
}

export function createContract(
  db: DB,
  brandId: number,
  userId: number,
  title: string,
  terms: string,
  tasks: { title: string; price_cents: number; due_date?: string }[],
): number {
  if (!title.trim()) throw new Error("Dê um título à proposta.");
  if (!tasks.length) throw new Error("Inclua pelo menos um entregável.");
  return db.transaction(() => {
    const id = Number(
      db.prepare("INSERT INTO contracts (brand_id, user_id, title, terms) VALUES (?, ?, ?, ?)").run(brandId, userId, title.trim(), terms.trim())
        .lastInsertRowid,
    );
    const ins = db.prepare("INSERT INTO contract_tasks (contract_id, title, price_cents, due_date) VALUES (?, ?, ?, ?)");
    for (const t of tasks) ins.run(id, t.title, t.price_cents, t.due_date || null);
    return id;
  })();
}

export function respondContract(db: DB, contractId: number, userId: number, accept: boolean) {
  const c = db.prepare("SELECT user_id, status FROM contracts WHERE id = ?").get(contractId) as { user_id: number; status: string } | undefined;
  if (!c || c.user_id !== userId) throw new Error("Proposta não encontrada.");
  if (c.status !== "proposed") throw new Error("Essa proposta já foi respondida.");
  db.prepare("UPDATE contracts SET status = ? WHERE id = ?").run(accept ? "active" : "rejected", contractId);
}

export function submitTask(db: DB, taskId: number, userId: number, contentUrl: string) {
  const t = db
    .prepare("SELECT t.status, c.user_id, c.status AS cstatus FROM contract_tasks t JOIN contracts c ON c.id = t.contract_id WHERE t.id = ?")
    .get(taskId) as { status: string; user_id: number; cstatus: string } | undefined;
  if (!t || t.user_id !== userId) throw new Error("Entregável não encontrado.");
  if (t.cstatus !== "active") throw new Error("A collaboration não está ativa.");
  if (!contentUrl.trim()) throw new Error("Envie o link do conteúdo.");
  db.prepare("UPDATE contract_tasks SET status = 'submitted', content_url = ? WHERE id = ?").run(contentUrl.trim(), taskId);
}

export function approveTask(db: DB, taskId: number, brandId: number) {
  const t = db
    .prepare("SELECT t.status, t.contract_id, c.brand_id FROM contract_tasks t JOIN contracts c ON c.id = t.contract_id WHERE t.id = ?")
    .get(taskId) as { status: string; contract_id: number; brand_id: number } | undefined;
  if (!t || t.brand_id !== brandId) throw new Error("Entregável não encontrado.");
  if (t.status !== "submitted") throw new Error("O criador ainda não enviou esse entregável.");
  db.transaction(() => {
    db.prepare("UPDATE contract_tasks SET status = 'approved' WHERE id = ?").run(taskId);
    const left = db.prepare("SELECT count(*) AS n FROM contract_tasks WHERE contract_id = ? AND status != 'approved'").get(t.contract_id) as {
      n: number;
    };
    if (left.n === 0) db.prepare("UPDATE contracts SET status = 'completed' WHERE id = ?").run(t.contract_id);
  })();
}

// ---------- Gifting (Lookbooks) ----------

export function brandLookbooks(db: DB, brandId: number) {
  const lbs = db.prepare("SELECT * FROM lookbooks WHERE brand_id = ? ORDER BY id DESC").all(brandId) as {
    id: number;
    title: string;
    message: string;
  }[];
  return lbs.map((l) => lookbookDetail(db, l.id)!);
}

export function lookbookDetail(db: DB, id: number) {
  const lb = db.prepare("SELECT l.*, b.name AS brand_name FROM lookbooks l JOIN brands b ON b.id = l.brand_id WHERE l.id = ?").get(id) as
    | { id: number; brand_id: number; brand_name: string; title: string; message: string }
    | undefined;
  if (!lb) return null;
  const items = db.prepare(`${PRODUCT_SELECT} JOIN lookbook_items li ON li.product_id = p.id WHERE li.lookbook_id = ?`).all(id) as Product[];
  const invites = db
    .prepare(
      `SELECT li.*, u.name, u.username, pr.title AS product_title FROM lookbook_invites li JOIN users u ON u.id = li.user_id
       LEFT JOIN products pr ON pr.id = li.product_id WHERE li.lookbook_id = ?`,
    )
    .all(id) as { user_id: number; status: string; name: string; username: string; product_title: string | null }[];
  return { ...lb, items, invites };
}

export function createLookbook(db: DB, brandId: number, title: string, message: string, productIds: number[]): number {
  if (!title.trim()) throw new Error("Dê um título ao lookbook.");
  if (!productIds.length) throw new Error("Escolha pelo menos um produto.");
  return db.transaction(() => {
    const id = Number(
      db.prepare("INSERT INTO lookbooks (brand_id, title, message) VALUES (?, ?, ?)").run(brandId, title.trim(), message.trim()).lastInsertRowid,
    );
    const ins = db.prepare("INSERT INTO lookbook_items (lookbook_id, product_id) SELECT ?, id FROM products WHERE id = ? AND brand_id = ?");
    for (const p of productIds) ins.run(id, p, brandId);
    return id;
  })();
}

export function inviteToLookbook(db: DB, lookbookId: number, userIds: number[]) {
  const ins = db.prepare("INSERT OR IGNORE INTO lookbook_invites (lookbook_id, user_id) VALUES (?, ?)");
  db.transaction(() => userIds.forEach((u) => ins.run(lookbookId, u)))();
}

export function creatorGifting(db: DB, userId: number) {
  const ids = db.prepare("SELECT lookbook_id, status FROM lookbook_invites WHERE user_id = ? ORDER BY lookbook_id DESC").all(userId) as {
    lookbook_id: number;
    status: string;
  }[];
  return ids.map((i) => ({ ...lookbookDetail(db, i.lookbook_id)!, my_status: i.status }));
}

/** O criador escolhe o presente; na integração real o pedido cai na loja da marca. */
export function orderFromLookbook(db: DB, lookbookId: number, userId: number, productId: number) {
  const inv = db.prepare("SELECT status FROM lookbook_invites WHERE lookbook_id = ? AND user_id = ?").get(lookbookId, userId) as
    | { status: string }
    | undefined;
  if (!inv) throw new Error("Convite não encontrado.");
  if (inv.status !== "invited") throw new Error("Você já respondeu esse convite.");
  const inLb = db.prepare("SELECT 1 FROM lookbook_items WHERE lookbook_id = ? AND product_id = ?").get(lookbookId, productId);
  if (!inLb) throw new Error("Produto não está no lookbook.");
  db.prepare("UPDATE lookbook_invites SET status = 'ordered', product_id = ? WHERE lookbook_id = ? AND user_id = ?").run(
    productId, lookbookId, userId,
  );
}

// ---------- Chat ----------

export function chatThreads(db: DB, by: { brandId?: number; userId?: number }) {
  const col = by.brandId ? "m.brand_id" : "m.user_id";
  return db
    .prepare(
      `SELECT m.brand_id, m.user_id, b.name AS brand_name, u.name AS creator_name, max(m.created_at) AS last_at,
         (SELECT body FROM chat_messages m2 WHERE m2.brand_id = m.brand_id AND m2.user_id = m.user_id ORDER BY m2.id DESC LIMIT 1) AS last_body
       FROM chat_messages m JOIN brands b ON b.id = m.brand_id JOIN users u ON u.id = m.user_id
       WHERE ${col} = ? GROUP BY m.brand_id, m.user_id ORDER BY last_at DESC`,
    )
    .all(by.brandId ?? by.userId) as {
    brand_id: number;
    user_id: number;
    brand_name: string;
    creator_name: string;
    last_at: string;
    last_body: string;
  }[];
}

export function chatMessages(db: DB, brandId: number, userId: number) {
  return db.prepare("SELECT * FROM chat_messages WHERE brand_id = ? AND user_id = ? ORDER BY id").all(brandId, userId) as {
    id: number;
    from_brand: number;
    body: string;
    created_at: string;
  }[];
}

/** Criador só inicia conversa a partir do tier Trendsetter; marca sempre pode. */
export function sendChat(db: DB, brandId: number, userId: number, fromBrand: boolean, body: string) {
  if (!body.trim()) throw new Error("Mensagem vazia.");
  if (!fromBrand) {
    const started = db.prepare("SELECT 1 FROM chat_messages WHERE brand_id = ? AND user_id = ?").get(brandId, userId);
    const user = getUser(db, userId)!;
    if (!started && !tierFor(user.trust_score).canChatBrands) {
      throw new Error("Iniciar conversa com marcas libera no tier Trendsetter.");
    }
  }
  db.prepare("INSERT INTO chat_messages (brand_id, user_id, from_brand, body) VALUES (?, ?, ?, ?)").run(brandId, userId, fromBrand ? 1 : 0, body.trim());
}
