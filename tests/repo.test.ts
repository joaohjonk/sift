import { describe, expect, it, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { openDb } from "@/lib/db";
import * as repo from "@/lib/repo";
import { nextTier, tierFor } from "@/lib/tiers";

let db: Database.Database;
const user = (u: string) => repo.getUserByUsername(db, u)!;
const brand = (name: string) => repo.listBrands(db).find((b) => b.name === name)!;

beforeEach(() => {
  db = openDb(":memory:");
});

describe("tiers", () => {
  it("segue os cortes do ShopMy", () => {
    expect(tierFor(0).name).toBe("Enthusiast");
    expect(tierFor(29).name).toBe("Enthusiast");
    expect(tierFor(30).name).toBe("Ambassador");
    expect(tierFor(70).name).toBe("Trendsetter");
    expect(tierFor(85).name).toBe("Icon");
    expect(tierFor(100).name).toBe("Icon");
    expect(nextTier(60)).toMatchObject({ tier: { name: "Trendsetter" }, pointsNeeded: 10 });
    expect(nextTier(90)).toBeNull();
  });
});

describe("link rastreado", () => {
  it("registra o clique e devolve o destino com atribuição", () => {
    const pin = repo.userPins(db, user("marinaskin").id)[0];
    const before = pin.clicks_total;
    const dest = repo.recordClick(db, pin.id, "BR")!;
    expect(new URL(dest).searchParams.get("sift_pin")).toBe(String(pin.id));
    expect(repo.userPins(db, user("marinaskin").id).find((p) => p.id === pin.id)!.clicks_total).toBe(before + 1);
    expect(repo.recordClick(db, 99999)).toBeNull();
  });

  it("calcula comissão com a taxa personalizada da marca", () => {
    const marina = user("marinaskin");
    const aurora = brand("Aurora Skincare");
    expect(repo.rateFor(db, aurora.id, marina.id)).toBe(0.2);
    expect(repo.rateFor(db, aurora.id, user("pedroglow").id)).toBe(0.15);
    const pin = repo.userPins(db, marina.id).find((p) => p.product.brand_id === aurora.id)!;
    const orderId = repo.recordOrder(db, pin.id, 100_00);
    const o = db.prepare("SELECT commission_cents FROM orders WHERE id = ?").get(orderId) as { commission_cents: number };
    expect(o.commission_cents).toBe(20_00);
  });

  it("só criador ativo cria link", () => {
    const prod = repo.listProducts(db)[0];
    expect(() => repo.createPin(db, user("julia").id, prod.id, null)).toThrow();
    expect(() => repo.createPin(db, user("novacriadora").id, prod.id, null)).toThrow(/lista de espera/);
    const otherColl = repo.userCollections(db, user("marinaskin").id)[0];
    expect(() => repo.createPin(db, user("anapraia").id, prod.id, otherColl.id)).toThrow(/Coleção/);
    const id = repo.createPin(db, user("anapraia").id, prod.id, null);
    expect(repo.getPin(db, id)?.user_id).toBe(user("anapraia").id);
  });

  it("remover link arquiva e mantém o histórico", () => {
    const marina = user("marinaskin");
    const pin = repo.userPins(db, marina.id)[0];
    repo.deletePin(db, marina.id, pin.id);
    expect(repo.userPins(db, marina.id).some((p) => p.id === pin.id)).toBe(false);
    expect(repo.getPin(db, pin.id)).toBeDefined();
  });
});

describe("consumidor", () => {
  it("produto traz prova social e vitrine traz tier e confiança", () => {
    const [top] = repo.listProducts(db, { sort: "month" });
    expect(top.num_promoters).toBeGreaterThan(0);
    expect(top.clicks_month).toBeGreaterThan(0);
    const shop = repo.curatorShop(db, "marinaskin")!;
    expect(shop.tier.name).toBe("Icon");
    expect(shop.trustedBy).toBe(3);
    expect(shop.collections.length).toBe(2);
    expect(repo.curatorShop(db, "novacriadora")).toBeNull();
  });

  it("circle mostra a loja combinada", () => {
    const id = repo.createCircle(db, user("julia").id, "Teste", [user("marinaskin").id, user("pedroglow").id]);
    const c = repo.getCircle(db, id)!;
    expect(c.curators).toHaveLength(2);
    expect(c.products.length).toBeGreaterThan(0);
    // Base Sérum Glow é indicada pelos dois
    expect(c.products[0].in_circle).toBe(2);
  });
});

describe("criador", () => {
  it("candidatura entra na lista de espera e é aprovada pelo admin", () => {
    const id = repo.applyCreator(db, {
      username: "Nova_Pessoa", name: "Nova", legal_name: "Nova P", phone: "11999999999", instagram: "@nova", followers: 100, bio: "",
    });
    expect(repo.getUser(db, id)).toMatchObject({ username: "nova_pessoa", status: "waitlist", role: "creator" });
    expect(() => repo.applyCreator(db, { username: "nova_pessoa", name: "X", legal_name: "", phone: "", instagram: "", followers: 0, bio: "" })).toThrow(/existe/);
    repo.setUserStatus(db, id, "active");
    expect(repo.getUser(db, id)!.status).toBe("active");
  });

  it("saque leva o saldo disponível e não deixa sacar duas vezes", () => {
    const marina = user("marinaskin");
    const e = repo.earningsSummary(db, marina.id);
    expect(e.available).toBeGreaterThan(0);
    repo.requestPayout(db, marina.id, "pix");
    expect(repo.earningsSummary(db, marina.id).available).toBe(0);
    expect(() => repo.requestPayout(db, marina.id, "pix")).toThrow(/saldo/);
  });

  it("opportunity segue o fluxo convite, aceite, envio, pagamento", () => {
    const pedro = user("pedroglow");
    const [opp] = repo.creatorOpportunities(db, pedro.id);
    expect(opp.my_status).toBe("invited");
    expect(() => repo.updateOpportunityStatus(db, opp.id, pedro.id, "paid")).toThrow();
    repo.updateOpportunityStatus(db, opp.id, pedro.id, "accepted");
    expect(() => repo.updateOpportunityStatus(db, opp.id, pedro.id, "submitted", "")).toThrow(/link/);
    repo.updateOpportunityStatus(db, opp.id, pedro.id, "submitted", "https://instagram.com/p/x");
    const before = repo.earningsSummary(db, pedro.id).opportunityEarned;
    repo.updateOpportunityStatus(db, opp.id, pedro.id, "paid");
    expect(repo.earningsSummary(db, pedro.id).opportunityEarned).toBe(before + opp.payment_cents);
  });

  it("collaboration: aceitar, enviar e aprovar fecha o contrato", () => {
    const ana = user("anapraia");
    const brisa = brand("Brisa Swim");
    const id = repo.createContract(db, brisa.id, ana.id, "Verão", "", [{ title: "Reels", price_cents: 1000_00 }]);
    const [task] = repo.listContracts(db, { userId: ana.id })[0].tasks;
    expect(() => repo.submitTask(db, task.id, ana.id, "https://x")).toThrow(/ativa/);
    repo.respondContract(db, id, ana.id, true);
    expect(() => repo.approveTask(db, task.id, brisa.id)).toThrow();
    repo.submitTask(db, task.id, ana.id, "https://x");
    repo.approveTask(db, task.id, brisa.id);
    expect(repo.listContracts(db, { userId: ana.id })[0].status).toBe("completed");
    expect(repo.earningsSummary(db, ana.id).contractEarned).toBe(1000_00);
  });

  it("gifting: criador escolhe um produto do lookbook", () => {
    const pedro = user("pedroglow");
    const [lb] = repo.creatorGifting(db, pedro.id);
    expect(() => repo.orderFromLookbook(db, lb.id, pedro.id, 99999)).toThrow();
    repo.orderFromLookbook(db, lb.id, pedro.id, lb.items[0].id);
    expect(repo.creatorGifting(db, pedro.id)[0].my_status).toBe("ordered");
    expect(() => repo.orderFromLookbook(db, lb.id, pedro.id, lb.items[0].id)).toThrow(/respondeu/);
  });

  it("chat: criador abaixo de Trendsetter não inicia conversa", () => {
    const aurora = brand("Aurora Skincare");
    expect(() => repo.sendChat(db, aurora.id, user("anapraia").id, false, "oi")).toThrow(/Trendsetter/);
    repo.sendChat(db, aurora.id, user("luizaveste").id, false, "oi");
    repo.sendChat(db, aurora.id, user("anapraia").id, true, "oi da marca");
    repo.sendChat(db, aurora.id, user("anapraia").id, false, "resposta");
    expect(repo.chatMessages(db, aurora.id, user("anapraia").id)).toHaveLength(2);
  });
});

describe("marca", () => {
  it("analytics conta promoters por tier e discover filtra", () => {
    const aurora = brand("Aurora Skincare");
    const a = repo.brandAnalytics(db, aurora.id);
    expect(a.byTier.Icon).toBe(2) // marinaskin + @criadora (publi do sérum);
    expect(a.clicks30).toBeGreaterThan(0);
    expect(repo.discoverCreators(db, aurora.id, { minScore: 70 }).every((c) => c.trust_score >= 70)).toBe(true);
    expect(repo.discoverCreators(db, aurora.id, { q: "Rio de Janeiro" }).map((c) => c.username)).toEqual(["luizaveste"]);
    expect(repo.discoverCreators(db, aurora.id, { department: "Quarto" }).map((c) => c.username).sort()).toEqual(["casadabia", "criadora", "joaninhacasa"]);
  });

  it("onboarding só conclui com loja, clique e pedido", () => {
    const lume = brand("Lume Beauty");
    expect(lume.onboarded_at).toBeNull();
    repo.updateIntegration(db, lume.id, { integration: "nuvemshop", click_tracking_ok: 1 });
    expect(repo.getBrand(db, lume.id)!.onboarded_at).toBeNull();
    repo.updateIntegration(db, lume.id, { order_tracking_ok: 1 });
    expect(repo.getBrand(db, lume.id)!.onboarded_at).not.toBeNull();
  });

  it("taxa personalizada tem limites", () => {
    const aurora = brand("Aurora Skincare");
    expect(() => repo.setCustomRate(db, aurora.id, user("anapraia").id, 0.9)).toThrow();
    repo.setCustomRate(db, aurora.id, user("anapraia").id, 0.25);
    expect(repo.rateFor(db, aurora.id, user("anapraia").id)).toBe(0.25);
  });
});
