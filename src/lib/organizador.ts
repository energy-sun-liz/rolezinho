// Camada de acesso do Modo Organizador: quem está logado e o cadastro dele.
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { notificar } from '@/lib/notificacoes';
import { supabaseUsuario } from '@/lib/supabase/usuario';

export type Organizador = { id: string; nome: string; email: string };

/**
 * Usuário logado + cadastro de organizador (criado no primeiro acesso). Sem login: vai para /entrar.
 * cache(): cabeçalho e página pedem isso na mesma requisição; roda uma vez só.
 */
export const organizadorAtual = cache(async (): Promise<{ supabase: Awaited<ReturnType<typeof supabaseUsuario>>; organizador: Organizador }> => {
  // Sessão depende do relógio (validade do token): sempre na hora do pedido, nunca pré-gerado.
  await connection();
  const supabase = await supabaseUsuario();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const buscar = () => supabase.from('organizers').select('id, nome, email').eq('auth_user_id', user.id).maybeSingle();
  const existente = await buscar();
  if (existente.data) return { supabase, organizador: existente.data };

  const email = user.email ?? '';
  const nomeInicial = (user.user_metadata?.full_name as string | undefined) ?? email.split('@')[0] ?? 'Organizador';
  const novo = await supabase
    .from('organizers')
    .insert({ auth_user_id: user.id, nome: nomeInicial.slice(0, 80), email })
    .select('id, nome, email')
    .single();
  if (novo.data) {
    await notificar({
      para: { organizerId: novo.data.id },
      tipo: 'boas_vindas',
      titulo: 'Bem-vindo ao Rolêzinho! 🎉',
      corpo: 'Crie sua primeira festa e instale o app na tela de início para receber os avisos.',
      link: '/painel/nova',
    }).catch(() => undefined);
    return { supabase, organizador: novo.data };
  }
  // Duas abas criando ao mesmo tempo: a outra já criou, é só buscar.
  if (novo.error?.code === '23505') {
    const deNovo = await buscar();
    if (deNovo.data) return { supabase, organizador: deNovo.data };
  }
  throw new Error('Não foi possível criar seu cadastro de organizador.');
});

/** Traduz erros do banco (travas e regras) para mensagens para a pessoa. */
export function mensagemDeErro(erro: { message?: string; code?: string } | null | undefined, padrao = 'Não deu certo. Tente de novo.'): string {
  const msg = erro?.message ?? '';
  if (/encerrado/i.test(msg)) return 'Este evento já foi encerrado e não pode mais ser alterado.';
  if (/data de início/i.test(msg)) return msg;
  if (erro?.code === '23505') return 'Já existe um registro igual.';
  if (erro?.code === '23514') return 'Algum dado está fora do formato aceito.';
  return padrao;
}
