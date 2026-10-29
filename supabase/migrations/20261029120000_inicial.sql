-- Rolêzinho — esquema inicial (Etapa 1)
--
-- Regras gerais:
--  * Dinheiro sempre em centavos (integer).
--  * RLS ligado em TODAS as tabelas. O visitante anônimo não lê nada direto do
--    banco: páginas públicas e convidados passam pelo servidor do app, que
--    confere o código do convidado.
--  * O organizador logado só enxerga os próprios eventos.
--  * Evento encerrado não aceita edição (só o sistema, para apagar dados).


-- ---------- Tipos ----------
create type status_evento as enum ('rascunho', 'agendado', 'ativo', 'encerrado', 'apagado');
create type status_ticket as enum ('pendente', 'informado', 'confirmado', 'contestado');
create type presenca as enum ('vou', 'talvez', 'nao');
create type regra_missao as enum ('selfie_automatica', 'organizador_confirma');
create type status_conclusao as enum ('pendente', 'aprovada', 'recusada');

-- ---------- Tabelas ----------
create table organizers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  email text not null,
  criado_em timestamptz not null default now()
);

-- Preços no banco: mudar valor não exige publicar o app de novo.
create table event_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nome text not null,
  exemplos text not null default '',
  max_convidados integer not null check (max_convidados > 0),
  preco_centavos integer not null check (preco_centavos >= 0),
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references organizers (id) on delete cascade,
  event_type_id uuid not null references event_types (id),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  titulo text not null check (char_length(titulo) between 1 and 120),
  subtitulo text not null default '' check (char_length(subtitulo) <= 160),
  local text not null default '' check (char_length(local) <= 160),
  tema text not null default 'rolezinho',
  festa_inicio timestamptz,
  festa_fim timestamptz,
  -- 45 dias contando o dia de início; relatório por 4 meses depois do fim
  periodo_inicio date,
  periodo_fim date generated always as (periodo_inicio + 44) stored,
  relatorio_ate date generated always as (((periodo_inicio + 44) + interval '4 months')::date) stored,
  status status_evento not null default 'rascunho',
  pix_copia_cola_base text,
  pix_chave text,
  pix_nome_recebedor text,
  pix_cidade text,
  criado_em timestamptz not null default now(),
  check (festa_fim is null or festa_inicio is null or festa_fim >= festa_inicio)
);
create index events_organizer_idx on events (organizer_id);

-- Organizador paga o Rolêzinho (Asaas). idempotency_key evita cobrança em dobro.
create table event_purchases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  asaas_payment_id text unique,
  valor_centavos integer not null check (valor_centavos >= 0),
  status text not null default 'aguardando' check (status in ('aguardando', 'pago', 'cancelado', 'estornado')),
  idempotency_key text not null unique,
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);
create index event_purchases_event_idx on event_purchases (event_id);

create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  apelido text not null default '' check (char_length(apelido) <= 24),
  -- código de acesso: sem letras ambíguas (0, O, 1, I, L)
  codigo text not null check (codigo ~ '^[A-HJ-KM-NP-Z2-9]{6,10}$'),
  avatar jsonb not null default '{}'::jsonb,
  presenca presenca,
  presenca_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (event_id, codigo)
);
create index guests_event_idx on guests (event_id);

create table costs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 60),
  valor_centavos integer not null check (valor_centavos >= 0),
  opcional boolean not null default false,
  criado_em timestamptz not null default now()
);
create index costs_event_idx on costs (event_id);

create table guest_costs (
  guest_id uuid not null references guests (id) on delete cascade,
  cost_id uuid not null references costs (id) on delete cascade,
  aderiu boolean not null default true,
  primary key (guest_id, cost_id)
);

create table payment_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  guest_id uuid not null references guests (id) on delete cascade,
  valor_centavos integer not null check (valor_centavos > 0),
  referencia text not null check (referencia ~ '^[A-Za-z0-9]{1,25}$'),
  status status_ticket not null default 'pendente',
  informado_em timestamptz,
  confirmado_em timestamptz,
  comprovante_path text,
  motivo_contestacao text check (char_length(motivo_contestacao) <= 200),
  criado_em timestamptz not null default now()
);
create index payment_tickets_event_idx on payment_tickets (event_id);
create index payment_tickets_guest_idx on payment_tickets (guest_id);

