import type Database from "better-sqlite3";
import { commissionFor } from "./money";
import CATALOG from "./catalog.json";
import { classify, type Format } from "./taxonomy";

// Dados de demonstração. Marcas e criadores são fictícios.

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const BRANDS = [
  { name: "Aurora Skincare", domain: "aurora.com.br", description: "Skincare brasileiro com ativos da Amazônia.", rate: 0.15, integration: "nuvemshop" },
  { name: "Casa Linho", domain: "casalinho.com.br", description: "Roupa de cama e mesa em linho.", rate: 0.12, integration: "shopify" },
  { name: "Brisa Swim", domain: "brisaswim.com", description: "Moda praia feita no Rio.", rate: 0.18, integration: "vtex" },
  { name: "Ateliê Norte", domain: "atelienorte.com.br", description: "Bolsas e acessórios de couro.", rate: 0.1, integration: "tray" },
  { name: "Lume Beauty", domain: "lumebeauty.com", description: "Maquiagem de alta performance.", rate: 0.14, integration: null },
];

const CATEGORIES = [
  ["Beleza", "Skincare", "Hidratantes"],
  ["Beleza", "Skincare", "Séruns"],
  ["Beleza", "Maquiagem", "Base"],
  ["Beleza", "Maquiagem", "Batom"],
  ["Moda", "Roupas", "Moda praia"],
  ["Moda", "Acessórios", "Bolsas"],
  ["Casa", "Quarto", "Roupa de cama"],
  ["Casa", "Mesa", "Toalhas de mesa"],
];

// [título, marca (índice), categoria (índice), preço em reais, cor]
const PRODUCTS: [string, number, number, number, string][] = [
  ["Creme Hidratante Açaí", 0, 0, 129, "#c9a0a0"],
  ["Sérum Vitamina C 20%", 0, 1, 189, "#e7c27d"],
  ["Sérum Niacinamida", 0, 1, 159, "#d7d0b5"],
  ["Lençol de Linho Areia", 1, 6, 690, "#d8cbb3"],
  ["Jogo de Fronhas Linho", 1, 6, 240, "#b9b29f"],
  ["Toalha de Mesa Linho Cru", 1, 7, 380, "#e4ddcc"],
  ["Biquíni Ipanema Terracota", 2, 4, 289, "#c4704f"],
  ["Maiô Arpoador Preto", 2, 4, 349, "#2d2b2a"],
  ["Saída de Praia Linho", 2, 4, 259, "#efe6d6"],
  ["Bolsa Tote Caramelo", 3, 5, 890, "#a8683a"],
  ["Mini Bag Couro Off-white", 3, 5, 640, "#ece4d6"],
  ["Base Sérum Glow", 4, 2, 179, "#d7a98a"],
  ["Batom Matte Tijolo", 4, 3, 89, "#9e3d2c"],
  ["Batom Gloss Nude", 4, 3, 79, "#c99083"],
];

// [username, nome, bio, instagram, seguidores, local, trust_score, status]
const CREATORS: [string, string, string, string, number, string, number, string][] = [
  ["marinaskin", "Marina Couto", "Dermatologista. Só indico o que uso no consultório.", "@marinaskin", 412000, "São Paulo, SP", 91, "active"],
  ["casadabia", "Bia Fontes", "Arquiteta de interiores. Casa bonita sem pressa.", "@casadabia", 186000, "Belo Horizonte, MG", 78, "active"],
  ["luizaveste", "Luiza Prado", "Stylist. Guarda-roupa que dura.", "@luizaveste", 95000, "Rio de Janeiro, RJ", 72, "active"],
  ["pedroglow", "Pedro Alves", "Maquiador de editorial e noivas.", "@pedroglow", 61000, "Curitiba, PR", 55, "active"],
  ["anapraia", "Ana Ribeiro", "Moda praia e viagem pelo litoral.", "@anapraia", 38000, "Florianópolis, SC", 34, "active"],
  ["joaninhacasa", "Joana Lima", "Decoração de apartamento alugado.", "@joaninhacasa", 12000, "Recife, PE", 18, "active"],
  ["novacriadora", "Camila Reis", "Começando agora.", "@camilareis", 4200, "Salvador, BA", 0, "waitlist"],
];

const SHOPPERS = [
  ["julia", "Júlia Martins"],
  ["rafa", "Rafael Souza"],
  ["carol", "Carolina Dias"],
];

