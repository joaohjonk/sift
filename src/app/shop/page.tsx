import Link from "next/link";
import { db } from "@/lib/db";
import { catalogHierarchy, listProducts } from "@/lib/repo";
import { ProductCard } from "@/components/ui";

type SP = Record<string, string | undefined>;

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const d = db();
  const cats = catalogHierarchy(d);
  const departments = [...new Set(cats.map((c) => `${c.industry} · ${c.department}`))];
  const categoryId = sp.category ? Number(sp.category) : undefined;
  const sort = (sp.sort as "month" | "week" | "promoters") ?? "month";
  const products = listProducts(d, { categoryId, department: sp.department, q: sp.q, sort });
  const qs = (patch: SP) => {
    const next = { ...sp, ...patch };
    const u = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    return `/shop?${u}`;
  };
  return (
    <div className="layout-side">
      <nav className="sidenav">
        <div className="label">Departamentos</div>
        <Link href="/shop">Tudo</Link>
        {departments.map((dep) => {
          const department = dep.split(" · ")[1];
          return (
            <div key={dep}>
              <Link href={qs({ department, category: undefined })}>{dep}</Link>
              {sp.department === department &&
                cats
                  .filter((c) => c.department === department)
                  .map((c) => (
                    <Link key={c.id} href={qs({ category: String(c.id) })} style={{ paddingLeft: 22, display: "block" }}>
                      {c.name}
                    </Link>
                  ))}
            </div>
          );
        })}
      </nav>
      <div>
        <div className="row between">
          <h1>Loja</h1>
          <form className="row" action="/shop">
            <input name="q" placeholder="Buscar produto ou marca" defaultValue={sp.q} style={{ width: 240 }} />
            <select name="sort" defaultValue={sort} style={{ width: 200 }}>
              <option value="month">Mais clicados no mês</option>
              <option value="week">Mais clicados na semana</option>
              <option value="promoters">Mais indicados</option>
            </select>
            <button className="small">Filtrar</button>
          </form>
        </div>
        <p className="muted small">{products.length} produtos</p>
        <div className="grid grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
