import Link from 'next/link';

const PASSOS = [
  { chave: 'dados', rotulo: 'Dados e datas', caminho: 'dados' },
  { chave: 'custos', rotulo: 'Custos e Pix', caminho: 'custos' },
  { chave: 'resumo', rotulo: 'Resumo', caminho: '' },
] as const;

export function Passos({ id, atual }: { id: string; atual: (typeof PASSOS)[number]['chave'] }) {
  return (
    <nav aria-label="Passos da festa" className="flex gap-1.5 overflow-x-auto sm:gap-2">
      {PASSOS.map((p, i) => {
        const ativo = p.chave === atual;
        return (
          <Link
            key={p.chave}
            href={`/painel/festas/${id}${p.caminho ? `/${p.caminho}` : ''}`}
            aria-current={ativo ? 'step' : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${ativo ? 'bg-anil text-white' : 'bg-white text-anil/70 hover:text-anil'}`}
          >
            {i + 1}. {p.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function Cabecalho({ titulo, voltar = true }: { titulo: string; voltar?: boolean }) {
  return (
    <div>
      {voltar && <Link href="/painel" className="text-sm text-anil/70 hover:text-rosa">← Minhas festas</Link>}
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{titulo}</h1>
    </div>
  );
}
