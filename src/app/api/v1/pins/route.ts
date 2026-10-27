import { db } from "@/lib/db";
import { createPin, userPins } from "@/lib/repo";
import { apiUser, body, handler } from "@/lib/api";

export const GET = handler((req) => ({ pins: userPins(db(), apiUser(req, ["creator"]).id) }));

export const POST = handler(async (req) => {
  const user = apiUser(req, ["creator"]);
  const b = await body(req);
  const id = createPin(db(), user.id, Number(b.product_id), b.collection_id ? Number(b.collection_id) : null, String(b.note ?? ""));
  return { id, url: `/go/${id}` };
});
