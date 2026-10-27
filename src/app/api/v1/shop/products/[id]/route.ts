import { db } from "@/lib/db";
import { getProduct, productPromoters } from "@/lib/repo";
import { ApiError, handler, type Ctx } from "@/lib/api";

export const GET = handler(async (_req, { params }: Ctx<{ id: string }>) => {
  const id = Number((await params).id);
  const product = getProduct(db(), id);
  if (!product) throw new ApiError(404, "Produto não encontrado.");
  return { product, promoters: productPromoters(db(), id) };
});
