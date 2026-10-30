-- Notificações dentro do app + aparelhos inscritos para notificação no celular (Web Push).
-- E endurece as funções auxiliares: só quem precisa pode executá-las.

-- ---------- Notificações (aparecem no sino do app) ----------
create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references organizers (id) on delete cascade,
  guest_id uuid references guests (id) on delete cascade,
  event_id uuid references events (id) on delete cascade,
  tipo text not null check (tipo ~ '^[a-z_]{2,40}$'),
  titulo text not null check (char_length(titulo) between 1 and 80),
  corpo text not null default '' check (char_length(corpo) <= 240),
  -- só caminhos internos do app (ex.: /painel/festas/…), nunca link externo
  link text check (link ~ '^/[A-Za-z0-9/_?=&%.-]*$' and link !~ '^//'),
  lida_em timestamptz,
  criada_em timestamptz not null default now(),
  check ((organizer_id is null) <> (guest_id is null))
);
create index notificacoes_organizer_idx on notificacoes (organizer_id, criada_em desc) where organizer_id is not null;
create index notificacoes_guest_idx on notificacoes (guest_id, criada_em desc) where guest_id is not null;

-- ---------- Aparelhos inscritos (Web Push) ----------
create table push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references organizers (id) on delete cascade,
  guest_id uuid references guests (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  aparelho text check (char_length(aparelho) <= 200),
  criada_em timestamptz not null default now(),
  check ((organizer_id is null) <> (guest_id is null))
);
create index push_inscricoes_organizer_idx on push_inscricoes (organizer_id) where organizer_id is not null;

alter table notificacoes enable row level security;
alter table push_inscricoes enable row level security;
revoke all on notificacoes, push_inscricoes from anon;

-- Organizador: lê as próprias notificações e só pode marcar como lida (nenhuma outra coluna).
-- Quem cria notificação é sempre o servidor (service_role).
grant select on notificacoes to authenticated;
grant update (lida_em) on notificacoes to authenticated;
create policy "minhas notificações (ler)" on notificacoes for select to authenticated
  using (organizer_id = meu_organizer_id());
create policy "minhas notificações (marcar lida)" on notificacoes for update to authenticated
  using (organizer_id = meu_organizer_id()) with check (organizer_id = meu_organizer_id());

-- Organizador: inscreve e remove os próprios aparelhos.
grant select, insert, delete on push_inscricoes to authenticated;
create policy "meus aparelhos (ler)" on push_inscricoes for select to authenticated
  using (organizer_id = meu_organizer_id());
create policy "meus aparelhos (inscrever)" on push_inscricoes for insert to authenticated
  with check (organizer_id = meu_organizer_id() and guest_id is null);
create policy "meus aparelhos (remover)" on push_inscricoes for delete to authenticated
  using (organizer_id = meu_organizer_id());

-- Tempo real: o sino atualiza na hora (o Realtime respeita o RLS acima).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table notificacoes;
  end if;
end $$;

-- ---------- Endurecimento das funções auxiliares ----------
-- Por padrão o Postgres deixa QUALQUER papel executar funções (inclusive o visitante
-- anônimo, pela API). Estas só são usadas pelas regras de RLS e pelas travas.
revoke execute on function meu_organizer_id() from public, anon;
revoke execute on function sou_dono_do_evento(uuid) from public, anon;
revoke execute on function papel_da_requisicao() from public, anon;
revoke execute on function eh_sistema() from public, anon;
grant execute on function meu_organizer_id() to authenticated, service_role;
grant execute on function sou_dono_do_evento(uuid) to authenticated, service_role;
grant execute on function papel_da_requisicao() to authenticated, service_role;
grant execute on function eh_sistema() to authenticated, service_role;
-- Funções de gatilho não são chamáveis pela API, mas não há motivo para ficarem abertas.
revoke execute on function travar_evento_encerrado() from public, anon;
revoke execute on function travar_por_convidado() from public, anon;
revoke execute on function travar_evento() from public, anon;
revoke execute on function validar_ticket() from public, anon;
