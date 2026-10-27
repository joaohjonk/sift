import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getUser, type User } from "./repo";

// Login de demonstração: um cookie com o id do usuário.
// Troque por autenticação de verdade (e-mail + senha, OAuth do Instagram) antes de produção.

export const SESSION_COOKIE = "sift_uid";

export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;
  if (!Number.isInteger(id)) return null;
  return getUser(db(), id) ?? null;
}

export async function requireUser(roles: User["role"][], next: string): Promise<User> {
  const user = await currentUser();
  if (!user || !(roles.includes(user.role) || user.role === "admin")) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export async function requireBrandUser(next: string) {
  const user = await requireUser(["brand"], next);
  if (!user.brand_id) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { user, brandId: user.brand_id };
}
