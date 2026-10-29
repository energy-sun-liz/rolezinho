// Ciclo de vida do evento: 45 dias de período ativo, relatório por 4 meses.

export const DIAS_DE_PERIODO = 45;
export const MESES_DE_RELATORIO = 4;
export const MAX_DIAS_PARA_INICIAR = 90;

export type StatusEvento = 'rascunho' | 'agendado' | 'ativo' | 'encerrado' | 'apagado';

/** Datas no formato AAAA-MM-DD (dia civil no Brasil), sem fuso para evitar erro de um dia. */
function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) throw new Error(`Data inválida: ${iso}`);
  return new Date(Date.UTC(a, m - 1, d));
}
function paraIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}
export function somarDias(iso: string, dias: number): string {
  const d = paraData(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return paraIso(d);
}
export function somarMeses(iso: string, meses: number): string {
  const d = paraData(iso);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return paraIso(d);
}

/** Hoje no fuso de Brasília, como AAAA-MM-DD. */
export function hojeNoBrasil(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora);
}

/** 45 dias contando o dia de início: o último dia ativo é início + 44. */
export function calcularPeriodo(inicio: string) {
  const fim = somarDias(inicio, DIAS_DE_PERIODO - 1);
  return { inicio, fim, relatorioAte: somarMeses(fim, MESES_DE_RELATORIO) };
}

/** A data de início escolhida pelo organizador é válida? */
export function validarInicio(inicio: string, dataDaCompra: string): string | null {
  if (inicio < dataDaCompra) return 'A data de início não pode ser antes da compra.';
  if (inicio > somarDias(dataDaCompra, MAX_DIAS_PARA_INICIAR)) {
    return `A data de início precisa ser em até ${MAX_DIAS_PARA_INICIAR} dias depois da compra.`;
  }
  return null;
}

/** A festa precisa acontecer dentro do período de 45 dias. */
export function validarDataDaFesta(festaInicio: string, festaFim: string, periodoInicio: string): string | null {
  const { fim } = calcularPeriodo(periodoInicio);
  if (festaFim < festaInicio) return 'O fim da festa não pode ser antes do começo.';
  if (festaInicio < periodoInicio || festaFim > fim) {
    return `A festa precisa acontecer entre ${periodoInicio} e ${fim}.`;
  }
  return null;
}

/** Status pelas datas (a tarefa diária usa esta mesma regra). */
export function statusPelasDatas(e: { pago: boolean; periodoInicio: string | null }, hoje: string): StatusEvento {
  if (!e.pago) return 'rascunho';
  if (!e.periodoInicio || hoje < e.periodoInicio) return 'agendado';
  const { fim, relatorioAte } = calcularPeriodo(e.periodoInicio);
  if (hoje <= fim) return 'ativo';
  if (hoje <= relatorioAte) return 'encerrado';
  return 'apagado';
}

export function podeEditar(status: StatusEvento): boolean {
  return status === 'rascunho' || status === 'agendado' || status === 'ativo';
}