// [username do criador, nome da coleção, tipo, produtos (índices)]
const COLLECTIONS: [string, string, string, number[]][] = [
  ["marinaskin", "Rotina da manhã", "shelf", [1, 2, 0]],
  ["marinaskin", "Make que não pesa", "shelf", [11, 13]],
  ["casadabia", "Quarto de hotel em casa", "shelf", [3, 4]],
  ["casadabia", "Mesa posta", "look", [5]],
  ["luizaveste", "Verão 2027", "look", [6, 8, 10]],
  ["luizaveste", "Bolsas para a vida toda", "shelf", [9, 10]],
  ["pedroglow", "Kit de noiva", "guide", [11, 12, 13, 1]],
  ["anapraia", "Mala de praia", "shelf", [6, 7, 8]],
  ["joaninhacasa", "Quarto alugado", "shelf", [4, 3]],
];

export function seed(db: Database.Database) {
  const rand = rng(42);
  const tx = db.transaction(() => {
    const insBrand = db.prepare(
      `INSERT INTO brands (name, domain, description, default_commission_rate, integration,
         click_tracking_ok, order_tracking_ok, order_updates_ok, order_cancellations_ok, onboarded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const brandIds = BRANDS.map((b) => {
      const ok = b.integration ? 1 : 0;
      return Number(
        insBrand.run(b.name, b.domain, b.description, b.rate, b.integration, ok, ok, ok, ok, ok ? "2026-06-01" : null)
          .lastInsertRowid,
      );
    });

    const insCat = db.prepare("INSERT INTO categories (industry, department, name) VALUES (?, ?, ?)");
    const catIds = CATEGORIES.map((c) => Number(insCat.run(...c).lastInsertRowid));

    const insProd = db.prepare(
      "INSERT INTO products (title, brand_id, category_id, price_cents, url, color) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const prodIds = PRODUCTS.map(([title, b, c, price, color]) => {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return Number(
        insProd.run(title, brandIds[b], catIds[c], price * 100, `https://${BRANDS[b].domain}/p/${slug}`, color)
          .lastInsertRowid,
      );
    });

    const insUser = db.prepare(
      `INSERT INTO users (username, name, legal_name, role, status, bio, instagram, followers, location, trust_score, brand_id)
       VALUES (@username, @name, @legal_name, @role, @status, @bio, @instagram, @followers, @location, @trust_score, @brand_id)`,
    );
    const base = { legal_name: null, bio: "", instagram: null, followers: 0, location: null, trust_score: 0, brand_id: null, status: "active" };
    const creatorIds: Record<string, number> = {};
    for (const [username, name, bio, instagram, followers, location, trust_score, status] of CREATORS) {
      creatorIds[username] = Number(
        insUser.run({ ...base, username, name, legal_name: name, role: "creator", status, bio, instagram, followers, location, trust_score })
          .lastInsertRowid,
      );
    }
    const shopperIds = SHOPPERS.map(([username, name]) =>
      Number(insUser.run({ ...base, username, name, role: "shopper" }).lastInsertRowid),
    );
    insUser.run({ ...base, username: "aurora", name: "Equipe Aurora", role: "brand", brand_id: brandIds[0] });
    insUser.run({ ...base, username: "casalinho", name: "Equipe Casa Linho", role: "brand", brand_id: brandIds[1] });
    insUser.run({ ...base, username: "admin", name: "Admin", role: "admin" });

    // Seguidores ("Trusted by N"): os shoppers seguem alguns curadores
    const insFollow = db.prepare("INSERT OR IGNORE INTO follows (follower_id, curator_id) VALUES (?, ?)");
    shopperIds.forEach((s, i) => {
      insFollow.run(s, creatorIds.marinaskin);
      if (i !== 1) insFollow.run(s, creatorIds.casadabia);
      if (i === 2) insFollow.run(s, creatorIds.luizaveste);
    });

    // Coleções, links (Pins), cliques e pedidos
    const insColl = db.prepare("INSERT INTO collections (user_id, name, kind, position) VALUES (?, ?, ?, ?)");
    const insPin = db.prepare(
      "INSERT INTO pins (user_id, product_id, collection_id, note, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))",
    );
    const insClick = db.prepare("INSERT INTO clicks (pin_id, country, created_at) VALUES (?, ?, datetime('now', ?))");
    const insOrder = db.prepare(
      "INSERT INTO orders (pin_id, amount_cents, commission_cents, status, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))",
    );
    const position: Record<string, number> = {};
    for (const [username, name, kind, products] of COLLECTIONS) {
      const userId = creatorIds[username];
      const score = CREATORS.find((c) => c[0] === username)![6];
      position[username] = (position[username] ?? 0) + 1;
      const collId = Number(insColl.run(userId, name, kind, position[username]).lastInsertRowid);
      for (const p of products) {
        const pinId = Number(insPin.run(userId, prodIds[p], collId, "", `-${70 + Math.floor(rand() * 30)} days`).lastInsertRowid);
        const nClicks = Math.floor((score + 5) * (0.5 + rand()) * 1.2);
        for (let i = 0; i < nClicks; i++) {
          const days = Math.floor(rand() * 60);
          const ago = `-${days} days`;
          insClick.run(pinId, rand() < 0.9 ? "BR" : "PT", ago);
          if (rand() < 0.04) {
            const [, b, , price] = PRODUCTS[p];
            const amount = price * 100;
            const status = rand() < 0.08 ? "cancelled" : days > 30 ? "approved" : "pending";
            insOrder.run(pinId, amount, commissionFor(amount, BRANDS[b].rate), status, ago);
          }
        }
      }
    }

    // Circles: editoriais e um do consumidor
    const insGroup = db.prepare("INSERT INTO curator_groups (owner_id, name, description) VALUES (?, ?, ?)");
    const insGU = db.prepare("INSERT INTO curator_group_users (group_id, user_id) VALUES (?, ?)");
    const g1 = Number(insGroup.run(null, "Dermatologistas", "Quem trata pele no consultório.").lastInsertRowid);
    insGU.run(g1, creatorIds.marinaskin);
    insGU.run(g1, creatorIds.pedroglow);
    const g2 = Number(insGroup.run(null, "Stylists", "Quem veste gente para viver disso.").lastInsertRowid);
    insGU.run(g2, creatorIds.luizaveste);
    insGU.run(g2, creatorIds.anapraia);
    const g3 = Number(insGroup.run(null, "Designers de interiores", "Casa com cara de quem mora.").lastInsertRowid);
    insGU.run(g3, creatorIds.casadabia);
    insGU.run(g3, creatorIds.joaninhacasa);
    const g4 = Number(insGroup.run(shopperIds[0], "Minha turma", "").lastInsertRowid);
    insGU.run(g4, creatorIds.marinaskin);
    insGU.run(g4, creatorIds.luizaveste);

    // Relação marca x criador: taxa, código, opportunity, collaboration, gifting, chat
    db.prepare("INSERT INTO custom_rates (brand_id, user_id, rate) VALUES (?, ?, ?)").run(brandIds[0], creatorIds.marinaskin, 0.2);
    db.prepare("INSERT INTO custom_codes (brand_id, user_id, code, discount_pct) VALUES (?, ?, ?, ?)").run(
      brandIds[0], creatorIds.marinaskin, "MARINA15", 15,
    );
    const opp = Number(
      db.prepare("INSERT INTO opportunities (brand_id, title, brief, payment_cents) VALUES (?, ?, ?, ?)").run(
        brandIds[0], "Lançamento Sérum Niacinamida", "Um Reels mostrando a rotina da manhã com o novo sérum. Link na bio por 7 dias.", 1500_00,
      ).lastInsertRowid,
    );
    const insOU = db.prepare("INSERT INTO opportunity_users (opportunity_id, user_id, status) VALUES (?, ?, ?)");
    insOU.run(opp, creatorIds.marinaskin, "accepted");
    insOU.run(opp, creatorIds.pedroglow, "invited");
    const contract = Number(
      db.prepare("INSERT INTO contracts (brand_id, user_id, title, terms, status) VALUES (?, ?, ?, ?, ?)").run(
        brandIds[1], creatorIds.casadabia, "Campanha Inverno Casa Linho", "2 Reels e 3 stories em julho. Uso de imagem por 6 meses.", "active",
      ).lastInsertRowid,
    );
    const insTask = db.prepare("INSERT INTO contract_tasks (contract_id, title, price_cents, due_date, status) VALUES (?, ?, ?, ?, ?)");
    insTask.run(contract, "Reels 1: quarto de hotel em casa", 2500_00, "2026-11-10", "approved");
    insTask.run(contract, "Reels 2: mesa posta", 2500_00, "2026-11-24", "pending");
    insTask.run(contract, "3 stories com link", 1200_00, "2026-11-30", "pending");
    const lb = Number(
      db.prepare("INSERT INTO lookbooks (brand_id, title, message) VALUES (?, ?, ?)").run(
        brandIds[0], "Kit Verão Aurora", "Escolha um produto para testar, por nossa conta.",
      ).lastInsertRowid,
    );
    db.prepare("INSERT INTO lookbook_items (lookbook_id, product_id) VALUES (?, ?)").run(lb, prodIds[0]);
    db.prepare("INSERT INTO lookbook_items (lookbook_id, product_id) VALUES (?, ?)").run(lb, prodIds[1]);
    db.prepare("INSERT INTO lookbook_items (lookbook_id, product_id) VALUES (?, ?)").run(lb, prodIds[2]);
    db.prepare("INSERT INTO lookbook_invites (lookbook_id, user_id, status) VALUES (?, ?, ?)").run(lb, creatorIds.pedroglow, "invited");
    db.prepare("INSERT INTO chat_messages (brand_id, user_id, from_brand, body) VALUES (?, ?, 1, ?)").run(
      brandIds[0], creatorIds.marinaskin, "Oi Marina! Adoramos sua rotina da manhã. Topa conversar sobre o lançamento?",
    );

    db.prepare("INSERT INTO payouts (user_id, amount_cents, method, status, created_at) VALUES (?, ?, ?, 'sent', datetime('now','-14 days'))").run(
      creatorIds.marinaskin, 150_00, "pix",
    );

    seedCriadora(db, rand, { brandIds, prodIds, insPin, insClick, insOrder });
  });
  tx();
}

