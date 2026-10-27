import { db } from "@/lib/db";
import { deletePin } from "@/lib/repo";
import { apiUser, handler, type Ctx } from "@/lib/api";

export const DELETE = handler(async (req, { params }: Ctx<{ id: string }>) => {
  deletePin(db(), apiUser(req, ["creator"]).id, Number((await params).id));
});
