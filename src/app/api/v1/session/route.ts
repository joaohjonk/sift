import { db } from "@/lib/db";
import { getUser, getUserByUsername } from "@/lib/repo";
import { ApiError, body, handler, signToken } from "@/lib/api";

// POST { username } -> { token, user }. Login de demonstração, sem senha.
export const POST = handler(async (req) => {
  const b = await body(req);
  const user = typeof b.username === "string" ? getUserByUsername(db(), b.username) : getUser(db(), Number(b.user_id));
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  return { token: signToken(user.id), user };
});
