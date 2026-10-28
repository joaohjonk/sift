# Sift · constituição de design

27 out 2026. Vale para toda tela, fluxo, peça e linha de texto da Sift: web, app de iPhone, landing, deck. Quem decide é o JJ. Esta constituição não inventa regra nova: ela junta o que já está decidido e diz como uma tela nasce e quando ela pode ir para o ar.

## Artigo 0 · De onde vem a verdade

Em caso de conflito, ganha o de cima.

1. O que o JJ disser, por escrito, na conversa ou no repo.
2. `assets/official/BRAND.md` (brand system v3, 29 set 2026).
3. `assets/official/COPY-SYSTEM.md`, depois `WRITING.md`.
4. `brand/brand-system.json` e os tokens em `brand/tokens/`, que são a versão de máquina dos três acima.
5. O Figma "Sift · Brand System v1". É uma vista do BRAND.md, não a fonte. Onde discorda (tipografia e logo), vale o BRAND.md até o JJ resolver os conflitos abertos.
6. Referências externas e benchmarks, inclusive a ShopMy. A gente copia mecanismo, nunca aparência.

## Artigo 1 · A frase que julga tudo

> A Sift é onde a escolha passa a ter autor, histórico e consequência.

Se uma tela não ajuda uma escolha a ganhar autor, histórico ou consequência, ela não entra.

## Artigo 2 · Os oito pilares

**1. Prova de gosto.** Mostrar poucos, contar muitos. Toda edição diz a sua conta ("ficaram 6 de 214"). Nunca um catálogo, nunca uma grade infinita. Seis coisas escolhidas por vista, no máximo.

**2. O jogo é o produto.** Gosto só aparece quando não dá para ficar com tudo. Toda superfície principal tem uma restrição e um gesto: Fica ou Sai. Os gestos da casa, todos já estudados:
- **Sift this post.** A peça vem sozinha: direita é Exato e fica vermelha, para cima é Parecido, esquerda é Sai e vira caixa tracejada. Termina numa grade "Sift · 6 de 14".
- **Deixa a gente adivinhar.** O onboarding como jogo de palpites, um por tela, cada um com a prova embaixo. Ela responde Sou eu, Quase ou Não sou eu.
- **Monte o look.** O brinquedo da landing: escolha entre muitas peças, fica só o que você usaria, o fim é um cartão para postar.
- **A placa.** A peneira do logo como interação: os furos acendem onde a máquina achou peças e os guardados ficam.
- **No registro.** Segurar o quadrado vermelho para travar um deal, com dez segundos para desfazer, e depois só estados verdadeiros até o recibo.

**3. Viralidade com bom gosto.** A lente é a do Nikita Bier, com a régua da marca:
- Valor nos primeiros três segundos e antes de qualquer cadastro. Pedir e-mail antes do momento mágico derruba a retenção.
- O artefato que a pessoa posta é o motor de crescimento: o cartão 9:16 do look, a grade de quadrados vermelhos (Wordle), o recibo do mês (Receiptify, Wrapped), as quatro favoritas (Letterboxd).
- Só loops positivos. O palpite errado é a linha mais engraçada do cartão, nunca uma humilhação.
- Compartilhar é a ação principal do fim de cada jogo, com fallback para copiar link.
- Lançar denso, não amplo: uma turma de criadoras por vez, com convite de verdade.
- Proibido: streaks, escassez fabricada, "R$ 0 hoje", contador de seguidores na frente, nota de gosto, qualquer growth hack que a gente teria vergonha de explicar.

**4. Honestidade é interface.** Exato e Parecido nunca se misturam. Todo palpite mostra a prova (o post, a data, as palavras). Toda relação comercial aparece: orgânico, recebido, afiliado, publi. A Sift aconselha, nunca bloqueia. Tudo que move dinheiro precisa de uma pessoa aprovando.

**5. O registro é um documento bonito.** A Sift é o lugar onde um julgamento vira documento e o documento fica bonito: a folha de contato, a etiqueta, o certificado, o recibo. O registro usa a mesma página da edição, mais densa, nunca outro mundo. Nada se apaga: o que saiu fica como caixa tracejada, fio ou linha de registro.

