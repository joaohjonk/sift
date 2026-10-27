import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordClick } from "@/lib/repo";

// Redirecionador do link rastreado (no ShopMy: go.shopmy.us/p-<id>).
// Registra o clique e manda o comprador para a loja com o parâmetro de atribuição.
export async function GET(req: Request, { params }: { params: Promise<{ pinId: string }> }) {
  const { pinId } = await params;
  const id = Number(pinId);
  const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry");
  const dest = Number.isInteger(id) ? recordClick(db(), id, country) : null;
  if (!dest) return new NextResponse(null, { status: 302, headers: { Location: "/shop" } });
  return NextResponse.redirect(dest, 302);
}
