// Leitura de um perfil: o que a máquina vê nos posts públicos de uma criadora.
// Entrada no formato do apify~instagram-post-scraper. Só dados públicos.

export interface RawPost {
  shortCode: string;
  timestamp: string;
  caption?: string | null;
  type?: string;
  likesCount?: number;
  videoPlayCount?: number | null;
  videoViewCount?: number | null;
  taggedUsers?: { username: string }[] | null;
}

export interface ProfileReading {
  posts: number;
  from: string | null;
  to: string | null;
  disclosed: number;
  /** Marca marcada ou citada sem aviso de publi. */
  tagged_without_disclosure: number;
  median_views: { disclosed: number | null; tagged: number | null; organic: number | null };
  /** Marcas que aparecem sem publi, mais citadas primeiro. */
  moved_free: { handle: string; posts: number }[];
}

const DISCLOSURE = /publi|#ad\b|parceria paga|paid partnership/i;
const MENTION = /@([\w.]+)/g;

export function isDisclosed(caption: string | null | undefined) {
  return DISCLOSURE.test(caption ?? "");
}

export function handlesIn(p: RawPost): string[] {
  const out = new Set((p.taggedUsers ?? []).map((t) => t.username.toLowerCase()));
  for (const m of (p.caption ?? "").matchAll(MENTION)) out.add(m[1].toLowerCase().replace(/\.$/, ""));
  return [...out];
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const views = (p: RawPost) => p.videoPlayCount ?? p.videoViewCount ?? null;

/** people: perfis de pessoas (família, amigas) para não contar como marca. */
export function readProfile(raw: RawPost[], people: string[] = []): ProfileReading {
  const skip = new Set(people.map((p) => p.toLowerCase()));
  const disclosed = raw.filter((p) => isDisclosed(p.caption));
  const tagged = raw.filter((p) => !isDisclosed(p.caption) && handlesIn(p).length > 0);
  const organic = raw.filter((p) => !isDisclosed(p.caption) && handlesIn(p).length === 0);
  const v = (xs: RawPost[]) => median(xs.map(views).filter((n): n is number => typeof n === "number" && n > 0));
  const count = new Map<string, number>();
  for (const p of tagged) for (const h of handlesIn(p)) if (!skip.has(h)) count.set(h, (count.get(h) ?? 0) + 1);
  const dates = raw.map((p) => p.timestamp).sort();
  return {
    posts: raw.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    disclosed: disclosed.length,
    tagged_without_disclosure: tagged.length,
    median_views: { disclosed: v(disclosed), tagged: v(tagged), organic: v(organic) },
    moved_free: [...count.entries()].map(([handle, posts]) => ({ handle, posts })).sort((a, b) => b.posts - a.posts || a.handle.localeCompare(b.handle)),
  };
}
