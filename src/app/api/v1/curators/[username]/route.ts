import { db } from "@/lib/db";
import { curatorShop } from "@/lib/repo";
import { ApiError, handler, publicUser, type Ctx } from "@/lib/api";

export const GET = handler(async (_req, { params }: Ctx<{ username: string }>) => {
  const shop = curatorShop(db(), (await params).username);
  if (!shop) throw new ApiError(404, "Curador não encontrado.");
  return { ...shop, user: publicUser(shop.user) };
});
