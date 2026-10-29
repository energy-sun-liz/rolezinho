// Gerador de avatar em SVG (sem serviços externos)
(function () {
  const OPTIONS = {
    bg: ['#ff2bd6', '#22e4ff', '#ffe14d', '#7c3aed', '#22c55e', '#ff7a18', '#0ea5e9', '#f43f5e'],
    skin: ['#ffe0c7', '#f5c49c', '#d9a066', '#b5774a', '#8d5524', '#5c3a1e'],
    hair: ['none', 'short', 'long', 'curly', 'bun', 'afro', 'mohawk'],
    hairColor: ['#1a1a1a', '#5b3a1e', '#c98b3c', '#f5d77a', '#e2412b', '#ff2bd6', '#22e4ff', '#e5e5e5'],
    eyes: ['dots', 'happy', 'wink', 'stars', 'shades'],
    mouth: ['smile', 'grin', 'open', 'tongue', 'cool'],
    acc: ['none', 'partyhat', 'crown', 'headphones', 'bow', 'glasses'],
  };
  const LABELS = {
    bg: 'Fundo', skin: 'Pele', hair: 'Cabelo', hairColor: 'Cor do cabelo',
    eyes: 'Olhos', mouth: 'Boca', acc: 'Acessório',
  };
  const INK = '#1b1030';
  const DEF = { bg: '#ff2bd6', skin: '#f5c49c', hair: 'short', hairColor: '#1a1a1a', eyes: 'dots', mouth: 'smile', acc: 'partyhat' };

  function hairBack(h, c) {
    if (h === 'long') return `<path d="M21 56 Q20 22 50 22 Q80 22 79 56 L81 90 L19 90 Z" fill="${c}"/>`;
    if (h === 'afro') return `<circle cx="50" cy="46" r="35" fill="${c}"/>`;
    if (h === 'curly') return [[27, 44], [33, 32], [44, 25], [56, 25], [67, 32], [73, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`).join('');
    return '';
  }
  function hairFront(h, c) {
    const fringe = `<path d="M23 54 Q22 26 50 26 Q78 26 77 54 Q72 38 50 37 Q31 37 23 54 Z" fill="${c}"/>`;
    if (h === 'short' || h === 'long') return fringe;
    if (h === 'bun') return `<circle cx="50" cy="20" r="10" fill="${c}"/>` + fringe;
    if (h === 'mohawk') return `<rect x="43" y="10" width="14" height="28" rx="6" fill="${c}"/>`;
    if (h === 'curly') return `<path d="M26 48 Q30 34 50 33 Q70 34 74 48 Q64 40 50 40 Q36 40 26 48Z" fill="${c}"/>`;
    return '';
  }
  function eyes(e) {
    const dot = (x) => `<circle cx="${x}" cy="55" r="3.6" fill="${INK}"/><circle cx="${x + 1.2}" cy="53.8" r="1.1" fill="#fff"/>`;
    const arc = (x) => `<path d="M${x - 5} 57 Q${x} 50 ${x + 5} 57" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    const star = (x) => `<path d="M${x} 49 L${x + 1.9} 53.2 L${x + 6} 53.6 L${x + 2.9} 56.4 L${x + 3.8} 60.6 L${x} 58.4 L${x - 3.8} 60.6 L${x - 2.9} 56.4 L${x - 6} 53.6 L${x - 1.9} 53.2 Z" fill="#ffe14d" stroke="${INK}" stroke-width="1"/>`;
    if (e === 'happy') return arc(40) + arc(60);
    if (e === 'wink') return dot(40) + arc(60);
    if (e === 'stars') return star(40) + star(60);
    if (e === 'shades') return `<rect x="31" y="50" width="16" height="10" rx="4" fill="${INK}"/><rect x="53" y="50" width="16" height="10" rx="4" fill="${INK}"/><path d="M47 54 H53" stroke="${INK}" stroke-width="2.5"/><path d="M34 53 L39 53" stroke="#22e4ff" stroke-width="1.6" stroke-linecap="round"/><path d="M56 53 L61 53" stroke="#ff2bd6" stroke-width="1.6" stroke-linecap="round"/>`;
    return dot(40) + dot(60);
  }
  function mouth(m) {
    if (m === 'grin') return `<path d="M40 65 Q50 79 60 65 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    if (m === 'open') return `<ellipse cx="50" cy="69" rx="5" ry="6" fill="${INK}"/><ellipse cx="50" cy="72" rx="3" ry="2" fill="#ff6b9a"/>`;
    if (m === 'tongue') return `<path d="M40 65 Q50 77 60 65 Z" fill="${INK}"/><ellipse cx="52" cy="71" rx="4" ry="3.5" fill="#ff6b9a"/>`;
    if (m === 'cool') return `<path d="M42 69 Q51 71 58 65" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    return `<path d="M41 66 Q50 75 59 66" stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
  function acc(a, eyesType) {
    if (a === 'partyhat') return `<path d="M38 31 L50 3 L62 31 Z" fill="#22e4ff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M42 22 L56 18 M40 28 L59 24" stroke="#ff2bd6" stroke-width="3"/><circle cx="50" cy="4" r="4.5" fill="#ffe14d" stroke="${INK}" stroke-width="1.6"/>`;
    if (a === 'crown') return `<path d="M31 31 L34 14 L43 24 L50 9 L57 24 L66 14 L69 31 Z" fill="#ffd23f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="25" r="2.6" fill="#ff2bd6"/>`;
    if (a === 'headphones') return `<path d="M22 56 Q21 20 50 20 Q79 20 78 56" stroke="${INK}" stroke-width="5" fill="none"/><rect x="15" y="48" width="11" height="18" rx="5" fill="#ff2bd6" stroke="${INK}" stroke-width="2"/><rect x="74" y="48" width="11" height="18" rx="5" fill="#ff2bd6" stroke="${INK}" stroke-width="2"/>`;
    if (a === 'bow') return `<path d="M64 30 L56 22 L56 38 Z M64 30 L72 22 L72 38 Z" fill="#ff2bd6" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="64" cy="30" r="3" fill="#ffe14d" stroke="${INK}" stroke-width="1.5"/>`;
    if (a === 'glasses' && eyesType !== 'shades') return `<circle cx="40" cy="55" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="60" cy="55" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><path d="M48 55 H52" stroke="${INK}" stroke-width="2.4"/>`;
    return '';
  }

  function svg(avatar, size = 64) {
    const a = { ...DEF, ...(avatar || {}) };
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="100" height="100" rx="50" fill="${a.bg}"/>
      <clipPath id="c${size}"><rect width="100" height="100" rx="50"/></clipPath>
      <g clip-path="url(#c${size})">
        ${hairBack(a.hair, a.hairColor)}
        <path d="M33 80 Q50 74 67 80 L72 100 L28 100 Z" fill="${INK}" opacity=".85"/>
        <circle cx="24" cy="58" r="5" fill="${a.skin}"/><circle cx="76" cy="58" r="5" fill="${a.skin}"/>
        <circle cx="50" cy="56" r="26" fill="${a.skin}"/>
        <circle cx="34" cy="64" r="4" fill="#ff6b9a" opacity=".35"/><circle cx="66" cy="64" r="4" fill="#ff6b9a" opacity=".35"/>
        ${hairFront(a.hair, a.hairColor)}
        ${eyes(a.eyes)}${mouth(a.mouth)}${acc(a.acc, a.eyes)}
      </g></svg>`;
  }

  function random() {
    const pick = (k) => OPTIONS[k][Math.floor(Math.random() * OPTIONS[k].length)];
    return Object.fromEntries(Object.keys(OPTIONS).map((k) => [k, pick(k)]));
  }

  window.Avatar = { OPTIONS, LABELS, svg, random };
})();
