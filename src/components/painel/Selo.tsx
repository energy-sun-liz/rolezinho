import type { StatusEvento } from '@/lib/periodo';

const ESTILO: Record<StatusEvento, { texto: string; classe: string }> = {
  rascunho: { texto: 'Rascunho', classe: 'bg-borda text-anil' },
  agendado: { texto: 'Agendado', classe: 'bg-azul/15 text-sky-800' },
  ativo: { texto: 'Ativo', classe: 'bg-menta/30 text-emerald-800' },
  encerrado: { texto: 'Encerrado', classe: 'bg-amarelo/30 text-amber-800' },
  apagado: { texto: 'Apagado', classe: 'bg-anil/10 text-anil/60' },
};

export function SeloStatus({ status }: { status: StatusEvento }) {
  const { texto, classe } = ESTILO[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${classe}`}>{texto}</span>;
}
