import { db } from "@/lib/db";
import { listUsersForLogin } from "@/lib/repo";
import { Avatar, Flash, TierBadge } from "@/components/ui";

const GROUPS = [
  ["creator", "Criadores"],
  ["brand", "Marcas"],
  ["shopper", "Consumidores"],
  ["admin", "Admin"],
] as const;

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const users = listUsersForLogin(db());
  return (
    <div style={{ maxWidth: 760 }}>
      <Flash sp={sp} />
      <h1>Entrar</h1>
      <p className="muted">Login de demonstração: escolha uma conta para ver o app pelo lado dela.</p>
      {GROUPS.map(([role, label]) => (
        <div key={role} className="section">
          <h3>{label}</h3>
          <div className="grid grid-cards">
            {users
              .filter((u) => u.role === role)
              .map((u) => (
                <form key={u.id} action="/login/as" method="post" className="card row between">
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="next" value={sp.next ?? ""} />
                  <div className="row">
                    <Avatar name={u.name} />
                    <div>
                      <div>{u.name}</div>
                      <div className="small muted">
                        @{u.username} {u.role === "creator" && <TierBadge score={u.trust_score} />}{" "}
                        {u.status !== "active" && "(lista de espera)"}
                      </div>
                    </div>
                  </div>
                  <button className="small">Entrar</button>
                </form>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
