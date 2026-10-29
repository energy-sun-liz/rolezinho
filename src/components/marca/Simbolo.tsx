// Símbolo Rolêzinho: pin com coroa grafitada e duas órbitas (do guia de marca).
type Variante = 'claro' | 'escuro' | 'branco' | 'mono';
type Props = { tamanho?: number; variante?: Variante; id?: string; className?: string };

export function Simbolo({ tamanho = 64, variante = 'claro', id = 'rz', className }: Props) {
  const solido = variante === 'branco' ? '#ffffff' : variante === 'mono' ? '#14123a' : null;
  const orbitaInterna = variante === 'escuro' ? '#2f6bff' : '#1e1b5e';
  const pin = solido ?? `url(#${id}-pin)`;
  const coroa = solido ?? `url(#${id}-coroa)`;
  const orbita = solido ?? `url(#${id}-orb)`;
  const interna = solido ?? orbitaInterna;
  const furo = solido ? (variante === 'branco' ? '#ff6a5a' : '#2ef0b5') : '#ffffff';
  const traco = (cor: string) => solido ?? cor;
  return (
    <svg viewBox="0 0 200 200" width={tamanho} height={tamanho} role="img" aria-label="Rolêzinho" className={className}>
      {!solido && (
        <defs>
          <linearGradient id={`${id}-pin`} x1=".2" y1="0" x2=".8" y2="1">
            <stop offset="0" stopColor="#ff1f8e" /><stop offset=".45" stopColor="#ff3d6a" />
            <stop offset=".8" stopColor="#ff7a1f" /><stop offset="1" stopColor="#ffae00" />
          </linearGradient>
          <linearGradient id={`${id}-coroa`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe14a" /><stop offset=".6" stopColor="#ffb800" /><stop offset="1" stopColor="#ff8a00" />
          </linearGradient>
          <linearGradient id={`${id}-orb`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#16d9f5" /><stop offset=".45" stopColor="#1e7bff" />
            <stop offset=".8" stopColor="#5b3dff" /><stop offset="1" stopColor="#b03dff" />
          </linearGradient>
        </defs>
      )}
      <g transform="translate(0 -16) rotate(-16 100 130)">
        <path d="M24 128 A76 20 0 0 1 176 128 A76 13 0 0 0 24 128 Z" fill={orbita} />
        <path d="M40 142 A62 15 0 0 1 164 142 A62 10 0 0 0 40 142 Z" fill={interna} />
      </g>
      <path d="M100 166 C80 138 60 122 60 96 A40 40 0 0 1 140 96 C140 122 120 138 100 166 Z" fill={pin} />
      {!solido && <ellipse cx="86" cy="80" rx="11" ry="16" fill="#ffffff" opacity=".22" transform="rotate(30 86 80)" />}
      <circle cx="100" cy="94" r="15" fill={furo} />
      <g transform="rotate(-9 100 34)" fill="none" stroke={coroa} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M74 54 L68 20 L87 37 L99 10 L112 36 L132 18 L127 54 Z" />
        <path d="M72 46 L128 46" />
      </g>
      <g transform="translate(0 -16) rotate(-16 100 130)">
        <path d="M12 127 A88 32 0 0 0 188 129 A80 19 0 0 1 12 127 Z" fill={orbita} />
        <path d="M28 142 A72 26 0 0 0 174 142 A66 15 0 0 1 28 142 Z" fill={interna} />
      </g>
      <g strokeWidth="7" strokeLinecap="round" fill="none">
        <path d="M26 72 Q36 76 46 86" stroke={traco('#16d9f5')} />
        <path d="M18 110 L40 112" stroke={traco('#ff7a1f')} />
        <path d="M148 48 L164 34" stroke={traco('#ff1f8e')} />
        <path d="M156 80 L178 74" stroke={traco('#ffc400')} />
      </g>
    </svg>
  );
}
