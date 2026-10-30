// Gerador de avatar em SVG. Gera texto SVG para ser usado tanto na página quanto no
// canvas do modo selfie. Coleção "divos pop": perucas icônicas, maquiagem e acessórios de palco.
//
// Segurança: só valores das listas abaixo entram no SVG (normalizarAvatar),
// então nada vindo do usuário vira código na página.

export const OPCOES = {
  bg: ['#ff2d87', '#22b8ff', '#ffc21a', '#8b3dff', '#22c55e', '#ff8a1a', '#0ea5e9', '#1e1b5e'],
  skin: ['#ffe0c7', '#f5c49c', '#d9a066', '#b5774a', '#8d5524', '#5c3a1e'],
  hair: ['none', 'short', 'long', 'curly', 'bun', 'afro', 'mohawk',
    'colmeia', 'topete', 'platinado', 'diva', 'laco', 'chiquinhas', 'coque-duplo', 'chanel'],
  hairColor: ['#1a1a1a', '#5b3a1e', '#c98b3c', '#f5d77a', '#e2412b', '#ff2d87', '#22b8ff', '#e5e5e5',
    '#f4ecd6', '#b49cff', '#39ff14', 'arco-iris'],
  eyes: ['dots', 'happy', 'wink', 'stars', 'shades', 'cilios', 'gatinho'],
  mouth: ['smile', 'grin', 'open', 'tongue', 'cool', 'batom', 'beijinho'],
  acc: ['none', 'partyhat', 'crown', 'headphones', 'bow', 'glasses', 'tiara', 'oculos-coracao', 'oculos-estrela', 'microfone'],
  extra: ['none', 'argolas', 'raio', 'glitter', 'boa', 'pinta', 'pintura-arco-iris'],
} as const;

export type ParteAvatar = keyof typeof OPCOES;
export type Avatar = { [K in ParteAvatar]: (typeof OPCOES)[K][number] };

export const ROTULOS: Record<ParteAvatar, string> = {
  bg: 'Fundo', skin: 'Pele', hair: 'Peruca', hairColor: 'Cor da peruca',
  eyes: 'Olhos', mouth: 'Boca', acc: 'Acessório', extra: 'Brilho',
};

/** Nome de cada opção, para os botões do editor. */
export const NOMES: Record<string, string> = {
  none: 'nenhum', short: 'curto', long: 'longo', curly: 'cacheado', bun: 'coque', afro: 'black power', mohawk: 'moicano',
  colmeia: 'colmeia retrô', topete: 'topete anos 50', platinado: 'cachos platinados', diva: 'diva volumosa',
  laco: 'laço de cabelo', chiquinhas: 'chiquinhas', 'coque-duplo': 'coque duplo', chanel: 'chanel com franja',
  dots: 'normal', happy: 'feliz', wink: 'piscando', stars: 'estrelas', shades: 'óculos escuros', cilios: 'cílios de diva', gatinho: 'delineado gatinho',
  smile: 'sorriso', grin: 'sorrisão', open: 'uau', tongue: 'língua', cool: 'de lado', batom: 'batom vermelho', beijinho: 'beijinho',
  partyhat: 'chapéu de festa', crown: 'coroa', headphones: 'fone', bow: 'laço', glasses: 'óculos',
  tiara: 'tiara de brilhantes', 'oculos-coracao': 'óculos de coração', 'oculos-estrela': 'óculos de estrela', microfone: 'microfone de palco',
  argolas: 'argolas', raio: 'raio glam', glitter: 'glitter', boa: 'boá de plumas', pinta: 'pinta charmosa', 'pintura-arco-iris': 'pintura arco-íris',
  'arco-iris': 'arco-íris',
};

export const AVATAR_PADRAO: Avatar = {
  bg: '#ff2d87', skin: '#f5c49c', hair: 'short', hairColor: '#1a1a1a', eyes: 'dots', mouth: 'smile', acc: 'partyhat', extra: 'none',
};

const INK = '#1e1b5e';
const BATOM = '#e0115f';