// ---------- A Sift Page de demonstração: @criadora ----------
// Fictícia. Peças reais do catálogo curado pelo JJ (recortes 4:5 no wash).
// Publi e recebido só aparecem com as marcas fictícias, para não inventar deal com marca real.

// Sinais pessoais (doc da taxonomia): desde quando tenho, quantas vezes recomprei, ordem na rotina, par no high low.
type Pin = { id: string; match?: "exact" | "similar"; out?: boolean; since?: string; again?: number; step?: number; pair?: string };
type Section = { title: string; source: string; format: Format; pins: Pin[]; extra?: { prod: number; tie: "paid" | "gifted"; brand: number }[] };

const CRIADORA: Section[] = [
  {
    title: "sempre comigo",
    source: "legenda de 14.05.26",
    format: "na_bolsa",
    pins: [{ id: "mansur-candy-hobo" }, { id: "zerezes-nori", since: "2021" }, { id: "sayeg-serena" }, { id: "rhode-lip-vanilla", again: 6, since: "03.23" }, { id: "lemaire-croissant", match: "similar" }, { id: "toteme-clip-top-handle", out: true }, { id: "paloma-guida", out: true }],
  },
  {
    title: "high low, desde sempre",
    source: "legenda de 30.04.26",
    format: "high_low",
    pins: [{ id: "khaite-lotus", pair: "farm-bolsa-viva" }, { id: "farm-bolsa-viva" }, { id: "therow-soft-loafer", pair: "j01-loafer-black" }, { id: "j01-loafer-black" }, { id: "nk-jeans-aila", since: "2019" }, { id: "baserange-mason-tee", match: "similar" }, { id: "jilsander-cannolo", out: true }],
  },
  {
    title: "uniforme de verão",
    source: "legenda de 02.01.26",
    format: "uniforme",
    pins: [{ id: "isolda-porcelana", since: "2022" }, { id: "cordera-wool-pants", match: "similar" }, { id: "birman-clarita-slingback" }, { id: "lapima-paloma" }, { id: "adriana-maillot-acrilico" }, { id: "crisbarros-lirio", match: "similar" }, { id: "aluf-borogodo", out: true }, { id: "margiela-tabi", out: true }],
  },
  {
    title: "pele sem esforço",
    source: "legenda de 21.08.26",
    format: "rotina",
    pins: [{ id: "care-rose-mist", step: 1 }, { id: "creamy-vitc-gold", step: 2, again: 4 }, { id: "bader-rich-cream", match: "similar", step: 3 }, { id: "sallve-vitc-bastao", step: 4 }, { id: "loewe-earth-elixir", out: true }],
    extra: [{ prod: 1, tie: "paid", brand: 0 }],
  },
  {
    title: "casa com cheiro de casa",
    source: "legenda de 09.09.26",
    format: "livre",
    pins: [{ id: "diptyque-figuier-candle", again: 3 }, { id: "molle-bule" }, { id: "phebo-vela-icones" }, { id: "slj-la-donna", match: "similar" }, { id: "osklen-aroma-vento", out: true }],
    extra: [{ prod: 3, tie: "paid", brand: 1 }],
  },
];

