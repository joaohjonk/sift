import { db } from "@/lib/db";
import { creatorSummary } from "@/lib/repo";
import { apiUser, handler } from "@/lib/api";
import { nextTier, tierFor } from "@/lib/tiers";

export const GET = handler((req) => {
  const user = apiUser(req, ["creator"]);
  return { ...creatorSummary(db(), user.id), tier: tierFor(user.trust_score), next: nextTier(user.trust_score) };
});
