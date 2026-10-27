import type { ReactNode } from "react";
import { SideNav } from "./ui";

export function CreatorShell({ children }: { children: ReactNode }) {
  return (
    <div className="layout-side">
      <SideNav
        title="Criador"
        links={[
          ["/dashboard", "Visão geral"],
          ["/links", "Links e coleções"],
          ["/payouts", "Ganhos"],
          ["/opportunities", "Opportunities"],
          ["/collaborations", "Collaborations"],
          ["/gifting", "Gifting"],
          ["/chat", "Chat com marcas"],
        ]}
      />
      <div>{children}</div>
    </div>
  );
}

export function BrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="layout-side">
      <SideNav
        title="Marca"
        links={[
          ["/brand", "Track"],
          ["/brand/discover", "Discover"],
          ["/brand/gifting", "Engage: gifting"],
          ["/brand/opportunities", "Amplify: opportunities"],
          ["/brand/collaborations", "Collaborations"],
          ["/chat", "Chat"],
          ["/brand/onboarding", "Integração da loja"],
        ]}
      />
      <div>{children}</div>
    </div>
  );
}