create table updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 800),
  fixado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index updates_event_idx on updates (event_id);

create table selfie_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  tipo text not null check (tipo in ('checkin', 'missao', 'brinde', 'grupo', 'conquista')),
  arquivo_moldura text not null
);

create table missions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  emoji text not null default '⭐' check (char_length(emoji) <= 8),
  titulo text not null check (char_length(titulo) between 1 and 120),
  pontos integer not null default 10 check (pontos between 0 and 1000),
  regra regra_missao not null default 'organizador_confirma',
  template_selfie_id uuid references selfie_templates (id),
  criado_em timestamptz not null default now()
);
create index missions_event_idx on missions (event_id);

create table mission_completions (
  mission_id uuid not null references missions (id) on delete cascade,
  guest_id uuid not null references guests (id) on delete cascade,
  status status_conclusao not null default 'pendente',
  concluida_em timestamptz not null default now(),
  primary key (mission_id, guest_id)
);

-- Resumo anônimo que sobra depois de apagar o evento (métricas do Rolêzinho).
create table event_stats (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid references event_types (id),
  convidados integer not null,
  pagos integer not null,
  criado_em timestamptz not null default now()
);

-- Registro bruto dos avisos do Asaas, para auditoria.
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  payload jsonb not null,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);

-- ---------- Funções auxiliares ----------

-- Id do organizador logado (null se não for organizador).
create function meu_organizer_id() returns uuid
  language sql stable security definer set search_path = public
as $$ select id from organizers where auth_user_id = auth.uid() $$;

create function sou_dono_do_evento(evento uuid) returns boolean
  language sql stable security definer set search_path = public
as $$ select exists (select 1 from events where id = evento and organizer_id = meu_organizer_id()) $$;

-- Papel de quem fez a requisição. Usa o "role" da sessão (definido pelo Supabase
-- a cada requisição) e não current_user, que vira o dono do banco dentro de
-- funções "security definer" e faria qualquer usuário parecer o sistema.
create function papel_da_requisicao() returns text
  language sql stable
as $$ select coalesce(nullif(current_setting('role', true), 'none'), current_user) $$;

-- Só o sistema (service_role / dono do banco) passa por cima das travas.
create function eh_sistema() returns boolean
  language sql stable
as $$ select papel_da_requisicao() not in ('anon', 'authenticated') $$;

-- Evento encerrado/apagado não aceita mudanças nas tabelas filhas.
create function travar_evento_encerrado() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare
  evento uuid;
  st status_evento;
begin
  if eh_sistema() then
    return coalesce(new, old);
  end if;
  evento := coalesce(new.event_id, old.event_id);
  select status into st from events where id = evento;
  if st in ('encerrado', 'apagado') then
    raise exception 'Este evento já foi encerrado e não pode mais ser alterado.' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

-- Mesma trava para tabelas que não têm event_id direto.
create function travar_por_convidado() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare st status_evento;
begin
  if eh_sistema() then
    return coalesce(new, old);
  end if;
  select e.status into st from guests g join events e on e.id = g.event_id
   where g.id = coalesce(new.guest_id, old.guest_id);
  if st in ('encerrado', 'apagado') then
    raise exception 'Este evento já foi encerrado e não pode mais ser alterado.' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

create function travar_evento() returns trigger
  language plpgsql
as $$
begin
  if eh_sistema() then
    return new;
  end if;
  if old.status in ('encerrado', 'apagado') then
    raise exception 'Este evento já foi encerrado e não pode mais ser alterado.' using errcode = 'check_violation';
  end if;
  -- status, período e dono só mudam pelo sistema (pagamento, tarefa diária)
  if new.status is distinct from old.status
     or new.organizer_id is distinct from old.organizer_id
     or new.event_type_id is distinct from old.event_type_id then
    raise exception 'Status, dono e tipo do evento só mudam pelo sistema.' using errcode = 'insufficient_privilege';
  end if;
  -- data de início: escolhida pelo organizador uma vez, antes de começar
  if new.periodo_inicio is distinct from old.periodo_inicio and old.status not in ('rascunho', 'agendado') then
    raise exception 'A data de início não pode mudar depois que o período começou.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- Tickets: transições permitidas e quem pode fazê-las.
