import { db } from "@/lib/db";
import { createCollection, userCollections, type Collection } from "@/lib/repo";
import { apiUser, body, handler } from "@/lib/api";

export const GET = handler((req) => ({ collections: userCollections(db(), apiUser(req, ["creator"]).id) }));

export const POST = handler(async (req) => {
  const user = apiUser(req, ["creator"]);
  const b = await body(req);
  const kind = (["shelf", "look", "post", "guide"].includes(String(b.kind)) ? b.kind : "shelf") as Collection["kind"];
  return { id: createCollection(db(), user.id, String(b.name ?? ""), kind) };
});
