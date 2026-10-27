import { db } from "@/lib/db";
import { brandAnalytics, getBrand } from "@/lib/repo";
import { ApiError, apiUser, handler } from "@/lib/api";

export const GET = handler((req) => {
  const user = apiUser(req, ["brand"]);
  if (!user.brand_id) throw new ApiError(403, "Usuário sem marca.");
  return { brand: getBrand(db(), user.brand_id), ...brandAnalytics(db(), user.brand_id) };
});