-- Organizador (role authenticated): informado->confirmado, informado->contestado,
--   pendente->confirmado, confirmado->informado (desfazer).
-- Convidado (via servidor, service_role): pendente->informado, contestado->informado, informado->pendente.
create function validar_ticket() returns trigger
  language plpgsql
as $$
declare
  par text := old.status || '>' || new.status;
begin
  if new.status = old.status then
    if new.valor_centavos is distinct from old.valor_centavos and old.status <> 'pendente' then
      raise exception 'Só dá para mudar o valor de um pagamento pendente.' using errcode = 'check_violation';
    end if;
    return new;
  end if;
  if papel_da_requisicao() = 'authenticated' then
    if par not in ('informado>confirmado', 'informado>contestado', 'pendente>confirmado', 'confirmado>informado') then
      raise exception 'O organizador não pode mudar este pagamento de % para %.', old.status, new.status
        using errcode = 'insufficient_privilege';
    end if;
  elsif not eh_sistema() or par not in (
      'pendente>informado', 'contestado>informado', 'informado>pendente',
      'informado>confirmado', 'informado>contestado', 'pendente>confirmado', 'confirmado>informado') then
    raise exception 'Mudança de pagamento não permitida: % para %.', old.status, new.status
      using errcode = 'insufficient_privilege';
  end if;
  if new.status = 'informado' then new.informado_em := now(); end if;
  if new.status = 'confirmado' then new.confirmado_em := now(); end if;
  if new.status <> 'confirmado' then new.confirmado_em := null; end if;
  if new.status <> 'contestado' then new.motivo_contestacao := null; end if;
  return new;
end $$;

-- ---------- Triggers ----------
create trigger events_trava before update on events for each row execute function travar_evento();
create trigger guests_trava before insert or update or delete on guests for each row execute function travar_evento_encerrado();
create trigger costs_trava before insert or update or delete on costs for each row execute function travar_evento_encerrado();
create trigger tickets_trava before insert or update or delete on payment_tickets for each row execute function travar_evento_encerrado();
create trigger updates_trava before insert or update or delete on updates for each row execute function travar_evento_encerrado();
create trigger missions_trava before insert or update or delete on missions for each row execute function travar_evento_encerrado();
create trigger guest_costs_trava before insert or update or delete on guest_costs for each row execute function travar_por_convidado();
create trigger completions_trava before insert or update or delete on mission_completions for each row execute function travar_por_convidado();
create trigger tickets_transicao before update on payment_tickets for each row execute function validar_ticket();

-- ---------- RLS ----------
alter table organizers enable row level security;
alter table event_types enable row level security;
alter table events enable row level security;
alter table event_purchases enable row level security;
alter table guests enable row level security;
alter table costs enable row level security;
alter table guest_costs enable row level security;
alter table payment_tickets enable row level security;
alter table updates enable row level security;
alter table selfie_templates enable row level security;
alter table missions enable row level security;
alter table mission_completions enable row level security;
alter table event_stats enable row level security;
alter table webhook_events enable row level security;

-- Anônimo: nada direto no banco.
revoke all on all tables in schema public from anon;

-- Catálogos públicos para quem está logado (tipos de evento e templates).
grant select on event_types, selfie_templates to authenticated;
create policy "tipos ativos" on event_types for select to authenticated using (ativo);
create policy "templates" on selfie_templates for select to authenticated using (true);

-- Organizador: o próprio cadastro.
grant select, insert, update on organizers to authenticated;
create policy "meu cadastro (ler)" on organizers for select to authenticated using (auth_user_id = auth.uid());
create policy "meu cadastro (criar)" on organizers for insert to authenticated with check (auth_user_id = auth.uid());
create policy "meu cadastro (editar)" on organizers for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- Eventos: só os meus. Criar sempre como rascunho. Apagar só rascunho (o resto é pelo sistema).
grant select, insert, update, delete on events to authenticated;
create policy "meus eventos (ler)" on events for select to authenticated using (organizer_id = meu_organizer_id());
create policy "meus eventos (criar)" on events for insert to authenticated
  with check (organizer_id = meu_organizer_id() and status = 'rascunho');
