import { db } from "@/lib/db";
import { postsToSift } from "@/lib/build";
import { requireUser } from "@/lib/session";
import { CreatorShell } from "@/components/shells";
import { Rec } from "@/components/ui";
import { SiftThisPost } from "@/components/sift-this-post";

// Sift this post: ela monta a página jogando.

export default async function BuildPage() {
  const user = await requireUser(["creator"], "/build");
  const posts = postsToSift(db(), user.id);
  return (
    <CreatorShell>
      <Rec className="quiet">Sift this post</Rec>
      <h1 style={{ marginTop: 16 }}>Você monta a página jogando</h1>
      <p className="lead quiet">
        A máquina acha as peças e sugere. Você confirma com um gesto: direita é Exato, cima é Parecido, esquerda tira. Também dá para usar as setas.
      </p>
      <SiftThisPost posts={posts} username={user.username} />
    </CreatorShell>
  );
}
