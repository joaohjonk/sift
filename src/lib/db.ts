import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";
import { seed } from "./seed";

type DB = Database.Database;

const globalForDb = globalThis as unknown as { __siftDb?: DB };

export function openDb(file = process.env.SIFT_DB ?? path.join(process.cwd(), "data", "sift.db")): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  const { n } = db.prepare("SELECT count(*) AS n FROM users").get() as { n: number };
  if (n === 0) seed(db);
  return db;
}

/** Conexão única por processo (sobrevive ao hot reload do Next em dev). */
export function db(): DB {
  if (!globalForDb.__siftDb) globalForDb.__siftDb = openDb();
  return globalForDb.__siftDb;
}