create policy "meus eventos (editar)" on events for update to authenticated
  using (organizer_id = meu_organizer_id()) with check (organizer_id = meu_organizer_id());
create policy "meus eventos (apagar rascunho)" on events for delete to authenticated
  using (organizer_id = meu_organizer_id() and status = 'rascunho');

-- Compras: o organizador só lê; quem grava é o servidor (webhook do Asaas).
grant select on event_purchases to authenticated;
create policy "minhas compras" on event_purchases for select to authenticated using (sou_dono_do_evento(event_id));

-- Tabelas do evento: tudo liberado para o dono do evento.
grant select, insert, update, delete on guests, costs, payment_tickets, updates, missions to authenticated;
create policy "convidados do meu evento" on guests for all to authenticated
  using (sou_dono_do_evento(event_id)) with check (sou_dono_do_evento(event_id));
create policy "custos do meu evento" on costs for all to authenticated
  using (sou_dono_do_evento(event_id)) with check (sou_dono_do_evento(event_id));
create policy "avisos do meu evento" on updates for all to authenticated
  using (sou_dono_do_evento(event_id)) with check (sou_dono_do_evento(event_id));
create policy "missões do meu evento" on missions for all to authenticated
  using (sou_dono_do_evento(event_id)) with check (sou_dono_do_evento(event_id));
-- Tickets: o organizador lê e muda status (o trigger limita as mudanças); não cria nem apaga.
create policy "tickets do meu evento (ler)" on payment_tickets for select to authenticated using (sou_dono_do_evento(event_id));
create policy "tickets do meu evento (status)" on payment_tickets for update to authenticated
  using (sou_dono_do_evento(event_id)) with check (sou_dono_do_evento(event_id));
revoke insert, delete on payment_tickets from authenticated;

grant select, insert, update, delete on guest_costs, mission_completions to authenticated;
create policy "adesões do meu evento" on guest_costs for all to authenticated
  using (exists (select 1 from guests g where g.id = guest_id and sou_dono_do_evento(g.event_id)))
  with check (exists (select 1 from guests g where g.id = guest_id and sou_dono_do_evento(g.event_id)));
create policy "missões cumpridas no meu evento" on mission_completions for all to authenticated
  using (exists (select 1 from guests g where g.id = guest_id and sou_dono_do_evento(g.event_id)))
  with check (exists (select 1 from guests g where g.id = guest_id and sou_dono_do_evento(g.event_id)));

-- event_stats e webhook_events: só o sistema (sem políticas = ninguém de fora lê).

-- ---------- Dados iniciais ----------
insert into event_types (slug, nome, exemplos, max_convidados, preco_centavos, ordem) values
  ('role-rapido', 'Rolê rápido', 'Churrasco, happy hour, bar', 15, 990, 1),
  ('aniversario', 'Aniversário', 'Casa, salão de festas, bar', 40, 1990, 2),
  ('viagem', 'Viagem em grupo', 'Praia, show, excursão', 30, 2990, 3),
  ('chacara', 'Chácara / fim de semana', 'Casa alugada, 2 a 3 dias', 80, 3990, 4),
  ('festao', 'Festão', 'Formatura, confraternização de empresa', 200, 7990, 5);

insert into selfie_templates (slug, nome, tipo, arquivo_moldura) values
  ('cheguei', 'Cheguei no rolê!', 'checkin', '/selfie/cheguei.svg'),
  ('missao', 'Missão cumprida', 'missao', '/selfie/missao.svg'),
  ('brinde', 'Brinde!', 'brinde', '/selfie/brinde.svg'),
  ('squad', 'Squad do rolê', 'grupo', '/selfie/squad.svg'),
  ('coroa', 'Pagou primeiro 👑', 'conquista', '/selfie/coroa.svg');
