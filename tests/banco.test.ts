// Testa o esquema e as regras de segurança (RLS) num Postgres embutido (PGlite).
// Recria o mínimo do Supabase: papéis anon/authenticated/service_role e auth.uid().
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const SHIM_SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

let db: PGlite;

/** Executa como um papel do Supabase; volta para o superusuário no fim. */
async function como<T>(papel: 'anon' | 'authenticated' | 'service_role', usuario: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set request.jwt.claim.sub = '${usuario ?? ''}'; set role ${papel};`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}
const q = (sql: string, params: unknown[] = []) => db.query<Record<string, unknown>>(sql, params);

let eventoA: string, eventoB: string, convidadoA: string, ticketA: string, tipoAniv: string;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SHIM_SUPABASE);
  const pasta = join(__dirname, '..', 'supabase', 'migrations');
  for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(pasta, arquivo), 'utf8'));
  }
  // No Supabase isso vem pronto: o service_role pode tudo.
  await db.exec(`grant all on all tables in schema public to service_role;`);

  await q(`insert into auth.users (id) values ($1), ($2)`, [A, B]);
  tipoAniv = (await q(`select id from event_types where slug = 'aniversario'`)).rows[0].id as string;

  for (const [user, nome] of [[A, 'Ana'], [B, 'Beto']]) {
    await como('authenticated', user, () => q(`insert into organizers (auth_user_id, nome, email) values ($1, $2, $3)`, [user, nome, `${nome}@x.com`]));
  }
  eventoA = (await como('authenticated', A, () =>
    q(`insert into events (organizer_id, event_type_id, slug, titulo) values (meu_organizer_id(), $1, 'festa-da-ana', 'Festa da Ana') returning id`, [tipoAniv])
  )).rows[0].id as string;
  eventoB = (await como('authenticated', B, () =>
    q(`insert into events (organizer_id, event_type_id, slug, titulo) values (meu_organizer_id(), $1, 'festa-do-beto', 'Festa do Beto') returning id`, [tipoAniv])
  )).rows[0].id as string;
  convidadoA = (await como('authenticated', A, () =>
    q(`insert into guests (event_id, nome, codigo) values ($1, 'Carla', 'K7PX2M') returning id`, [eventoA])
  )).rows[0].id as string;
  // Ticket é criado pelo servidor (service_role)
  ticketA = (await como('service_role', null, () =>
    q(`insert into payment_tickets (event_id, guest_id, valor_centavos, referencia) values ($1, $2, 12000, 'ROLEK7PX2M') returning id`, [eventoA, convidadoA])
  )).rows[0].id as string;
});

describe('RLS: cada um no seu quadrado', () => {
  it('todas as tabelas do app têm RLS ligado', async () => {
    const r = await q(`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(r.rows).toEqual([]);
  });

  it('visitante anônimo não lê nada', async () => {
    await expect(como('anon', null, () => q(`select * from events`))).rejects.toThrow(/permission denied/);
    await expect(como('anon', null, () => q(`select * from guests`))).rejects.toThrow(/permission denied/);
    await expect(como('anon', null, () => q(`select * from event_types`))).rejects.toThrow(/permission denied/);
  });

  it('organizador só vê os próprios eventos e convidados', async () => {
    const eventos = await como('authenticated', B, () => q(`select slug from events`));
    expect(eventos.rows.map((r) => r.slug)).toEqual(['festa-do-beto']);
    const convidados = await como('authenticated', B, () => q(`select * from guests`));
    expect(convidados.rows).toEqual([]);
  });

  it('organizador não cria convidado no evento de outro', async () => {
    await expect(como('authenticated', B, () =>
      q(`insert into guests (event_id, nome, codigo) values ($1, 'Intruso', 'ABCDEF')`, [eventoA])
    )).rejects.toThrow(/row-level security/);
  });

  it('organizador não cria evento já pago nem em nome de outro', async () => {
    await expect(como('authenticated', A, () =>
      q(`insert into events (organizer_id, event_type_id, slug, titulo, status) values (meu_organizer_id(), $1, 'pulando-pagamento', 'X', 'ativo')`, [tipoAniv])
    )).rejects.toThrow(/row-level security/);
  });

  it('organizador não muda o status do evento sozinho (ex.: dizer que pagou)', async () => {
    await expect(como('authenticated', A, () => q(`update events set status = 'ativo' where id = $1`, [eventoA])))
      .rejects.toThrow(/só mudam pelo sistema/);
  });

  it('código de convidado precisa ser do formato seguro', async () => {
    await expect(como('authenticated', A, () =>
      q(`insert into guests (event_id, nome, codigo) values ($1, 'X', 'abc')`, [eventoA])
    )).rejects.toThrow(/check constraint/);
  });
});

