import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";
import { seed } from "./seed";

type DB = Database.Database;

const globalForDb = globalThis as unknown as { __siftDb?: DB };

// Em função serverless (Netlify) só /tmp é gravável: o banco de demonstração nasce lá e se semeia sozinho.
const SERVERLESS = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DEFAULT_DB = SERVERLESS ? "/tmp/sift.db" : path.join(process.cwd(), "data", "sift.db");

export function openDb(file = process.env.SIFT_DB ?? DEFAULT_DB): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  const { n } = db.prepare("SELECT count(*) AS n FROM users").get() as { n: number };
  if (n === 0) seed(db);
  return db;
}

// Colunas novas em bancos já criados. CREATE TABLE IF NOT EXISTS não altera tabela existente.
const COLUMNS: [string, string, string][] = [
  ["collections", "format", "TEXT NOT NULL DEFAULT 'livre'"],
  ["pins", "owned_since", "TEXT"],
  ["pins", "repurchased", "INTEGER NOT NULL DEFAULT 0"],
  ["pins", "step", "INTEGER"],
  ["pins", "pair_pin", "INTEGER"],
];
function migrate(db: DB) {
  for (const [table, col, type] of COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
}

/** Conexão única por processo (sobrevive ao hot reload do Next em dev). */
export function db(): DB {
  if (!globalForDb.__siftDb) globalForDb.__siftDb = openDb();
  return globalForDb.__siftDb;
}
