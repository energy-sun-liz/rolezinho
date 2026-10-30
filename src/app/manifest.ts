import type { MetadataRoute } from 'next';

// Faz o Rolêzinho poder ser instalado na tela de início como um aplicativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Rolêzinho',
    short_name: 'Rolêzinho',
    description: 'Seu rolê, sem complicação. Organize a festa, divida os custos e receba no Pix.',
    lang: 'pt-BR',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#14123a',
    theme_color: '#14123a',
    categories: ['lifestyle', 'social', 'productivity'],
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Minhas festas', url: '/painel', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
      { name: 'Criar festa', url: '/painel/nova', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
      { name: 'Notificações', url: '/painel/notificacoes', icons: [{ src: '/icones/icone-192.png', sizes: '192x192' }] },
    ],
  };
}
