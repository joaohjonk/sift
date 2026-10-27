import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProduct, productPromoters } from "@/lib/repo";
import { TIE_LABEL } from "@/lib/page";
import { Frame, Rec, priceOf, recDate } from "@/components/ui";

// A ficha da peça. A prova é quem guardou e com que relação; nunca clique, nunca seguidor.

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = db();
  const p = getProduct(d, Number(id));
  if (!p) notFound();
  const keepers = productPromoters(d, p.id);
  return (
    <div className="grid12" style={{ rowGap: 40 }}>
      <div style={{ gridColumn: "1 / span 6" }} className="split-l settle">
        <Frame src={p.img} alt={`${p.brand_name}, ${p.title}`} />
        <Rec className="quiet">
          <span style={{ display: "block", marginTop: 10 }}>Imagem da marca, {p.brand_name}</span>
        </Rec>
      </div>
      <div style={{ gridColumn: "8 / span 5" }} className="split-r settle d1s">
        <Rec className="quiet">
          {p.department} · {p.category}
        </Rec>
        <h1 style={{ marginTop: 16, fontSize: "var(--d3)", lineHeight: 1 }}>{p.title}</h1>
        <p className="lead" style={{ marginBottom: 4 }}>
          {p.brand_name}
        </p>
        <p className="lead quiet num">{priceOf(p)}</p>

        <div style={{ marginTop: 48 }}>
          <Rec>
            Guardada por {keepers.length} {keepers.length === 1 ? "pessoa" : "pessoas"}
          </Rec>
          <table style={{ marginTop: 12 }}>
            <tbody>
              {keepers.map((k) => {
                const tie = TIE_LABEL[k.tie];
                return (
                  <tr key={k.id}>
                    <td>
                      <Link href={`/shop/${k.username}`}>{k.name}</Link>
                      <div className="rec quiet" style={{ marginTop: 4 }}>
                        {k.match === "exact" ? "Exato" : "Parecido"}
                        {tie ? ` · ${tie}${k.tie_brand ? ` ${k.tie_brand}` : ""}` : ""} · ficou em {recDate(k.kept_at)}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 0 }}>
                      <a className="btn small ghost" href={`/go/${k.pin_id}`}>
                        Ver na loja
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!keepers.length && <p className="quiet" style={{ marginTop: 16 }}>Ninguém guardou esta peça ainda.</p>}
          <p className="small quiet" style={{ marginTop: 24 }}>
            Cada link leva para a loja da marca com o crédito de quem guardou. A comissão nunca muda esta ordem.
          </p>
        </div>
      </div>
    </div>
  );
}
