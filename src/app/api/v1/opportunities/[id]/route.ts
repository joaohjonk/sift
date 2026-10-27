import { db } from "@/lib/db";
import { updateOpportunityStatus } from "@/lib/repo";
import { apiUser, body, handler, type Ctx } from "@/lib/api";

// PATCH { status: "accepted" | "declined" | "submitted", submission_url? }
export const PATCH = handler(async (req, { params }: Ctx<{ id: string }>) => {
  const user = apiUser(req, ["creator"]);
  const b = await body(req);
  if (b.status === "paid") throw new Error("Só a marca libera o pagamento.");
  updateOpportunityStatus(db(), Number((await params).id), user.id, String(b.status), b.submission_url ? String(b.submission_url) : undefined);
});
