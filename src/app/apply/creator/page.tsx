import { Flash } from "@/components/ui";

// Candidatura em 3 passos (no ShopMy: /apply/creator). Aqui os 3 passos ficam
// na mesma página para o esqueleto; o envio cai na lista de espera.
export default async function Apply({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div style={{ maxWidth: 560 }}>
      <Flash sp={sp} />
      <h1>Candidatura de criador</h1>
      <p className="muted">Avaliamos cada candidatura. Você entra na lista de espera e avisamos quando for aprovado.</p>
      <form action="/apply/creator/submit" method="post" className="stack">
        <fieldset className="card">
          <h3>1. Perfil público</h3>
          <div className="field">
            <label>Nome público</label>
            <input name="name" required />
          </div>
          <div className="field">
            <label>Nome de usuário (vira sift.app/shop/seu-nome)</label>
            <input name="username" required pattern="[A-Za-z0-9_.]{3,}" />
          </div>
          <div className="field">
            <label>Sobre você</label>
            <textarea name="bio" placeholder="O que você indica e por que as pessoas confiam em você" />
          </div>
        </fieldset>
        <fieldset className="card">
          <h3>2. Redes</h3>
          <div className="field">
            <label>Instagram</label>
            <input name="instagram" placeholder="@" />
          </div>
          <div className="field">
            <label>Seguidores</label>
            <input name="followers" type="number" min="0" />
          </div>
        </fieldset>
        <fieldset className="card">
          <h3>3. Dados para pagamento</h3>
          <div className="field">
            <label>Nome legal</label>
            <input name="legal_name" required />
          </div>
          <div className="field">
            <label>Telefone</label>
            <input name="phone" type="tel" required />
          </div>
        </fieldset>
        <button>Enviar candidatura</button>
      </form>
    </div>
  );
}
