import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "../../design/brand/generated/tokens.css";
import "./globals.css";
import { currentUser } from "@/lib/session";
import { Mark } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sift",
  description: "Gosto, no registro. O que ela escolheu e cada publi por trás da escolha.",
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

const ROLE = { shopper: "Pessoa", creator: "Criadora", brand: "Marca", admin: "Admin" } as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" aria-label="Sift, início">
              <Mark />
            </Link>
            <nav className="nav" aria-label="Principal">
              <Link href="/shop/criadora">Sift Pages</Link>
              <Link href="/shop">Peças</Link>
              {user?.role === "creator" && <Link href={`/shop/${user.username}`}>Minha página</Link>}
              {user?.role === "creator" && <Link href="/dashboard">Registro</Link>}
              {user?.role === "brand" && <Link href="/brand">Registro da marca</Link>}
              {user?.role === "admin" && <Link href="/admin">Admin</Link>}
              {!user && <Link href="/home/creators">Para criadoras</Link>}
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
                    <button className="link">Sair</button>
                  </form>
                </>
              ) : (
                <Link href="/login">Entrar</Link>
              )}
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
