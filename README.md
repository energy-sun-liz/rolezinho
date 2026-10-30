# Rolêzinho

Seu rolê, sem complicação. Organizador cria o evento, convidado entra pelo link
com um código, divide os custos e paga no Pix direto para quem organiza.

## Como rodar no computador

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes (dinheiro, Pix, datas, avatar e regras do banco)
```

Sem as variáveis do Supabase o site abre normalmente; `/api/saude` mostra
`"banco": "nao_configurado"`.

## Onde está cada coisa

```
src/app/                 páginas e rotas (Next.js 16, App Router)
src/components/          componentes (marca, avatar)
src/lib/pix.ts           lê o Pix copia-e-cola do organizador e gera o do convidado com valor
src/lib/dinheiro.ts      valor devido, tickets de pagamento (pendente → informado → confirmado)
src/lib/periodo.ts       período de 45 dias, relatório por 4 meses
src/lib/avatar.ts        gerador de avatar em SVG
supabase/migrations/     banco: tabelas, travas e regras de segurança (RLS)
tests/                   testes automáticos
prototipo/               app antigo da festa (HTML puro), só para referência
```

## App instalável e notificações

- `src/app/manifest.ts` + `public/icones/` (gerados por `node scripts/gerar-icones.mjs`)
  deixam o Rolêzinho ser adicionado à tela de início; `/instalar` explica o passo a passo.
- `public/sw.js` recebe as notificações com o app fechado (Web Push, chaves VAPID nas
  variáveis `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- `src/lib/notificacoes.ts` → `notificar()` grava no sino (tabela `notificacoes`) e envia
  para os aparelhos inscritos. O sino atualiza na hora pelo Supabase Realtime.
- No iPhone, notificação só funciona com o app instalado na tela de início (iOS 16.4+).

## Testes de ponta a ponta

```bash
npm run build && npx next start -p 3000   # porta 3000: a liberada no login do Supabase
npm run e2e                 # Modo Organizador
npm run e2e:notificacoes    # app instalável + notificações
```

## Decisões que valem saber

- **Dinheiro em centavos**, sempre inteiro. Nada de `0.1 + 0.2`.
- **O Rolêzinho não toca no dinheiro dos convidados.** O Pix vai direto para a
  chave do organizador; o app só monta o código com o valor certo.
- **RLS em todas as tabelas.** Visitante anônimo não lê nada direto do banco;
  organizador só enxerga os próprios eventos; evento encerrado fica travado.
- **Preços dos tipos de evento ficam no banco** (`event_types`), sem precisar
  publicar o app de novo.
