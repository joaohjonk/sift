import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sift",
  description: "Recomendações de quem entende, não do algoritmo.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="logo">
              Sift
            </Link>
            <nav className="nav">
              <Link href="/shop">Loja</Link>
              <Link href="/shop/circles">Circles</Link>
              {user?.role === "creator" && <Link href="/dashboard">Painel do criador</Link>}
              {user?.role === "brand" && <Link href="/brand">Painel da marca</Link>}
              {user?.role === "admin" && <Link href="/admin">Admin</Link>}
              {!user && <Link href="/home/creators">Para criadores</Link>}
              {!user && <Link href="/home/brands">Para marcas</Link>}
            </nav>
            <div className="who">
              {user ? (
                <>
                  <span>
                    {user.name} · {ROLE[user.role]}
                  </span>
                  <Link href="/login">Trocar</Link>
                  {/* POST: um GET seria disparado pelo prefetch do Link e deslogaria sozinho */}
                  <form action="/logout" method="post" className="inline">
                    <button className="ghost small">Sair</button>
                  </form>
                </>
              ) : (
                <Link className="btn small" href="/login">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}

const ROLE = { shopper: "consumidor", creator: "criador", brand: "marca", admin: "admin" } as const;
