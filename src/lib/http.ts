import { NextResponse } from "next/server";

/** Redirect 303 com Location relativo, para não trocar o host (localhost x 127.0.0.1 x domínio). */
export function seeOther(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}
