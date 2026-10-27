import { db } from "@/lib/db";
import { getCircle } from "@/lib/repo";
import { ApiError, handler, publicUser, type Ctx } from "@/lib/api";

export const GET = handler(async (_req, { params }: Ctx<{ id: string }>) => {
  const c = getCircle(db(), Number((await params).id));
  if (!c) throw new ApiError(404, "Circle não encontrado.");
  return { ...c, curators: c.curators.map(publicUser) };
});