**6. Curadoria própria de imagem.** Quatro classes: o objeto guardado, o post, o mundo, os nossos produtos (4:5 no wash #F4F4F1). Sem texto em cima de foto, exceto as marcas da máquina. Crédito a quem fez. Imagem de terceiro só como referência até ter licença ou foto própria.

**7. Tempo lento.** Tudo se move devagar e assenta. Easing `cubic-bezier(.2,.7,.1,1)`, fades de 700 ms, assentamento de 900 a 1000 ms, imagem chega em 1,3 s vinda do wash. Movimento reduzido mostra o estado final.

**8. A página é dela, e fala em primeira pessoa.** A Sift Page de uma criadora é um perfil, como o Instagram, o TikTok ou um curso online: um registro de gosto que ela assinou e escolheu. Quem escolheu foi ela, nunca a Sift. Por isso tudo que é dito ali está na voz dela: "Meus favoritos", "Minhas quatro", "Do meu feed", "Descobri agora", "Ainda não achei o link dessas", "Alguns links me rendem comissão". Nunca "as favoritas dela", "do jeito dela", "a Sift achou para ela". Três vozes, cada uma no seu lugar:
- **A voz dela**, em primeira pessoa: títulos, notas, o porquê de cada peça e o pedido de ajuda ("Sabe de onde é? Me conta").
- **Linhas de registro e ações de quem visita**, neutras: `FICARAM 5 DE 7`, Compartilhar, Acompanhar, Ver na loja. Na página dela, a conta vem na voz dela ou some: "17 peças dos meus últimos 60 posts", nunca "Ficaram 17 de 42" no topo.
- **A voz da Sift**, só nas superfícies da Sift: capa, Para criadoras, Registro, e o lado de dentro dela (Montar, Record, Dinheiro), onde a Sift fala com ela por "você".

Teste: se ela leria a frase em voz alta num story sem estranhar, está certo.

## Artigo 3 · Regras de tela, todas checáveis

| Regra | Como checar |
| --- | --- |
| Só tokens de `brand/generated/tokens.css`. Nenhuma cor solta. | `cstack tokens lint` nos CSS |
| Uma família: Helvetica (TeX Gyre Heros na web). Regular e itálico 400. Bold só dentro do quadrado vermelho. | revisão + `cstack type qa` |
| Raio zero e nenhuma sombra de UI, em lugar nenhum. | grep por `border-radius` e `box-shadow` |
| Vermelho em uma coisa por vista: a guardada, a viva ou a que precisa dela. Nunca preenchimento decorativo. | revisão |
| No máximo seis coisas escolhidas por vista. | revisão |
| Texto de registro em caixa alta, +6%, números tabulares: `SIFT 00291 · FICOU COM @criadora · 12.03.26`. | revisão |
| Toda área de toque tem 44 px. | `cstack type qa` + QA no celular |
| Toda tela desenha cinco estados: carregando (wash, sem spinner), vazio, erro, sucesso e parcial. | tabela de estados no PR |
| Português escrito em português, nunca traduzido. "Você" nas telas da Sift; primeira pessoa na página da criadora (pilar 8). Sem travessão, sem exclamação, sem emoji. | as seis provas do `WRITING.md` |
| Nunca: vitrine, storefront, curadoria, monetizar, "Compre agora", "não é X, é Y". | lista em `banned_language` |
| Nunca nomear uma criadora que não assinou. Em demo é @criadora. Nunca nomear a cidade. | revisão |

## Artigo 4 · Como uma tela nasce

1. **Brief** (`/brief` do cstack): para quem, que decisão, que métrica, o que fica de fora.
2. **Referências como mecanismo**: fonte, mecanismo, transferência. Se tirar a imagem e ainda der para explicar por que funciona, é mecanismo.
3. **Método antes de fazer**: duas formas de resolver comparadas antes de codar.
4. **Construir** só com os componentes do sistema.
5. **Três portões, cada um com outro revisor** (quem fez nunca aprova o próprio trabalho):
   - `/brand-verify` do cstack contra este workspace;
   - `/creative-review` do cstack: bonito, na marca, vivo, eficaz, correto, notas separadas;
   - `/design-review` e `/qa` do gstack, no celular e no desktop.
   Nota mínima 8 de 10 em cada um. Abaixo disso, volta.
6. **O JJ escolhe ou mata.** Cada escolha e cada corte vira linha em `state/feedback.jsonl`. Evidência repetida vira regra aqui.

## Artigo 5 · O que está em aberto

| Ponto | Padrão até decidir | Quem decide |
| --- | --- | --- |
| Tipografia: Helvetica (BRAND.md v3) ou Switzer, Newsreader e Martian Mono (Figma) | Helvetica | JJ |
| Logo: quadrado vermelho (BRAND.md v3, sift.cc) ou só o nome SIFT (Figma) | Quadrado vermelho | JJ |
| Direção criativa v2: Verso, Livro ou Garimpo | O sistema atual desenha os três | JJ |
| Modo escuro: só no app, seguindo o sistema do iPhone | Provisório | JJ |
| Helvetica licenciada para o app nativo | TeX Gyre Heros | JJ |
