import { seeOther } from "@/lib/http";
import { db } from "@/lib/db";
import { applyCreator } from "@/lib/repo";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const fd = await req.formData();
  const s = (k: string) => String(fd.get(k) ?? "");
  let id: number;
  try {
    id = applyCreator(db(), {
      username: s("username"),
      name: s("name"),
      legal_name: s("legal_name"),
      phone: s("phone"),
      instagram: s("instagram"),
      followers: Number(s("followers")) || 0,
      bio: s("bio"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar.";
    return seeOther(`/apply/creator?error=${encodeURIComponent(msg)}`);
  }
  const res = seeOther(`/dashboard?ok=${encodeURIComponent("Candidatura enviada. Você está na lista de espera.")}`);
  res.cookies.set(SESSION_COOKIE, String(id), { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
