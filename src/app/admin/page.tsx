import { db } from "@/lib/db";
import type { User } from "@/lib/repo";
import { requireUser } from "@/lib/session";
import { reviewApplication } from "../actions";
import { Flash } from "@/components/ui";
import { formatCompact } from "@/lib/money";

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  await requireUser(["admin"], "/admin");
  const waitlist = db().prepare("SELECT * FROM users WHERE role = 'creator' AND status = 'waitlist' ORDER BY created_at").all() as User[];
  return (
    <>
      <Flash sp={sp} />
      <h1>Candidaturas de criadores</h1>
      <table>
        <thead>
          <tr>
            <th>Criador</th>
            <th>Instagram</th>
            <th>Seguidores</th>
            <th>Bio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {waitlist.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name}
                <div className="small muted">
                  @{u.username} · {u.legal_name} · {u.phone}
                </div>
              </td>
              <td>{u.instagram}</td>
              <td>{formatCompact(u.followers)}</td>
              <td>{u.bio}</td>
              <td className="row">
                <form action={reviewApplication}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="approve" value="1" />
                  <button className="small">Aprovar</button>
                </form>
                <form action={reviewApplication}>
                  <input type="hidden" name="user_id" value={u.id} />
                  <input type="hidden" name="approve" value="0" />
                  <button className="small ghost">Recusar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!waitlist.length && <p className="muted">Nenhuma candidatura pendente.</p>}
    </>
  );
}
