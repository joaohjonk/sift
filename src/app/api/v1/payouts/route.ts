import { db } from "@/lib/db";
import { earningsSummary, listPayouts, monthlyEarnings, requestPayout } from "@/lib/repo";
import { apiUser, body, handler } from "@/lib/api";

export const GET = handler((req) => {
  const id = apiUser(req, ["creator"]).id;
  const d = db();
  return { summary: earningsSummary(d, id), months: monthlyEarnings(d, id), payouts: listPayouts(d, id) };
});

export const POST = handler(async (req) => {
  const user = apiUser(req, ["creator"]);
  const b = await body(req);
  return { id: requestPayout(db(), user.id, String(b.method ?? "pix")) };
});
