import { seeOther } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";

export function POST() {
  const res = seeOther("/");
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
