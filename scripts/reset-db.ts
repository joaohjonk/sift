// Apaga e recria o banco de demonstração: npm run seed
import fs from "node:fs";
import path from "node:path";
import { openDb } from "../src/lib/db";

const file = process.env.SIFT_DB ?? path.join(process.cwd(), "data", "sift.db");
for (const f of [file, `${file}-wal`, `${file}-shm`]) fs.rmSync(f, { force: true });
const db = openDb(file);
const count = (t: string) => (db.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;
console.log(`Banco recriado em ${file}: ${count("users")} usuários, ${count("products")} produtos, ${count("pins")} links, ${count("clicks")} cliques, ${count("orders")} pedidos.`);
