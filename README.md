# Sift

Reconstrução funcional do app do ShopMy (consumidor, criador e marca), feita a partir da engenharia reversa do
`shopmy-engenharia-reversa/` na pasta do projeto, como base para a Sift.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes das regras de negócio (banco em memória)
npm run seed       # apaga e recria o banco de demonstração
```

O banco é SQLite em `data/sift.db`, criado e populado com dados fictícios na primeira requisição.
O login é de demonstração: em `/login` você escolhe a conta (criador, marca, consumidor ou admin).

## Stack

Next.js 15 (App Router, server components e server actions), React 19, SQLite via `better-sqlite3`, Vitest.
Sem framework de CSS: `src/app/globals.css`.

```
src/lib/schema.ts   modelo de dados (cada tabela aponta o recurso da API do ShopMy)
src/lib/repo.ts     consultas e regras (link rastreado, comissão, tiers, fluxos)
src/lib/tiers.ts    tiers por pontuação de confiança
src/lib/seed.ts     dados de demonstração
src/app/            telas e rotas
tests/              testes
```

## Mapa ShopMy → este app

| ShopMy | Aqui | O que faz |
| --- | --- | --- |
| `go.shopmy.us/p-<id>` | `/go/[pinId]` | Registra o clique e redireciona com `sift_pin` |
| `/shop` | `/shop` | Catálogo Indústria → Departamento → Categoria, ordenado por cliques |
| `/shop/product/:id` | `/shop/product/[id]` | Produto com prova social e quem indica |
| `/shop/:username` | `/shop/[username]` | Vitrine do curador com abas e "Confiado por N" |
| `/shop/circles/:id`, `/shop/my/circles` | `/shop/circles`, `/shop/circles/[id]` | Circles e loja combinada |
| `/apply/creator` | `/apply/creator` | Candidatura em 3 passos, lista de espera |
| `/dashboard` | `/dashboard` | Cliques, pedidos, saldo e progresso de tier |
| `/links`, `/collections/:id` | `/links` | Criar link (Pin), coleções, comissão por link |
| `/payouts` | `/payouts` | Comissão pendente e liberada, saque |
| `/opportunities` | `/opportunities` | Convite → aceite → envio do post → pagamento |
| `/collaborations` | `/collaborations` | Proposta com entregáveis, envio e aprovação |
| `/gifting` | `/gifting` | Escolher presente de um lookbook |
| `/chat` | `/chat` | Chat marca ↔ criador (criador inicia a partir de Trendsetter) |
| Track (`Pins/analytics/brand/*`) | `/brand` | Cliques, pedidos, receita, promoters por tier |
| Discover (`/Discover/users`) | `/brand/discover` | Busca de criadores, taxa personalizada |
| Engage (`Lookbooks`) | `/brand/gifting` | Lookbook e convites em lote |
| Amplify (`Opportunities`) | `/brand/opportunities` | Criar opportunity paga ou só comissão |
| `Contracts` | `/brand/collaborations` | Propor collaboration e aprovar entregáveis |
| `/onboarding/brand`, `/connect/shopify` | `/brand/onboarding` | Loja, rastreio de clique, pedidos, atualizações, cancelamentos |
| admin | `/admin` | Aprovar candidaturas |

## API JSON (para o app de celular)

Base `/api/v1`. Login de demonstração: `POST /api/v1/session {"username": "marinaskin"}` devolve um `token`;
mande `Authorization: Bearer <token>` nas rotas logadas. Erros vêm como `{ "error": "..." }`.

| Rota | Quem | O que faz |
| --- | --- | --- |
| `GET /me` | logado | Usuário e tier |
| `GET /shop/hierarchy` | público | Categorias |
| `GET /shop/products?department=&category=&q=&sort=month\|week\|promoters` | público | Catálogo com prova social |
| `GET /shop/products/:id` | público | Produto e quem indica |
| `GET /curators`, `GET /curators/:username` | público | Curadores e vitrine |
| `GET /circles`, `POST /circles`, `GET /circles/:id` | público / consumidor | Circles e loja combinada |
| `GET /creator/summary` | criador | Cliques, pedidos, saldo, tier |
| `GET /pins`, `POST /pins`, `DELETE /pins/:id` | criador | Links rastreados |
| `GET /collections`, `POST /collections` | criador | Coleções |
| `GET /payouts`, `POST /payouts` | criador | Ganhos e saque |
| `GET /opportunities`, `PATCH /opportunities/:id` | criador | Aceitar, recusar, enviar post |
| `GET /brand/analytics`, `GET /brand/discover` | marca | Track e Discover |

## Fluxos da Sift além do ShopMy

Vieram da call com uma criadora em 26.10.26 e da pesquisa de UX. Entre com a `@criadora` para ver.

| Tela | O que faz |
| --- | --- |
| `/build` · Sift this post | A máquina sugere as peças de cada post; ela confirma com seta ou arrasto. Direita é Exato, cima é Parecido, esquerda tira. Termina em "Sift · k de n". Tirar não apaga: vai para o pontilhado da página. |
| `/shop/<handle>?onde=br\|abroad` | Filtro da Sift Page: Compra no Brasil / Só lá fora (`&lang=en`: Shoppable in Brazil / Available abroad). Vem de `products.market`. |
| `/record` e `/record/<id>` | Sift Record. Estados Rascunho, Assinado, No ar, Verificado, Nota emitida, Pago. Estados de lado calculados: Atrasado, Conflito (prazo acima de 90 dias), Direitos acabando, Precisa dela (entrega sem aviso de publi). Ação em nome dela só segurando o quadrado, com 10 s para desfazer. Proposta de cláusula de narrativa nos contratos abertos. |
| `/finance` | Recebíveis em escala de tempo, receber hoje com o custo em reais, agência e Sift sobre o mesmo valor. |

Leitura de um perfil público (posts com publi, marca marcada sem aviso, mediana de views, marcas que ela move sem ganhar):

```bash
APIFY_TOKEN=... npx tsx scripts/import-instagram.ts <handle> --limit 60 --people mae,amiga
```

Grava em `data/creators/<handle>/` (fora do git). Só perfis públicos, sem conta falsa nem telefone virtual.

## Ainda não feito

- Autenticação de verdade, integrações reais de loja (webhooks de pedido) e pagamento.
- Recursos mais novos do ShopMy: Spotlights (anúncio pago), Smart DM, Autopilot, Noir, Consults, Taste Profile, app iOS e extensão.
- As diferenças da Sift apontadas no relatório: contrato lido por IA, checagem de exclusividade, checagem do post contra o contrato, Pix com antecipação.
