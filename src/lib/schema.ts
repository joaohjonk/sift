// Modelo de dados espelhando os recursos da API do ShopMy (apiv3.shopmy.us/api).
// Cada tabela indica, no comentário, o recurso equivalente mapeado em
// shopmy-engenharia-reversa/dados/endpoints_api.txt.

export const SCHEMA = /* sql */ `
-- Users: criador, consumidor e usuário de marca no mesmo modelo (recurso Users)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  legal_name    TEXT,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('shopper','creator','brand','admin')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','waitlist','rejected')),
  bio           TEXT NOT NULL DEFAULT '',
  instagram     TEXT,
  followers     INTEGER NOT NULL DEFAULT 0,
  location      TEXT,
  -- Pontuação de confiança (0 a 100) que define o tier (BrandCreatorStatTiers / tiers do criador)
  trust_score   INTEGER NOT NULL DEFAULT 0,
  line          TEXT,                       -- uma frase dela, nas palavras dela
  seen_count    INTEGER NOT NULL DEFAULT 0, -- peças que a máquina viu nos posts (o "de 214")
  brand_id      INTEGER REFERENCES brands(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Brands / AllBrands: conta da marca, comissão padrão e integração de pedidos
CREATE TABLE IF NOT EXISTS brands (
  id                      INTEGER PRIMARY KEY,
  name                    TEXT NOT NULL,
  domain                  TEXT NOT NULL,
  description             TEXT NOT NULL DEFAULT '',
  default_commission_rate REAL NOT NULL DEFAULT 0.10,
  integration             TEXT,           -- shopify, nuvemshop, vtex, tray...
  click_tracking_ok       INTEGER NOT NULL DEFAULT 0,
  order_tracking_ok       INTEGER NOT NULL DEFAULT 0,
  order_updates_ok        INTEGER NOT NULL DEFAULT 0,
  order_cancellations_ok  INTEGER NOT NULL DEFAULT 0,
  onboarded_at            TEXT
);

-- Hierarquia do catálogo: Indústria -> Departamento -> Categoria (Shop/hierarchy)
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY,
  industry    TEXT NOT NULL,
  department  TEXT NOT NULL,
  name        TEXT NOT NULL
);

-- Products (Shop/products)
CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  brand_id     INTEGER NOT NULL REFERENCES brands(id),
  category_id  INTEGER NOT NULL REFERENCES categories(id),
  price_cents  INTEGER NOT NULL,
  url          TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#d9d2c5',  -- placeholder visual no lugar da foto
  img          TEXT,                              -- recorte 4:5 no wash (public/catalog)
  price_label  TEXT                               -- preço como a loja mostra (US$ 920, € 340)
);

-- Collections: seções da vitrine (shelf), looks, posts compráveis, gift guides
CREATE TABLE IF NOT EXISTS collections (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'shelf' CHECK (kind IN ('shelf','look','post','guide')),
  position    INTEGER NOT NULL DEFAULT 0,
  quote_source TEXT,                       -- título nas palavras dela: de qual legenda e data veio
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pins: o link rastreado (produto + criador + comissão). Unidade de todo o analytics.
CREATE TABLE IF NOT EXISTS pins (
  id             INTEGER PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  product_id     INTEGER NOT NULL REFERENCES products(id),
  collection_id  INTEGER REFERENCES collections(id),
  note           TEXT NOT NULL DEFAULT '',
  archived       INTEGER NOT NULL DEFAULT 0,   -- saiu da página, mas fica no registro (lei 2: nada se apaga)
  match          TEXT NOT NULL DEFAULT 'exact' CHECK (match IN ('exact','similar')),  -- a peça da foto ou só parecida
  tie            TEXT NOT NULL DEFAULT 'organic' CHECK (tie IN ('organic','gifted','affiliate','paid')),  -- relação comercial visível
  tie_brand      TEXT,                          -- quem pagou ou mandou, quando há
  source         TEXT,                          -- de onde veio: "Post 14.05.26"
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cliques registrados pelo redirecionador (go.shopmy.us/p-<id> -> /go/<id>)
CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY,
  pin_id      INTEGER NOT NULL REFERENCES pins(id),
  country     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pedidos atribuídos a um link e a comissão gerada (AffiliateCommissions)
CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY,
  pin_id            INTEGER NOT NULL REFERENCES pins(id),
  amount_cents      INTEGER NOT NULL,
  commission_cents  INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Circles (CuratorGroups / CuratorGroupUsers)
CREATE TABLE IF NOT EXISTS curator_groups (
  id          INTEGER PRIMARY KEY,
  owner_id    INTEGER REFERENCES users(id),   -- NULL = circle editorial
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS curator_group_users (
  group_id  INTEGER NOT NULL REFERENCES curator_groups(id),
  user_id   INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (group_id, user_id)
);

-- Quem confia em qual curador ("Trusted by 8.2k shoppers")
CREATE TABLE IF NOT EXISTS follows (
  follower_id  INTEGER NOT NULL REFERENCES users(id),
  curator_id   INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (follower_id, curator_id)
);

-- Taxa de comissão personalizada por marca e criador (CustomRates)
CREATE TABLE IF NOT EXISTS custom_rates (
  brand_id  INTEGER NOT NULL REFERENCES brands(id),
  user_id   INTEGER NOT NULL REFERENCES users(id),
  rate      REAL NOT NULL,
  PRIMARY KEY (brand_id, user_id)
);

-- Códigos de desconto do criador (CustomCodes)
CREATE TABLE IF NOT EXISTS custom_codes (
  id            INTEGER PRIMARY KEY,
  brand_id      INTEGER NOT NULL REFERENCES brands(id),
  user_id       INTEGER NOT NULL REFERENCES users(id),
  code          TEXT NOT NULL UNIQUE,
  discount_pct  INTEGER NOT NULL
);

-- Opportunities: a marca convida, o criador aceita e envia o link ou a menção
CREATE TABLE IF NOT EXISTS opportunities (
  id             INTEGER PRIMARY KEY,
  brand_id       INTEGER NOT NULL REFERENCES brands(id),
  title          TEXT NOT NULL,
  brief          TEXT NOT NULL,
  payment_cents  INTEGER NOT NULL DEFAULT 0,   -- 0 = "unfunded" (só comissão)
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','closed')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS opportunity_users (
  opportunity_id  INTEGER NOT NULL REFERENCES opportunities(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  status          TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined','submitted','paid')),
  submission_url  TEXT,
  PRIMARY KEY (opportunity_id, user_id)
);

-- Collaborations (Contracts / ContractTasks): proposta com entregáveis e valores
CREATE TABLE IF NOT EXISTS contracts (
  id          INTEGER PRIMARY KEY,
  brand_id    INTEGER NOT NULL REFERENCES brands(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  terms       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','rejected','active','completed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contract_tasks (
  id           INTEGER PRIMARY KEY,
  contract_id  INTEGER NOT NULL REFERENCES contracts(id),
  title        TEXT NOT NULL,
  price_cents  INTEGER NOT NULL,
  due_date     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved')),
  content_url  TEXT
);

-- Gifting (Lookbooks / LookbookOrders)
CREATE TABLE IF NOT EXISTS lookbooks (
  id         INTEGER PRIMARY KEY,
  brand_id   INTEGER NOT NULL REFERENCES brands(id),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lookbook_items (
  lookbook_id  INTEGER NOT NULL REFERENCES lookbooks(id),
  product_id   INTEGER NOT NULL REFERENCES products(id),
  PRIMARY KEY (lookbook_id, product_id)
);
CREATE TABLE IF NOT EXISTS lookbook_invites (
  lookbook_id  INTEGER NOT NULL REFERENCES lookbooks(id),
  user_id      INTEGER NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','ordered','declined')),
  product_id   INTEGER REFERENCES products(id),
  PRIMARY KEY (lookbook_id, user_id)
);

-- Payouts: pagamento ao criador (no ShopMy semanal às sextas via PayPal/Stripe)
CREATE TABLE IF NOT EXISTS payouts (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  amount_cents  INTEGER NOT NULL,
  method        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chat entre marca e criador (Chats / ChatMessages)
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INTEGER PRIMARY KEY,
  brand_id    INTEGER NOT NULL REFERENCES brands(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  from_brand  INTEGER NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pins_user ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_product ON pins(product_id);
CREATE INDEX IF NOT EXISTS idx_clicks_pin ON clicks(pin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_pin ON orders(pin_id);
`;
