// Temas visuais da festa (a página que os convidados veem). O painel do organizador
// continua com a marca Rolêzinho; o tema muda a festa.

export type IdTema = 'rolezinho' | 'neon' | 'pastel' | 'dourado' | 'arcade';

export type Tema = {
  id: IdTema;
  nome: string;
  descricao: string;
  /** fundo, cartão, texto, destaque 1, destaque 2 */
  cores: { fundo: string; cartao: string; texto: string; destaque: string; destaque2: string };
  fonteTitulo: string;
};

export const TEMAS: Tema[] = [
  { id: 'rolezinho', nome: 'Rolêzinho', descricao: 'As cores da marca: rosa, laranja e amarelo.', fonteTitulo: 'Kaushan Script',
    cores: { fundo: '#14123a', cartao: '#1d1a4f', texto: '#ffffff', destaque: '#ff2d87', destaque2: '#ffc21a' } },
  { id: 'neon', nome: 'Neon', descricao: 'Balada: roxo escuro com rosa e ciano brilhando.', fonteTitulo: 'Bungee',
    cores: { fundo: '#0a0518', cartao: '#1a0d33', texto: '#f5f0ff', destaque: '#ff2bd6', destaque2: '#22e4ff' } },
  { id: 'pastel', nome: 'Pastel', descricao: 'Leve e fofo: lilás, menta e pêssego.', fonteTitulo: 'Fredoka',
    cores: { fundo: '#fdf6ff', cartao: '#ffffff', texto: '#4a3b5c', destaque: '#c38dff', destaque2: '#7fdcc0' } },
  { id: 'dourado', nome: 'Dourado', descricao: 'Chique: preto com dourado, para festas de gala.', fonteTitulo: 'Playfair Display',
    cores: { fundo: '#0f0d0a', cartao: '#1c1812', texto: '#f6efe0', destaque: '#d4af37', destaque2: '#f3d98b' } },
  { id: 'arcade', nome: 'Arcade', descricao: 'Videogame anos 80: pixels e cores primárias.', fonteTitulo: 'Press Start 2P',
    cores: { fundo: '#0b1020', cartao: '#151d38', texto: '#e8f1ff', destaque: '#39ff14', destaque2: '#ff3864' } },
];

export const temaPorId = (id: string | null | undefined): Tema => TEMAS.find((t) => t.id === id) ?? TEMAS[0];

// Mesma regra do banco (migração corrige_link_local). O domínio do Google precisa terminar
// logo após a extensão do país, senão "google.com.golpe.io" passaria.
const MAPAS = /^https:\/\/((www\.)?google\.(com|[a-z]{2})(\.[a-z]{2})?\/maps|maps\.google\.(com|[a-z]{2})(\.[a-z]{2})?|maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?waze\.com|maps\.apple\.com|maps\.apple)(\/|\?|$)/;

/** Link da localização: só Google Maps, Waze ou Apple Mapas (mesma regra do banco). */
export function validarLinkLocal(bruto: string): { link: string | null; erro: string | null } {
  const link = bruto.trim();
  if (!link) return { link: null, erro: null };
  if (link.length > 500) return { link: null, erro: 'Link da localização longo demais.' };
  if (!MAPAS.test(link)) {
    return { link: null, erro: 'Use um link do Google Maps, Waze ou Apple Mapas (no app de mapas: Compartilhar → Copiar link).' };
  }
  return { link, erro: null };
}
