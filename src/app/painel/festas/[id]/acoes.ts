'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { validarCusto, validarDadosDaFesta } from '@/lib/festa';
import { mensagemDeErro, organizadorAtual } from '@/lib/organizador';
import { lerPixEstatico, PixInvalido, pixPorDadosDigitados } from '@/lib/pix';

/** `valores`: o que a pessoa digitou, devolvido em caso de erro (o React limpa o formulário após enviar). */
export type Estado = { ok: boolean; mensagem: string; valores?: Record<string, string> };

const idDe = (form: FormData) => String(form.get('evento') ?? '');

function digitado(form: FormData): Record<string, string> {
  const v: Record<string, string> = {};
  form.forEach((valor, chave) => {
    if (typeof valor === 'string' && !chave.startsWith('$')) v[chave] = valor;
  });
  return v;
}

export async function salvarDados(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await organizadorAtual();
  const valores = digitado(form);
  const atual = await supabase.from('events').select('periodo_inicio').eq('id', idDe(form)).maybeSingle();
  if (!atual.data) return { ok: false, mensagem: 'Festa não encontrada.', valores };
  const { erros, dados } = validarDadosDaFesta(form, undefined, atual.data.periodo_inicio);
  if (erros.length) return { ok: false, mensagem: erros.join(' '), valores };
  const { error, data } = await supabase.from('events').update(dados).eq('id', idDe(form)).select('id');
  if (error || !data?.length) return { ok: false, mensagem: mensagemDeErro(error), valores };
  redirect(`/painel/festas/${idDe(form)}/custos`);
}

export async function adicionarCusto(_: Estado, form: FormData): Promise<Estado> {
  const { supabase } = await organizadorAtual();
  const { erro, custo } = validarCusto(form);
  if (erro) return { ok: false, mensagem: erro, valores: digitado(form) };
  const { error } = await supabase.from('costs').insert({ ...custo, event_id: idDe(form) });
  if (error) return { ok: false, mensagem: mensagemDeErro(error), valores: digitado(form) };
  refresh();
  return { ok: true, mensagem: `${custo.nome} adicionado.` };
}

export async function removerCusto(form: FormData): Promise<void> {
  const { supabase } = await organizadorAtual();
  await supabase.from('costs').delete().eq('id', String(form.get('custo') ?? '')).eq('event_id', idDe(form));
  refresh();
}

export async function salvarPix(_: Estado, form: FormData): Promise<Estado> {
  const r = await gravarPix(form);
  return r.ok ? r : { ...r, valores: digitado(form) };
}

async function gravarPix(form: FormData): Promise<Estado> {
  const { supabase } = await organizadorAtual();
  const modo = String(form.get('modo') ?? 'colar');
  let campos: Record<string, string | null>;
  try {
    if (modo === 'colar') {
      const codigo = String(form.get('copia_cola') ?? '').trim();
      if (!codigo) return { ok: false, mensagem: 'Cole o Pix copia e cola.' };
      const dados = lerPixEstatico(codigo);
      if (dados.valor) {
        return { ok: false, mensagem: 'Esse Pix já tem um valor. Gere no app do banco um Pix copia e cola SEM valor.' };
      }
      campos = { pix_copia_cola_base: codigo, pix_chave: dados.chave, pix_nome_recebedor: dados.nome, pix_cidade: dados.cidade };
    } else {
      const chave = String(form.get('chave') ?? '').trim();
      const nome = String(form.get('nome') ?? '').trim();
      const cidade = String(form.get('cidade') ?? '').trim();
      if (!chave || !nome || !cidade) return { ok: false, mensagem: 'Preencha chave, nome e cidade.' };
      // Monta um código de teste para validar os dados e guardar nome/cidade já no formato do Pix.
      const teste = lerPixEstatico(pixPorDadosDigitados(chave, nome, cidade, 100, 'TESTE'));
      campos = { pix_copia_cola_base: null, pix_chave: teste.chave, pix_nome_recebedor: teste.nome, pix_cidade: teste.cidade };
    }
  } catch (e) {
    return { ok: false, mensagem: e instanceof PixInvalido ? e.message : 'Não foi possível ler esse Pix.' };
  }
  const { error, data } = await supabase.from('events').update(campos).eq('id', idDe(form)).select('id');
  if (error || !data?.length) return { ok: false, mensagem: mensagemDeErro(error) };
  refresh();
  return { ok: true, mensagem: `Pix salvo: ${campos.pix_nome_recebedor} · chave ${campos.pix_chave}` };
}

export async function apagarRascunho(form: FormData): Promise<void> {
  const { supabase } = await organizadorAtual();
  await supabase.from('events').delete().eq('id', idDe(form)).eq('status', 'rascunho');
  redirect('/painel');
}