function seedCriadora(
  db: Database.Database,
  rand: () => number,
  h: {
    brandIds: number[];
    prodIds: number[];
    insPin: Database.Statement;
    insClick: Database.Statement;
    insOrder: Database.Statement;
  },
) {
  const brandByName = new Map<string, number>();
  const insBrand = db.prepare("INSERT INTO brands (name, domain, description, default_commission_rate) VALUES (?, ?, '', 0.1)");
  const catId = new Map<string, number>();
  const insCat = db.prepare("INSERT INTO categories (industry, department, name) VALUES (?, ?, ?)");
  const insProd = db.prepare(
    "INSERT INTO products (title, brand_id, category_id, price_cents, url, color, img, price_label) VALUES (?, ?, ?, ?, ?, '#F4F4F1', ?, ?)",
  );
  const prod = new Map<string, { id: number; price: number }>();
  for (const item of CATALOG) {
    if (!brandByName.has(item.brand)) {
      const domain = new URL(item.url).hostname.replace(/^www\./, "");
      brandByName.set(item.brand, Number(insBrand.run(item.brand, domain).lastInsertRowid));
    }
    const [ind, dep] = classify(item);
    const name = dep;
    const key = `${ind}/${dep}/${name}`;
    if (!catId.has(key)) catId.set(key, Number(insCat.run(ind, dep, name).lastInsertRowid));
    const id = Number(
      insProd.run(item.name, brandByName.get(item.brand), catId.get(key), item.price_cents, item.url, `/catalog/${item.id}.webp`, item.price)
        .lastInsertRowid,
    );
    prod.set(item.id, { id, price: item.price_cents });
  }

  const user = Number(
    db
      .prepare(
        `INSERT INTO users (username, name, legal_name, role, status, bio, instagram, followers, trust_score, line, seen_count)
         VALUES ('criadora', '@criadora', 'Criadora de Demonstração', 'creator', 'active', ?, '@criadora', 0, 88, ?, 103)`,
      )
      .run("Moda, beleza e casa.", "Pouca coisa, escolhida devagar, usada até gastar.").lastInsertRowid,
  );
  const insColl = db.prepare("INSERT INTO collections (user_id, name, kind, position, quote_source, format) VALUES (?, ?, 'shelf', ?, ?, ?)");
  const insPin = db.prepare(
    `INSERT INTO pins (user_id, product_id, collection_id, archived, match, tie, tie_brand, source, created_at, owned_since, repurchased, step)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?, ?)`,
  );
  const setPair = db.prepare("UPDATE pins SET pair_pin = ? WHERE id = ?");
  const brandName = (i: number) => (db.prepare("SELECT name FROM brands WHERE id = ?").get(h.brandIds[i]) as { name: string }).name;
  CRIADORA.forEach((sec, i) => {
    const coll = Number(insColl.run(user, sec.title, i + 1, sec.source, sec.format).lastInsertRowid);
    const post = `Post ${sec.source.replace("legenda de ", "")}`;
    const all = [
      ...sec.pins.map((p) => ({ key: p.id, pin: p, product: prod.get(p.id)!.id, price: prod.get(p.id)!.price, match: p.match ?? "exact", out: p.out ? 1 : 0, tie: "affiliate", brand: null as string | null })),
      ...(sec.extra ?? []).map((e) => ({ key: "", pin: {} as Pin, product: h.prodIds[e.prod], price: 0, match: "exact", out: 0, tie: e.tie, brand: brandName(e.brand) })),
    ];
    const pinOf = new Map<string, number>();
    for (const p of all) {
      const pinId = Number(
        insPin.run(user, p.product, coll, p.out, p.match, p.tie, p.brand, post, `-${20 + Math.floor(rand() * 60)} days`, p.pin.since ?? null, p.pin.again ?? 0, p.pin.step ?? null)
          .lastInsertRowid,
      );
      if (p.key) pinOf.set(p.key, pinId);
      if (p.out) continue;
      const n = 20 + Math.floor(rand() * 90);
      for (let k = 0; k < n; k++) {
        const days = Math.floor(rand() * 60);
        h.insClick.run(pinId, "BR", `-${days} days`);
        if (p.price && rand() < 0.035) {
          h.insOrder.run(pinId, p.price, commissionFor(p.price, 0.1), days > 30 ? "approved" : "pending", `-${days} days`);
        }
      }
    }
    for (const p of sec.pins) if (p.pair) setPair.run(pinOf.get(p.pair), pinOf.get(p.id));
  });
}
