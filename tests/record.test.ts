import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { openDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { advanceQuote, feeCompare, getDeal, listDeals, queueAction, receivables, settleActions, sideStates, suggestedAction, undoAction, UNDO_SECONDS } from "@/lib/record";
import { decidePin, postsToSift, tally } from "@/lib/build";
import { siftPage } from "@/lib/page";
import { handlesIn, isDisclosed, median, readProfile } from "@/lib/insights";

let db: Database.Database;
const criadora = () => repo.getUserByUsername(db, "criadora")!;

beforeEach(() => {
  db = openDb(":memory:");
});

describe("estados de lado do Record", () => {
  const base = { state: "live" as const, due_on: "2026-12-01", pay_terms_days: 60, rights_until: null };
  it("atrasado só quando passou do prazo e não foi pago", () => {
    expect(sideStates(base, [], "2026-12-02")).toEqual(["late"]);
    expect(sideStates({ ...base, state: "paid" }, [], "2026-12-02")).toEqual([]);
    expect(sideStates(base, [], "2026-11-30")).toEqual([]);
  });
  it("conflito quando o prazo passa do máximo dela", () => {
    expect(sideStates({ ...base, pay_terms_days: 120 }, [], "2026-11-01")).toEqual(["conflict"]);
    expect(sideStates({ ...base, pay_terms_days: 90 }, [], "2026-11-01")).toEqual([]);
  });
  it("direitos acabando em até 14 dias e entrega sem aviso", () => {
    expect(sideStates({ ...base, rights_until: "2026-11-10" }, [{ disclosed: 0 }], "2026-11-01")).toEqual(["rights_ending", "needs_her"]);
  });
  it("sugere cobrar antes de discutir prazo", () => {
    expect(suggestedAction(["conflict", "late"])).toBe("charge");
    expect(suggestedAction(["conflict"])).toBe("ask_terms");
    expect(suggestedAction(["needs_her"])).toBeNull();
  });
});

describe("segurar e desfazer", () => {
  it("dá dez segundos para desfazer e depois sai", () => {
    const me = criadora();
    const deal = listDeals(db, me.id)[0];
    const t0 = new Date("2026-10-27T12:00:00Z");
    const a = queueAction(db, me.id, deal.id, "charge", t0);
    expect(() => queueAction(db, me.id, deal.id, "charge", t0)).toThrow(/fila/);
    undoAction(db, me.id, a.id, new Date(t0.getTime() + 5000));
    const b = queueAction(db, me.id, deal.id, "charge", t0);
    expect(() => undoAction(db, me.id, b.id, new Date(t0.getTime() + UNDO_SECONDS * 1000 + 1))).toThrow(/Já saiu/);
    settleActions(db, new Date(t0.getTime() + UNDO_SECONDS * 1000));
    expect(getDeal(db, me.id, deal.id)!.actions.find((x) => x.id === b.id)!.status).toBe("sent");
  });
  it("não deixa agir no contrato de outra pessoa", () => {
    const deal = listDeals(db, criadora().id)[0];
    const other = repo.getUserByUsername(db, "marinaskin")!;
    expect(() => queueAction(db, other.id, deal.id, "charge")).toThrow(/não encontrado/);
  });
  it("a demo tem um contrato atrasado e um em conflito, e eles vêm primeiro", () => {
    const deals = listDeals(db, criadora().id);
    expect(deals.some((d) => d.side.includes("late"))).toBe(true);
    expect(deals.some((d) => d.side.includes("conflict"))).toBe(true);
    expect(deals[0].side.length).toBeGreaterThan(0);
  });
});

describe("dinheiro", () => {
  it("receber hoje mostra o custo em reais", () => {
    const q = advanceQuote(48_000_00, "2027-01-25", "2026-10-27", 0.022);
    expect(q.months).toBeCloseTo(2.96, 1);
    expect(q.today_cents + q.cost_cents).toBe(48_000_00);
    expect(q.cost_cents).toBeGreaterThan(0);
    expect(advanceQuote(1000, "2026-01-01", "2026-10-27").cost_cents).toBe(0);
  });
  it("recebíveis: atrasado primeiro, depois por data, sem rascunho nem pago", () => {
    const deals = listDeals(db, criadora().id);
    const r = receivables(deals, new Date().toISOString().slice(0, 10));
    expect(r[0].late).toBe(true);
    const rest = r.filter((x) => !x.late).map((x) => x.due_on);
    expect(rest).toEqual([...rest].sort());
    expect(r.length).toBe(deals.filter((d) => d.state !== "paid" && d.state !== "draft").length);
  });
  it("agência e Sift sobre o mesmo valor", () => {
    expect(feeCompare(100_000_00)).toEqual({ agency_cents: 30_000_00, sift_cents: 10_000_00, kept_cents: 20_000_00 });
  });
});

describe("Sift this post e o filtro da página", () => {
  it("a escolha muda a página e nada se apaga", () => {
    const me = criadora();
    const posts = postsToSift(db, me.id);
    const pin = posts[0].pieces.find((p) => p.decision !== "out")!;
    const before = siftPage(db, "criadora")!;
    decidePin(db, me.id, pin.pin_id, "out");
    const after = siftPage(db, "criadora")!;
    expect(after.kept_count).toBe(before.kept_count - 1);
    expect(after.seen_count).toBe(before.seen_count);
    decidePin(db, me.id, pin.pin_id, "similar");
    expect(postsToSift(db, me.id)[0].pieces.find((p) => p.pin_id === pin.pin_id)!.decision).toBe("similar");
    expect(() => decidePin(db, repo.getUserByUsername(db, "marinaskin")!.id, pin.pin_id, "out")).toThrow();
  });
  it("conta Sift · k de n", () => {
    expect(tally([{ decision: "exact" }, { decision: "similar" }, { decision: "out" }])).toEqual({ kept: 2, total: 3, exact: 1 });
  });
  it("separa o que compra no Brasil do que só existe lá fora", () => {
    const all = siftPage(db, "criadora")!;
    const br = siftPage(db, "criadora", { market: "br" })!;
    const abroad = siftPage(db, "criadora", { market: "abroad" })!;
    expect(all.market_counts.br + all.market_counts.abroad).toBe(all.market_counts.all);
    expect(all.market_counts.br).toBeGreaterThan(0);
    expect(all.market_counts.abroad).toBeGreaterThan(0);
    for (const s of br.sections) for (const p of [...s.kept, ...s.left_out]) expect(p.market).toBe("br");
    for (const s of abroad.sections) for (const p of [...s.kept, ...s.left_out]) expect(p.market).toBe("abroad");
  });
});

describe("leitura do perfil", () => {
  const raw = [
    { shortCode: "a", timestamp: "2026-10-01", caption: "look @marca publicidade", videoPlayCount: 50_000 },
    { shortCode: "b", timestamp: "2026-10-02", caption: "amei @outra @mae", videoPlayCount: 100_000 },
    { shortCode: "c", timestamp: "2026-10-03", caption: "praia", videoPlayCount: 240_000 },
    { shortCode: "d", timestamp: "2026-10-04", caption: "", taggedUsers: [{ username: "Outra" }], likesCount: 10 },
  ];
  it("separa publi, marcada sem aviso e orgânico", () => {
    const r = readProfile(raw, ["mae"]);
    expect(r.disclosed).toBe(1);
    expect(r.tagged_without_disclosure).toBe(2);
    expect(r.median_views).toEqual({ disclosed: 50_000, tagged: 100_000, organic: 240_000 });
    expect(r.moved_free).toEqual([{ handle: "outra", posts: 2 }]);
    expect(r.from).toBe("2026-10-01");
  });
  it("ajudantes", () => {
    expect(isDisclosed("Publicidade")).toBe(true);
    expect(isDisclosed("feliz")).toBe(false);
    expect(handlesIn({ shortCode: "x", timestamp: "", caption: "oi @lume.oficial." })).toEqual(["lume.oficial"]);
    expect(median([3, 1, 2, 10])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
