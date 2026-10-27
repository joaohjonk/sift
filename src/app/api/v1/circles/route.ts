import { db } from "@/lib/db";
import { createCircle, listCircles } from "@/lib/repo";
import { apiUser, body, handler, publicUser } from "@/lib/api";

export const GET = handler(() => ({ circles: listCircles(db()).map((c) => ({ ...c, curators: c.curators.map(publicUser) })) }));

export const POST = handler(async (req) => {
  const user = apiUser(req, ["shopper", "creator"]);
  const b = await body(req);
  const ids = Array.isArray(b.curator_ids) ? b.curator_ids.map(Number) : [];
  return { id: createCircle(db(), user.id, String(b.name ?? ""), ids) };
});
