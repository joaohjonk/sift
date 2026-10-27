import { db } from "@/lib/db";
import { discoverCreators } from "@/lib/repo";
import { ApiError, apiUser, handler } from "@/lib/api";

export const GET = handler((req) => {
  const user = apiUser(req, ["brand"]);
  if (!user.brand_id) throw new ApiError(403, "Usuário sem marca.");
  const q = new URL(req.url).searchParams;
  return {
    creators: discoverCreators(db(), user.brand_id, {
      q: q.get("q") ?? undefined,
      minFollowers: Number(q.get("min_followers")) || undefined,
      minScore: Number(q.get("min_score")) || undefined,
      department: q.get("department") ?? undefined,
    }),
  };
});