describe('tickets de pagamento', () => {
  it('organizador não cria nem apaga ticket', async () => {
    await expect(como('authenticated', A, () =>
      q(`insert into payment_tickets (event_id, guest_id, valor_centavos, referencia) values ($1, $2, 100, 'X')`, [eventoA, convidadoA])
    )).rejects.toThrow(/permission denied/);
  });

  it('organizador não marca "informado" no lugar do convidado', async () => {
    await expect(como('authenticated', A, () => q(`update payment_tickets set status = 'informado' where id = $1`, [ticketA])))
      .rejects.toThrow(/não pode mudar/);
  });

  it('fluxo completo: convidado informa, organizador confirma', async () => {
    await como('service_role', null, () => q(`update payment_tickets set status = 'informado' where id = $1`, [ticketA]));
    await como('authenticated', A, () => q(`update payment_tickets set status = 'confirmado' where id = $1`, [ticketA]));
    const t = (await q(`select status, informado_em, confirmado_em from payment_tickets where id = $1`, [ticketA])).rows[0];
    expect(t.status).toBe('confirmado');
    expect(t.informado_em).not.toBeNull();
    expect(t.confirmado_em).not.toBeNull();
  });

  it('outro organizador não confirma ticket que não é dele', async () => {
    const r = await como('authenticated', B, () => q(`update payment_tickets set status = 'informado' where id = $1 returning id`, [ticketA]));
    expect(r.rows).toEqual([]); // RLS: nem enxerga a linha
  });

  it('valor só muda enquanto está pendente', async () => {
    await expect(como('service_role', null, () => q(`update payment_tickets set valor_centavos = 1 where id = $1`, [ticketA])))
      .rejects.toThrow(/pendente/);
  });
});

describe('período e encerramento', () => {
  it('calcula fim (45 dias) e relatório (4 meses)', async () => {
    await como('authenticated', A, () => q(`update events set periodo_inicio = '2026-11-01' where id = $1`, [eventoA]));
    const e = (await q(`select periodo_fim::text, relatorio_ate::text from events where id = $1`, [eventoA])).rows[0];
    expect(e).toEqual({ periodo_fim: '2026-12-15', relatorio_ate: '2027-04-15' });
  });

  it('evento encerrado não aceita mudanças do organizador', async () => {
    await como('service_role', null, () => q(`update events set status = 'encerrado' where id = $1`, [eventoA]));
    await expect(como('authenticated', A, () => q(`update events set titulo = 'Mudei' where id = $1`, [eventoA])))
      .rejects.toThrow(/encerrado/);
    await expect(como('authenticated', A, () =>
      q(`insert into guests (event_id, nome, codigo) values ($1, 'Atrasado', 'QWERTZ')`, [eventoA])
    )).rejects.toThrow(/encerrado/);
    await expect(como('authenticated', A, () => q(`delete from guests where id = $1`, [convidadoA])))
      .rejects.toThrow(/encerrado/);
  });

  it('organizador ainda lê o relatório do evento encerrado', async () => {
    const r = await como('authenticated', A, () => q(`select count(*)::int as n from payment_tickets where event_id = $1`, [eventoA]));
    expect(r.rows[0].n).toBe(1);
  });

  it('o sistema consegue apagar os dados depois do prazo', async () => {
    await como('service_role', null, () => q(`delete from events where id = $1`, [eventoA]));
    const r = await q(`select count(*)::int as n from guests where event_id = $1`, [eventoA]);
    expect(r.rows[0].n).toBe(0);
  });

  it('organizador só apaga evento em rascunho', async () => {
    await como('service_role', null, () => q(`update events set status = 'agendado' where id = $1`, [eventoB]));
    const r = await como('authenticated', B, () => q(`delete from events where id = $1 returning id`, [eventoB]));
    expect(r.rows).toEqual([]);
  });
});
