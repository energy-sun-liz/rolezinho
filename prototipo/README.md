# 🪩 App do Aniversário — tema neon

Site da festa com contagem regressiva, avisos, quem já pagou (com avatar), missões e
área do participante (cada convidado entra com seu código e personaliza o avatar).
Painel da aniversariante em **/admin**.

## Publicar na Vercel (uns 10 minutos)

1. **GitHub** — crie um repositório novo (pode ser privado) e envie todos os arquivos
   desta pasta (no site do GitHub: *Add file → Upload files* e arraste tudo).
2. **Vercel** — em vercel.com, *Add New → Project*, importe o repositório.
   Framework: **Other**. Não precisa de comando de build. Clique em *Deploy*.
3. **Banco de dados (grátis)** — no projeto da Vercel: aba **Storage → Create Database →
   Upstash for Redis** (plano Free) → conecte ao projeto. Isso cria sozinho as variáveis
   `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
4. **Senha do painel** — *Settings → Environment Variables*: crie `ADMIN_PASSWORD`
   com a senha que você quiser.
5. **Redeploy** — aba *Deployments* → nos três pontinhos do último → *Redeploy*
   (para as variáveis valerem).

Pronto: `seu-projeto.vercel.app` é o site e `seu-projeto.vercel.app/admin` é o painel.

## Como usar o painel

- **Participantes**: cole os nomes (um por linha). Cada um ganha código e avatar aleatório.
  O botão **📋 Convite** copia uma mensagem com o código e um link que já entra direto
  na área da pessoa — é só colar no WhatsApp.
- **Pagamentos**: clique em *pendente* para marcar *pago ✓* (clique de novo desfaz).
- **Custos**: o aluguel (R$ 120) é obrigatório. Crie extras opcionais (bebidas,
  churrasco…) — cada convidado escolhe na própria área se quer participar, ou você
  inclui/tira pelo painel.
- **Avisos**: publique novidades; use 📌 para fixar no topo.
- **Missões**: no dia da festa, toque no nome de quem cumpriu cada desafio.
- **Dados da festa**: título, datas (horário de Brasília), local, chave Pix.

O site atualiza sozinho a cada 30 segundos para quem estiver com ele aberto.

## Testar no computador (opcional)

```
node scripts/dev-server.js
```
Abra http://localhost:3000 — senha do painel: `teste`. Sem o Upstash, os dados ficam
só na memória.
