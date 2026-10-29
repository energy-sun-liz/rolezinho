// Regras de dinheiro. Tudo em centavos (inteiros) para não haver erro de arredondamento.

export type Custo = { id: string; valorCentavos: number; opcional: boolean };

/** Quanto o convidado deve: custos obrigatórios + opcionais em que ele entrou. */
export function valorDevido(custos: Custo[], aderiu: Record<string, boolean>): number {
  return custos.reduce((total, c) => {
    if (!Number.isInteger(c.valorCentavos) || c.valorCentavos < 0) {
      throw new Error(`Valor inválido no custo ${c.id}.`);
    }
    return !c.opcional || aderiu[c.id] ? total + c.valorCentavos : total;
  }, 0);
}

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte "120", "120,5", "R$ 1.234,56" em centavos. */
export function reaisParaCentavos(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (!/\d/.test(limpo)) throw new Error('Valor inválido.');
  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor < 0) throw new Error('Valor inválido.');
  return Math.round(valor * 100);
}

// ---------- Tickets de pagamento ----------
//
// PENDENTE --convidado "Já paguei"--> INFORMADO --organizador "Recebi"--> CONFIRMADO
//                                        └--organizador "Não recebi"--> CONTESTADO --convidado--> INFORMADO
// O organizador pode desfazer uma confirmação (CONFIRMADO -> INFORMADO).

export type StatusTicket = 'pendente' | 'informado' | 'confirmado' | 'contestado';
export type Ator = 'convidado' | 'organizador';

const TRANSICOES: Record<Ator, Array<[StatusTicket, StatusTicket]>> = {
  convidado: [
    ['pendente', 'informado'],
    ['contestado', 'informado'],
    ['informado', 'pendente'], // "me enganei, ainda não paguei"
  ],
  organizador: [
    ['informado', 'confirmado'],
    ['informado', 'contestado'],
    ['pendente', 'confirmado'], // recebeu em dinheiro ou por fora
    ['confirmado', 'informado'], // desfazer
  ],
};

export function podeMudar(ator: Ator, de: StatusTicket, para: StatusTicket): boolean {
  return TRANSICOES[ator].some(([a, b]) => a === de && b === para);
}

export function mudarStatus(ator: Ator, de: StatusTicket, para: StatusTicket): StatusTicket {
  if (!podeMudar(ator, de, para)) {
    throw new Error(`O ${ator} não pode mudar o pagamento de "${de}" para "${para}".`);
  }
  return para;
}

export type Ticket = { valorCentavos: number; status: StatusTicket };

/**
 * Situação do convidado a partir dos tickets dele.
 * - pago: confirmado cobre o devido
 * - parcial: confirmou algo, mas falta
 * - aguardando: tem pagamento informado esperando o organizador
 * - pendente: nada pago nem informado
 */
export function situacaoDoConvidado(devido: number, tickets: Ticket[]) {
  const confirmado = tickets.filter((t) => t.status === 'confirmado').reduce((s, t) => s + t.valorCentavos, 0);
  const informado = tickets.filter((t) => t.status === 'informado').reduce((s, t) => s + t.valorCentavos, 0);
  const falta = Math.max(0, devido - confirmado);
  let situacao: 'pago' | 'parcial' | 'aguardando' | 'pendente';
  if (devido > 0 && falta === 0) situacao = 'pago';
  else if (devido === 0) situacao = 'pago';
  else if (informado > 0) situacao = 'aguardando';
  else if (confirmado > 0) situacao = 'parcial';
  else situacao = 'pendente';
  return { devido, confirmado, informado, falta, situacao };
}

/**
 * Valor do próximo ticket a abrir quando o devido muda (ex.: entrou num custo opcional).
 * Desconta o que já foi confirmado ou está aguardando conferência.
 */
export function valorDoNovoTicket(devido: number, tickets: Ticket[]): number {
  const coberto = tickets
    .filter((t) => t.status === 'confirmado' || t.status === 'informado')
    .reduce((s, t) => s + t.valorCentavos, 0);
  return Math.max(0, devido - coberto);
}
