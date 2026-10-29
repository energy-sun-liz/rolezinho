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

## Decisões que valem saber

- **Dinheiro em centavos**, sempre inteiro. Nada de `0.1 + 0.2`.
- **O Rolêzinho não toca no dinheiro dos convidados.** O Pix vai direto para a
  chave do organizador; o app só monta o código com o valor certo.
- **RLS em todas as tabelas.** Visitante anônimo não lê nada direto do banco;
  organizador só enxerga os próprios eventos; evento encerrado fica travado.
- **Preços dos tipos de evento ficam no banco** (`event_types`), sem precisar
  publicar o app de novo.
