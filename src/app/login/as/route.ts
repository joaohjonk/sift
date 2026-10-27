import { seeOther } from "@/lib/http";
import { db } from "@/lib/db";
import { getUser } from "@/lib/repo";
import { SESSION_COOKIE } from "@/lib/session";

// Login de demonstração. É um POST de formulário comum (não server action)
// para o cookie ser gravado pela navegação, sem depender de fetch no cliente.
export async function POST(req: Request) {
  const fd = await req.formData();
  const user = getUser(db(), Number(fd.get("user_id")));
  if (!user) return seeOther("/login?error=Usu%C3%A1rio%20n%C3%A3o%20encontrado.");
  const next = String(fd.get("next") ?? "");
  const home = user.role === "brand" ? "/brand" : user.role === "creator" ? "/dashboard" : user.role === "admin" ? "/admin" : "/shop";
  const res = seeOther(next.startsWith("/") && !next.startsWith("//") ? next : home);
  res.cookies.set(SESSION_COOKIE, String(user.id), { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
