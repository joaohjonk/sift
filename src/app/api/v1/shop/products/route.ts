import { db } from "@/lib/db";
import { listProducts } from "@/lib/repo";
import { handler } from "@/lib/api";

// Equivale a /api/Shop/products do ShopMy: produtos já com prova social.
export const GET = handler((req) => {
  const q = new URL(req.url).searchParams;
  const sort = q.get("sort");
  return {
    products: listProducts(db(), {
      categoryId: Number(q.get("category")) || undefined,
      department: q.get("department") ?? undefined,
      q: q.get("q") ?? undefined,
      sort: sort === "week" || sort === "promoters" ? sort : "month",
    }),
  };
});
