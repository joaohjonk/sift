import Link from "next/link";

const PILLARS = [
  ["Discover", "Ache criadores por vendas reais, audiência, local e tier de confiança.", "/brand/discover"],
  ["Engage", "Gifting por lookbook, taxa de comissão personalizada, códigos e chat.", "/brand/gifting"],
  ["Track", "Cliques, pedidos e receita por criador, produto e link.", "/brand"],
  ["Amplify", "Opportunities pagas e collaborations com entregáveis.", "/brand/opportunities"],
];

export default function ForBrands() {
  return (
    <>
      <section className="hero">
        <h1>Os curadores certos já indicam você.</h1>
        <p className="muted">Conecte a sua loja, veja quem vende seus produtos e transforme isso em parceria.</p>
        <Link className="btn" href="/login?next=/brand">
          Entrar como marca
        </Link>
      </section>
      <div className="grid grid-cards">
        {PILLARS.map(([title, text, href]) => (
          <Link key={title} href={href} className="card" style={{ textDecoration: "none" }}>
            <h3>{title}</h3>
            <p className="small muted">{text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
