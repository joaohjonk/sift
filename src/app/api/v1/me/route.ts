import { apiUser, handler } from "@/lib/api";
import { tierFor } from "@/lib/tiers";

export const GET = handler((req) => {
  const user = apiUser(req);
  return { user, tier: user.role === "creator" ? tierFor(user.trust_score) : null };
});
