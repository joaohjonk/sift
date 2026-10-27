import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { curatorShop, isFollowing } from "@/lib/repo";
import { currentUser } from "@/lib/session";
import { toggleFollow } from "../../actions";
import { Avatar, Flash, ProductCard, TierBadge } from "@/components/ui";
import { formatCompact } from "@/lib/money";

const KIND = { shelf: "Prateleira", look: "Look", post: "Post", guide: "Guia" } as const;

export default async function CuratorShop({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const d = db();
  const shop = curatorShop(d, username);
  if (!shop) notFound();
  const me = await currentUser();
  const following = me ? isFollowing(d, me.id, shop.user.id) : false;
  const tab = sp.tab ?? "latest";
  const tabs: [string, string][] = [
    ["latest", "Novidades"],
    ["popular", "Mais populares"],
    ...shop.collections.map((c) => [String(c.id), c.name] as [string, string]),
  ];
  const coll = shop.collections.find((c) => String(c.id) === tab);
  const pins = tab === "latest" ? shop.latest : tab === "popular" ? shop.popular : (coll?.pins ?? []);
  const path = `/shop/${username}`;
  return (
    <>
      <Flash sp={sp} />
      <div className="row" style={{ gap: 20 }}>
        <Avatar name={shop.user.name} size="lg" />
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 4 }}>
            {shop.user.name} <TierBadge score={shop.user.trust_score} />
          </h1>
          <p className="muted" style={{ marginBottom: 4 }}>
            {shop.user.bio}
          </p>
          <div className="small muted">
            {shop.user.instagram} · {formatCompact(shop.user.followers)} seguidores · {shop.user.location} · Confiado por{" "}
            {formatCompact(shop.trustedBy)} pessoa{shop.trustedBy === 1 ? "" : "s"}
          </div>
        </div>
        {me && me.id !== shop.user.id && (
          <form action={toggleFollow}>
            <input type="hidden" name="curator_id" value={shop.user.id} />
            <input type="hidden" name="back" value={path} />
            <button className={following ? "ghost" : ""}>{following ? "Seguindo" : "Confiar neste curador"}</button>
          </form>
        )}
      </div>
      <nav className="tabs">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`${path}?tab=${key}`} className={tab === key ? "active" : ""}>
            {label}
          </Link>
        ))}
      </nav>
      {coll && <p className="small muted">{KIND[coll.kind]}</p>}
      <div className="grid grid-products">
        {pins.map((pin) => (
          <div key={pin.id}>
            <ProductCard product={{ ...pin.product, clicks_month: pin.clicks_month }} href={`/go/${pin.id}`} />
            <Link href={`/shop/product/${pin.product.id}`} className="small muted">
              Quem mais indica
            </Link>
          </div>
        ))}
      </div>
      {!pins.length && <p className="muted">Nada aqui ainda.</p>}
    </>
  );
}
