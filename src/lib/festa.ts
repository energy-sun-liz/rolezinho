// Validação dos dados da festa (assistente "Criar festa"). Funções puras, testadas.
import { reaisParaCentavos } from '@/lib/dinheiro';
import { hojeNoBrasil, validarDataDaFesta } from '@/lib/periodo';

/** "Aniversário da Lizandra!" -> "aniversario-da-lizandra-x7k2" */
export function gerarSlug(titulo: string, sufixo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  return `${base || 'role'}-${sufixo}`;
}

export function sufixoAleatorio(tamanho = 4): string {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

/** Campo datetime-local ("2026-11-20T18:00") no horário de Brasília (sem horário de verão desde 2019). */
export function horaLocalParaIso(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  return `${valor}:00-03:00`;
}

/** ISO do banco -> valor para o campo datetime-local, em Brasília. */
export function isoParaHoraLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export type DadosFesta = {
  titulo: string;
  subtitulo: string;
  local: string;
  festa_inicio: string | null;
  festa_fim: string | null;
  periodo_inicio: string | null;
};

const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max);

/** periodoAtual: data já salva; se não mudou, não exige que seja futura (festa já ativa). */
export function validarDadosDaFesta(form: FormData, hoje = hojeNoBrasil(), periodoAtual: string | null = null): { erros: string[]; dados: DadosFesta } {
  const erros: string[] = [];
  const titulo = texto(form.get('titulo'), 120);
  const subtitulo = texto(form.get('subtitulo'), 160);
  const local = texto(form.get('local'), 160);
  const inicioBruto = texto(form.get('festa_inicio'), 20);
  const fimBruto = texto(form.get('festa_fim'), 20);
  const periodo = texto(form.get('periodo_inicio'), 10) || null;

  if (!titulo) erros.push('Dê um nome para a festa.');
  const festa_inicio = inicioBruto ? horaLocalParaIso(inicioBruto) : null;
  const festa_fim = fimBruto ? horaLocalParaIso(fimBruto) : null;
  if (inicioBruto && !festa_inicio) erros.push('Data de início da festa inválida.');
  if (fimBruto && !festa_fim) erros.push('Data de fim da festa inválida.');
  if (festa_inicio && festa_fim && festa_fim < festa_inicio) erros.push('O fim da festa não pode ser antes do começo.');

  if (periodo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodo)) erros.push('Data de início do período inválida.');
    else if (periodo < hoje && periodo !== periodoAtual) erros.push('O período não pode começar no passado.');
    else if (inicioBruto && fimBruto) {
      const problema = validarDataDaFesta(inicioBruto.slice(0, 10), fimBruto.slice(0, 10), periodo);
      if (problema) erros.push(problema);
    }
  }
  return { erros, dados: { titulo, subtitulo, local, festa_inicio, festa_fim, periodo_inicio: periodo } };
}

export function validarCusto(form: FormData): { erro: string | null; custo: { nome: string; valor_centavos: number; opcional: boolean } } {
  const nome = texto(form.get('nome'), 60);
  const opcional = form.get('opcional') === 'on';
  let valor_centavos = 0;
  let erro: string | null = null;
  try {
    valor_centavos = reaisParaCentavos(texto(form.get('valor'), 20));
  } catch {
    erro = 'Valor inválido. Use, por exemplo, 120 ou 45,50.';
  }
  if (!nome) erro = 'Dê um nome ao custo.';
  else if (!erro && valor_centavos <= 0) erro = 'O valor precisa ser maior que zero.';
  else if (!erro && valor_centavos > 10_000_000) erro = 'Valor alto demais.';
  return { erro, custo: { nome, valor_centavos, opcional } };
}
