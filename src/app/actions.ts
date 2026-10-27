"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as repo from "@/lib/repo";
import { currentUser, requireBrandUser, requireUser } from "@/lib/session";

// Server actions. Cada uma valida quem está logado, chama o repo e volta para
// a página com ?ok= ou ?error= para a mensagem aparecer no topo.

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string) {
  const n = Number(String(fd.get(k) ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function ids(fd: FormData, k: string) {
  return fd.getAll(k).map(Number).filter(Number.isInteger);
}
function back(path: string, kind: "ok" | "error", msg: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(msg)}`);
}
async function attempt(path: string, okMsg: string, fn: () => void | Promise<void>): Promise<never> {
  let error: string | null = null;
  try {
    await fn();
  } catch (e) {
    error = e instanceof Error ? e.message : "Algo deu errado.";
  }
  revalidatePath(path.split("?")[0]);
  return error ? back(path, "error", error) : back(path, "ok", okMsg);
}

// ---------- Consumidor ----------

export async function toggleFollow(fd: FormData) {
  const user = await requireUser(["shopper", "creator", "brand"], "/shop");
  const curator = num(fd, "curator_id");
  const path = str(fd, "back") || "/shop";
  await attempt(path, "Pronto.", () => repo.toggleFollow(db(), user.id, curator));
}

export async function createCircle(fd: FormData) {
  const user = await requireUser(["shopper", "creator"], "/shop/circles");
  let id = 0;
  try {
    id = repo.createCircle(db(), user.id, str(fd, "name"), ids(fd, "curator_ids"));
  } catch (e) {
    back("/shop/circles", "error", e instanceof Error ? e.message : "Erro ao criar o circle.");
  }
  revalidatePath("/shop/circles");
  redirect(`/shop/circles/${id}`);
}

// ---------- Criador ----------

export async function createPin(fd: FormData) {
  const user = await requireUser(["creator"], "/links");
  const coll = num(fd, "collection_id");
  await attempt("/links", "Link criado.", () => {
    repo.createPin(db(), user.id, num(fd, "product_id"), coll || null, str(fd, "note"));
  });
}

export async function deletePin(fd: FormData) {
  const user = await requireUser(["creator"], "/links");
  await attempt("/links", "Peça tirada da página. Fica no registro.", () => repo.deletePin(db(), user.id, num(fd, "pin_id")));
}

export async function createCollection(fd: FormData) {
  const user = await requireUser(["creator"], "/links");
  const kind = (str(fd, "kind") || "shelf") as repo.Collection["kind"];
  await attempt("/links", "Coleção criada.", () => {
    repo.createCollection(db(), user.id, str(fd, "name"), kind);
  });
}

export async function requestPayout(fd: FormData) {
  const user = await requireUser(["creator"], "/payouts");
  await attempt("/payouts", "Saque solicitado.", () => {
    repo.requestPayout(db(), user.id, str(fd, "method") || "pix");
  });
}

export async function respondOpportunity(fd: FormData) {
  const user = await requireUser(["creator"], "/opportunities");
  await attempt("/opportunities", "Atualizado.", () =>
    repo.updateOpportunityStatus(db(), num(fd, "opportunity_id"), user.id, str(fd, "status"), str(fd, "submission_url")),
  );
}

export async function respondContract(fd: FormData) {
  const user = await requireUser(["creator"], "/collaborations");
  const accept = str(fd, "accept") === "1";
  await attempt("/collaborations", accept ? "Collaboration aceita." : "Proposta recusada.", () =>
    repo.respondContract(db(), num(fd, "contract_id"), user.id, accept),
  );
}

export async function submitTask(fd: FormData) {
  const user = await requireUser(["creator"], "/collaborations");
  await attempt("/collaborations", "Entregável enviado para aprovação.", () =>
    repo.submitTask(db(), num(fd, "task_id"), user.id, str(fd, "content_url")),
  );
}

export async function orderGift(fd: FormData) {
  const user = await requireUser(["creator"], "/gifting");
  await attempt("/gifting", "Presente pedido. A marca envia pela loja dela.", () =>
    repo.orderFromLookbook(db(), num(fd, "lookbook_id"), user.id, num(fd, "product_id")),
  );
}

export async function sendChat(fd: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/chat");
  const fromBrand = user.role === "brand";
  const brandId = fromBrand ? user.brand_id! : num(fd, "brand_id");
  const userId = fromBrand ? num(fd, "user_id") : user.id;
  const path = `/chat?brand=${brandId}&user=${userId}`;
  await attempt(path, "Enviada.", () => repo.sendChat(db(), brandId, userId, fromBrand, str(fd, "body")));
}

// ---------- Marca ----------

export async function updateIntegration(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/onboarding");
  const step = str(fd, "step");
  const patch: Parameters<typeof repo.updateIntegration>[2] = {};
  if (step === "store") patch.integration = str(fd, "integration") || null;
  if (step === "clicks") patch.click_tracking_ok = 1;
  if (step === "orders") patch.order_tracking_ok = 1;
  if (step === "updates") patch.order_updates_ok = 1;
  if (step === "cancellations") patch.order_cancellations_ok = 1;
  await attempt("/brand/onboarding", "Integração verificada.", () => repo.updateIntegration(db(), brandId, patch));
}

export async function setCustomRate(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/discover");
  await attempt("/brand/discover", "Taxa personalizada salva.", () =>
    repo.setCustomRate(db(), brandId, num(fd, "user_id"), num(fd, "rate") / 100),
  );
}

export async function createOpportunity(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/opportunities");
  await attempt("/brand/opportunities", "Opportunity enviada.", () => {
    repo.createOpportunity(db(), brandId, str(fd, "title"), str(fd, "brief"), Math.round(num(fd, "payment") * 100), ids(fd, "invite_ids"));
  });
}

export async function markOpportunityPaid(fd: FormData) {
  await requireBrandUser("/brand/opportunities");
  await attempt("/brand/opportunities", "Pagamento liberado.", () =>
    repo.updateOpportunityStatus(db(), num(fd, "opportunity_id"), num(fd, "user_id"), "paid"),
  );
}

export async function createContract(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/collaborations");
  const titles = fd.getAll("task_title").map(String);
  const prices = fd.getAll("task_price").map((p) => Math.round(Number(String(p).replace(",", ".")) * 100));
  const dues = fd.getAll("task_due").map(String);
  const tasks = titles
    .map((title, i) => ({ title: title.trim(), price_cents: prices[i] || 0, due_date: dues[i] || undefined }))
    .filter((t) => t.title);
  await attempt("/brand/collaborations", "Proposta enviada ao criador.", () => {
    repo.createContract(db(), brandId, num(fd, "user_id"), str(fd, "title"), str(fd, "terms"), tasks);
  });
}

export async function approveTask(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/collaborations");
  await attempt("/brand/collaborations", "Entregável aprovado.", () => repo.approveTask(db(), num(fd, "task_id"), brandId));
}

export async function createLookbook(fd: FormData) {
  const { brandId } = await requireBrandUser("/brand/gifting");
  await attempt("/brand/gifting", "Lookbook criado.", () => {
    const id = repo.createLookbook(db(), brandId, str(fd, "title"), str(fd, "message"), ids(fd, "product_ids"));
    repo.inviteToLookbook(db(), id, ids(fd, "invite_ids"));
  });
}

// ---------- Admin ----------

export async function reviewApplication(fd: FormData) {
  await requireUser(["admin"], "/admin");
  const approve = str(fd, "approve") === "1";
  await attempt("/admin", approve ? "Criador aprovado." : "Candidatura recusada.", () =>
    repo.setUserStatus(db(), num(fd, "user_id"), approve ? "active" : "rejected"),
  );
}
