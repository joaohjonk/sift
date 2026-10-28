// Importa os posts públicos de uma criadora e gera a leitura do perfil.
//
//   npx tsx scripts/import-instagram.ts <handle> [--limit 60] [--people mae,amiga]
//
// Usa o ator público apify~instagram-post-scraper. O token vem de APIFY_TOKEN, ou do proxy
// do ambiente quando ele injeta a credencial. Só perfis públicos: nada de conta falsa,
// telefone virtual ou login de terceiros.
// Saída em data/creators/<handle>/ (fora do git): posts.json e leitura.json.

import fs from "node:fs";
import path from "node:path";
import { readProfile, type RawPost } from "../src/lib/insights";

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

async function main() {
  const handle = process.argv[2]?.replace(/^@/, "");
  if (!handle || handle.startsWith("--")) {
    console.error("Uso: npx tsx scripts/import-instagram.ts <handle> [--limit 60] [--people a,b]");
    process.exit(1);
  }
  const limit = Number(arg("limit", "60"));
  const people = arg("people", "").split(",").filter(Boolean);
  const token = process.env.APIFY_TOKEN;
  const url = new URL("https://api.apify.com/v2/acts/apify~instagram-post-scraper/run-sync-get-dataset-items");
  if (token) url.searchParams.set("token", token);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: [handle], resultsLimit: limit }),
  });
  if (!res.ok) throw new Error(`Apify respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const posts = (await res.json()) as RawPost[];
  const dir = path.join(process.cwd(), "data", "creators", handle);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "posts.json"), JSON.stringify(posts, null, 2));
  const reading = readProfile(posts, people);
  fs.writeFileSync(path.join(dir, "leitura.json"), JSON.stringify(reading, null, 2));
  const k = (n: number | null) => (n == null ? "sem dado" : `${Math.round(n / 100) / 10} mil`);
  console.log(`@${handle}: ${reading.posts} posts lidos`);
  console.log(`Publi com aviso: ${reading.disclosed}. Marca marcada sem aviso: ${reading.tagged_without_disclosure}.`);
  console.log(`Views (mediana): publi ${k(reading.median_views.disclosed)}, marcada ${k(reading.median_views.tagged)}, orgânico ${k(reading.median_views.organic)}`);
  console.log(`Marcas que ela move sem ganhar: ${reading.moved_free.slice(0, 8).map((m) => `@${m.handle} (${m.posts})`).join(", ") || "nenhuma"}`);
  console.log(`Arquivos em ${path.relative(process.cwd(), dir)}/`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