export function normalizarAvatar(entrada: unknown): Avatar {
  const obj = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>;
  const saida = { ...AVATAR_PADRAO } as Record<ParteAvatar, string>;
  for (const parte of Object.keys(OPCOES) as ParteAvatar[]) {
    const v = obj[parte];
    if (typeof v === 'string' && (OPCOES[parte] as readonly string[]).includes(v)) saida[parte] = v;
  }
  return saida as Avatar;
}

export function avatarAleatorio(sorteio: () => number = Math.random): Avatar {
  const saida = {} as Record<ParteAvatar, string>;
  for (const parte of Object.keys(OPCOES) as ParteAvatar[]) {
    const lista = OPCOES[parte];
    saida[parte] = lista[Math.floor(sorteio() * lista.length)];
  }
  return saida as Avatar;
}

// Arco-íris: todos os avatares usam o mesmo degradê (mesmo id, mesma definição).
const DEFS_ARCO_IRIS = '<defs><linearGradient id="rz-arco-iris" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2d87"/><stop offset=".25" stop-color="#ff8a1a"/><stop offset=".45" stop-color="#ffc21a"/><stop offset=".65" stop-color="#22c55e"/><stop offset=".82" stop-color="#22b8ff"/><stop offset="1" stop-color="#8b3dff"/></linearGradient></defs>';

