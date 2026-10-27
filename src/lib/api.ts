import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "./db";
import { getUser, type User } from "./repo";

// Base da API JSON (/api/v1) usada pelo app de celular.
// Token de demonstração: "<id>.<hmac>". Troque por autenticação real antes de produção.

const SECRET = process.env.SIFT_SECRET ?? "dev-secret-troque-em-producao";

export function signToken(userId: number): string {
  const mac = crypto.createHmac("sha256", SECRET).update(String(userId)).digest("base64url");
  return `${userId}.${mac}`;
}

export function verifyToken(token: string): number | null {
  const [id, mac] = token.split(".");
  if (!id || !mac) return null;
  const expected = signToken(Number(id)).split(".")[1];
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? Number(id) : null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function apiUser(req: Request, roles?: User["role"][]): User {
  const auth = req.headers.get("authorization") ?? "";
  const id = auth.startsWith("Bearer ") ? verifyToken(auth.slice(7)) : null;
  const user = id ? getUser(db(), id) : undefined;
  if (!user) throw new ApiError(401, "Faça login.");
  if (roles && !roles.includes(user.role) && user.role !== "admin") throw new ApiError(403, "Sem permissão.");
  return user;
}

/** Envolve um handler: devolve JSON e converte erros em { error }. */
export function handler<C>(fn: (req: Request, ctx: C) => unknown | Promise<unknown>) {
  return async (req: Request, ctx: C) => {
    try {
      const data = await fn(req, ctx);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
      const msg = e instanceof Error ? e.message : "Erro inesperado.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  };
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "JSON inválido.");
  }
}

export type Ctx<P> = { params: Promise<P> };

/** Tira dados privados (nome legal, telefone) antes de expor um usuário publicamente. */
export function publicUser<T extends Partial<User>>(u: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { legal_name, phone, ...rest } = u;
  return rest;
}
