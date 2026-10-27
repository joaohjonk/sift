import { db } from "@/lib/db";
import { getBrand } from "@/lib/repo";
import { requireBrandUser } from "@/lib/session";
import { updateIntegration } from "../../actions";
import { BrandShell } from "@/components/shells";
import { Flash } from "@/components/ui";

// Onboarding da marca: integração de pedidos antes de tudo, como no ShopMy
// (eventos "Brand Onboarding - * Integration Verified").
const STORES = [
  ["shopify", "Shopify"],
  ["nuvemshop", "Nuvemshop"],
  ["vtex", "VTEX"],
  ["tray", "Tray"],
];

export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { brandId } = await requireBrandUser("/brand/onboarding");
  const b = getBrand(db(), brandId)!;
  const steps = [
    { key: "clicks", done: b.click_tracking_ok, title: "Rastreio de clique", text: "Instale o script na loja para ler o parâmetro sift_pin." },
    { key: "orders", done: b.order_tracking_ok, title: "Rastreio de pedidos", text: "Webhook de pedido criado atribui a venda ao link." },
    { key: "updates", done: b.order_updates_ok, title: "Atualização de pedidos", text: "Mudanças de valor e status chegam para recalcular a comissão." },
    { key: "cancellations", done: b.order_cancellations_ok, title: "Cancelamentos", text: "Pedido cancelado ou devolvido zera a comissão." },
  ];
  return (
    <BrandShell>
      <Flash sp={sp} />
      <h1>Integração da loja</h1>
      <p className="muted">{b.onboarded_at ? `Integração concluída em ${b.onboarded_at}.` : "Conclua os passos para começar a atribuir vendas."}</p>
      <ol className="steps">
        <li className={b.integration ? "done" : ""}>
          <h3>Conectar a loja</h3>
          <form action={updateIntegration} className="row">
            <input type="hidden" name="step" value="store" />
            <select name="integration" defaultValue={b.integration ?? ""} style={{ maxWidth: 220 }}>
              <option value="">Escolha a plataforma</option>
              {STORES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button className="small">{b.integration ? "Trocar" : "Conectar"}</button>
          </form>
        </li>
        {steps.map((s) => (
          <li key={s.key} className={s.done ? "done" : ""}>
            <div className="row between">
              <div>
                <h3>{s.title}</h3>
                <p className="small muted">{s.text}</p>
              </div>
              {!s.done && (
                <form action={updateIntegration}>
                  <input type="hidden" name="step" value={s.key} />
                  <button className="small" disabled={!b.integration}>
                    Verificar
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ol>
    </BrandShell>
  );
}
