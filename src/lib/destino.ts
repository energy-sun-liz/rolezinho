/** Só aceita caminhos internos do painel, para o link de login não virar redirecionamento para outro site. */
export function destinoSeguro(caminho: string | null | undefined): string {
  if (!caminho || !caminho.startsWith('/painel') || caminho.startsWith('//') || caminho.includes('\\')) return '/painel';
  return caminho;
}