function cabeloAtras(h: string, c: string): string {
  switch (h) {
    case 'long': return `<path d="M21 56 Q20 22 50 22 Q80 22 79 56 L81 90 L19 90 Z" fill="${c}"/>`;
    case 'afro': return `<circle cx="50" cy="46" r="35" fill="${c}"/>`;
    case 'curly': return [[27, 44], [33, 32], [44, 25], [56, 25], [67, 32], [73, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join('');
    case 'colmeia': return `<ellipse cx="50" cy="24" rx="25" ry="24" fill="${c}"/><path d="M22 60 Q18 34 50 32 Q82 34 78 60 Z" fill="${c}"/>`;
    case 'platinado': return [[22, 54], [24, 40], [32, 28], [44, 22], [56, 22], [68, 28], [76, 40], [78, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/>`).join('');
    case 'diva': return `<path d="M10 62 Q4 12 50 8 Q96 12 90 62 Q94 88 76 96 L24 96 Q6 88 10 62 Z" fill="${c}"/>`;
    case 'chiquinhas': return `<circle cx="16" cy="44" r="12" fill="${c}"/><circle cx="84" cy="44" r="12" fill="${c}"/><circle cx="13" cy="58" r="8" fill="${c}"/><circle cx="87" cy="58" r="8" fill="${c}"/>`;
    case 'chanel': return `<path d="M20 68 Q17 26 50 24 Q83 26 80 68 L74 72 L26 72 Z" fill="${c}"/>`;
    default: return '';
  }
}

function cabeloFrente(h: string, c: string): string {
  const franja = `<path d="M23 54 Q22 26 50 26 Q78 26 77 54 Q72 38 50 37 Q31 37 23 54 Z" fill="${c}"/>`;
  switch (h) {
    case 'short': case 'long': return franja;
    case 'bun': return `<circle cx="50" cy="20" r="10" fill="${c}"/>` + franja;
    case 'mohawk': return `<rect x="43" y="10" width="14" height="28" rx="6" fill="${c}"/>`;
    case 'curly': return `<path d="M26 48 Q30 34 50 33 Q70 34 74 48 Q64 40 50 40 Q36 40 26 48Z" fill="${c}"/>`;
    case 'colmeia': return `<path d="M24 50 Q26 30 50 30 Q70 30 76 46 Q60 36 42 41 Q31 44 24 50 Z" fill="${c}"/>`;
    case 'topete': return `<path d="M24 50 Q20 16 54 12 Q84 12 78 44 Q74 30 58 32 Q42 28 32 40 Q27 44 24 50 Z" fill="${c}"/><path d="M40 20 Q54 12 68 20" stroke="rgba(255,255,255,.35)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    case 'platinado': return `<path d="M26 46 Q30 30 50 30 Q70 30 74 46 Q64 38 54 42 Q50 34 42 40 Q34 38 26 46 Z" fill="${c}"/><circle cx="36" cy="34" r="7" fill="${c}"/><circle cx="62" cy="33" r="7" fill="${c}"/>`;
    case 'diva': return `<path d="M22 54 Q22 24 52 24 Q78 26 79 50 Q66 32 46 38 Q30 44 22 54 Z" fill="${c}"/>`;
    case 'laco': return franja + `<path d="M50 20 L30 8 L28 32 Z M50 20 L70 8 L72 32 Z" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="1"/><circle cx="50" cy="20" r="6" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="1"/>`;
    case 'chiquinhas': return franja + `<circle cx="27" cy="34" r="3" fill="${BATOM}"/><circle cx="73" cy="34" r="3" fill="${BATOM}"/>`;
    case 'coque-duplo': return `<circle cx="30" cy="22" r="11" fill="${c}"/><circle cx="70" cy="22" r="11" fill="${c}"/>` + franja;
    case 'chanel': return `<path d="M26 47 L26 34 Q50 24 74 34 L74 47 Q50 41 26 47 Z" fill="${c}"/>`;
    default: return '';
  }
}

function olhos(e: string): string {
  const ponto = (x: number) => `<circle cx="${x}" cy="55" r="3.6" fill="${INK}"/><circle cx="${x + 1.2}" cy="53.8" r="1.1" fill="#fff"/>`;
  const arco = (x: number) => `<path d="M${x - 5} 57 Q${x} 50 ${x + 5} 57" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  const estrela = (x: number) => `<path d="M${x} 49 L${x + 1.9} 53.2 L${x + 6} 53.6 L${x + 2.9} 56.4 L${x + 3.8} 60.6 L${x} 58.4 L${x - 3.8} 60.6 L${x - 2.9} 56.4 L${x - 6} 53.6 L${x - 1.9} 53.2 Z" fill="#ffc21a" stroke="${INK}" stroke-width="1"/>`;
  const cilios = (x: number) => ponto(x) + `<path d="M${x - 4} 51.5 l-2 -3 M${x} 50.5 l0 -3.4 M${x + 4} 51.5 l2 -3" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M${x - 5} 52 Q${x} 48.5 ${x + 5} 52" stroke="${INK}" stroke-width="1.8" fill="none"/>`;
  const gatinho = (x: number, lado: 1 | -1) => ponto(x) + `<path d="M${x - 5 * lado} 54 Q${x} 50 ${x + 5 * lado} 52.5 L${x + 8.5 * lado} 49.5" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (e) {
    case 'happy': return arco(40) + arco(60);
    case 'wink': return ponto(40) + arco(60);
    case 'stars': return estrela(40) + estrela(60);
    case 'shades': return `<rect x="31" y="50" width="16" height="10" rx="4" fill="${INK}"/><rect x="53" y="50" width="16" height="10" rx="4" fill="${INK}"/><path d="M47 54 H53" stroke="${INK}" stroke-width="2.5"/><path d="M34 53 L39 53" stroke="#22b8ff" stroke-width="1.6" stroke-linecap="round"/><path d="M56 53 L61 53" stroke="#ff2d87" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'cilios': return cilios(40) + cilios(60);
    case 'gatinho': return gatinho(40, -1) + gatinho(60, 1);
    default: return ponto(40) + ponto(60);
  }
}

function boca(m: string): string {
  switch (m) {
    case 'grin': return `<path d="M40 65 Q50 79 60 65 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    case 'open': return `<ellipse cx="50" cy="69" rx="5" ry="6" fill="${INK}"/><ellipse cx="50" cy="72" rx="3" ry="2" fill="#ff6b9a"/>`;
    case 'tongue': return `<path d="M40 65 Q50 77 60 65 Z" fill="${INK}"/><ellipse cx="52" cy="71" rx="4" ry="3.5" fill="#ff6b9a"/>`;
    case 'cool': return `<path d="M42 69 Q51 71 58 65" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    case 'batom': return `<path d="M41 66 Q45 63 50 65.5 Q55 63 59 66 Q55 73 50 73 Q45 73 41 66 Z" fill="${BATOM}"/><path d="M42 66.5 Q50 69 58 66.5" stroke="#9d0b43" stroke-width="1.2" fill="none"/>`;
    case 'beijinho': return `<path d="M46 66 Q48 63.5 50 65.5 Q52 63.5 54 66 Q52 71 50 71 Q48 71 46 66 Z" fill="${BATOM}"/><path d="M64 60 q2 -3 4 0 q2 -3 4 0 q0 3 -4 6 q-4 -3 -4 -6 Z" fill="${BATOM}" opacity=".85"/>`;
    default: return `<path d="M41 66 Q50 75 59 66" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
}

function acessorio(a: string, tipoOlhos: string): string {
  const coracao = (x: number) => `<path d="M${x} 61 L${x - 8} 53 Q${x - 11} 48 ${x - 6} 46.5 Q${x - 2} 46 ${x} 50 Q${x + 2} 46 ${x + 6} 46.5 Q${x + 11} 48 ${x + 8} 53 Z" fill="#ff2d87" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const estrelaOculos = (x: number) => `<path d="M${x} 45 L${x + 3} 51.5 L${x + 10} 52 L${x + 4.8} 56.5 L${x + 6.4} 63 L${x} 59.5 L${x - 6.4} 63 L${x - 4.8} 56.5 L${x - 10} 52 L${x - 3} 51.5 Z" fill="#ffc21a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  switch (a) {
    case 'partyhat': return `<path d="M38 31 L50 3 L62 31 Z" fill="#22b8ff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M42 22 L56 18 M40 28 L59 24" stroke="#ff2d87" stroke-width="3"/><circle cx="50" cy="4" r="4.5" fill="#ffc21a" stroke="${INK}" stroke-width="1.6"/>`;
    case 'crown': return `<path d="M31 31 L34 14 L43 24 L50 9 L57 24 L66 14 L69 31 Z" fill="#ffc21a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="25" r="2.6" fill="#ff2d87"/>`;
    case 'headphones': return `<path d="M22 56 Q21 20 50 20 Q79 20 78 56" stroke="${INK}" stroke-width="5" fill="none"/><rect x="15" y="48" width="11" height="18" rx="5" fill="#ff2d87" stroke="${INK}" stroke-width="2"/><rect x="74" y="48" width="11" height="18" rx="5" fill="#ff2d87" stroke="${INK}" stroke-width="2"/>`;
    case 'bow': return `<path d="M64 30 L56 22 L56 38 Z M64 30 L72 22 L72 38 Z" fill="#ff2d87" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="64" cy="30" r="3" fill="#ffc21a" stroke="${INK}" stroke-width="1.5"/>`;
    case 'glasses': return tipoOlhos === 'shades' ? '' : `<circle cx="40" cy="55" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="60" cy="55" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="M48 55 H52" stroke="${INK}" stroke-width="2.4"/>`;
    case 'tiara': return `<path d="M30 33 Q50 22 70 33" stroke="#c9d6e8" stroke-width="3" fill="none"/><path d="M36 30 L39 21 L42 29 M47 26 L50 14 L53 26 M58 29 L61 21 L64 30" fill="#e8f4ff" stroke="#9fb4d0" stroke-width="1.5" stroke-linejoin="round"/><circle cx="50" cy="19" r="3" fill="#22b8ff"/><circle cx="39" cy="24" r="2" fill="#ff2d87"/><circle cx="61" cy="24" r="2" fill="#ff2d87"/>`;
    case 'oculos-coracao': return coracao(40) + coracao(60) + `<path d="M47.5 52 H52.5" stroke="${INK}" stroke-width="2"/>`;
    case 'oculos-estrela': return estrelaOculos(39) + estrelaOculos(61) + `<path d="M48.5 53 H51.5" stroke="${INK}" stroke-width="2"/>`;
    case 'microfone': return `<path d="M76 58 Q74 70 58 71" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="57" cy="71" r="3.2" fill="#1a1a1a"/><rect x="73" y="52" width="7" height="11" rx="3" fill="#1a1a1a"/>`;
    default: return '';
  }
}

function brilho(x: string): string {
  const estrelinha = (cx: number, cy: number, r: number, cor: string) => `<path d="M${cx} ${cy - r} L${cx + r * .3} ${cy - r * .3} L${cx + r} ${cy} L${cx + r * .3} ${cy + r * .3} L${cx} ${cy + r} L${cx - r * .3} ${cy + r * .3} L${cx - r} ${cy} L${cx - r * .3} ${cy - r * .3} Z" fill="${cor}"/>`;
  switch (x) {
    case 'argolas': return `<circle cx="24" cy="68" r="6" fill="none" stroke="#ffc21a" stroke-width="2.4"/><circle cx="76" cy="68" r="6" fill="none" stroke="#ffc21a" stroke-width="2.4"/>`;
    case 'raio': return `<path d="M58 40 L52 52 L58 52 L48 70 L52 56 L46 56 L52 40 Z" fill="#e2412b" stroke="#22b8ff" stroke-width="1.4" stroke-linejoin="round" opacity=".9"/>`;
    case 'glitter': return estrelinha(32, 63, 3.2, '#ffc21a') + estrelinha(68, 63, 3.2, '#ffc21a') + estrelinha(28, 58, 1.8, '#fff') + estrelinha(72, 58, 1.8, '#fff') + estrelinha(35, 68, 1.6, '#ff2d87') + estrelinha(65, 68, 1.6, '#22b8ff');
    case 'boa': return [[22, 86], [30, 82], [38, 84], [46, 81], [54, 81], [62, 84], [70, 82], [78, 86]].map(([cx, cy], i) => `<circle cx="${cx}" cy="${cy}" r="7" fill="${i % 2 ? '#ff6bb3' : '#ff2d87'}"/>`).join('');
    case 'pintura-arco-iris': return ['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982'].map((cor, i) => `<rect x="${63 + i * 1.6}" y="${59 + i * 1.6}" width="9" height="1.8" rx=".9" fill="${cor}" transform="rotate(-28 67 62)"/>`).join('');
    case 'pinta': return `<circle cx="63" cy="66" r="1.6" fill="${INK}"/>`;
    default: return '';
  }
}

/** SVG quadrado 100x100. O recorte redondo é feito por quem exibe (CSS ou canvas). */
export function avatarSvg(entrada: unknown, tamanho = 64): string {
  const a = normalizarAvatar(entrada);
  const cor = a.hairColor === 'arco-iris' ? 'url(#rz-arco-iris)' : a.hairColor;
  return `<svg viewBox="0 0 100 100" width="${tamanho}" height="${tamanho}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    (a.hairColor === 'arco-iris' ? DEFS_ARCO_IRIS : '') +
    `<rect width="100" height="100" fill="${a.bg}"/>` +
    cabeloAtras(a.hair, cor) +
    `<path d="M33 80 Q50 74 67 80 L72 100 L28 100 Z" fill="${INK}" opacity=".85"/>` +
    `<circle cx="24" cy="58" r="5" fill="${a.skin}"/><circle cx="76" cy="58" r="5" fill="${a.skin}"/>` +
    `<circle cx="50" cy="56" r="26" fill="${a.skin}"/>` +
    `<circle cx="34" cy="64" r="4" fill="#ff6b9a" opacity=".35"/><circle cx="66" cy="64" r="4" fill="#ff6b9a" opacity=".35"/>` +
    cabeloFrente(a.hair, cor) + olhos(a.eyes) + boca(a.mouth) + brilho(a.extra) + acessorio(a.acc, a.eyes) +
    `</svg>`;
}
