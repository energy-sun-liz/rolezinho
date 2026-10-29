import { Simbolo } from './Simbolo';

type Props = { tema?: 'claro' | 'escuro'; tamanho?: 'p' | 'g'; comSimbolo?: boolean; id?: string };

const GRADIENTE = {
  claro: 'linear-gradient(90deg,#1b1872 0%,#2a1d8f 28%,#8a2cff 44%,#ff1f8e 60%,#ff6a1f 80%,#ffc400 100%)',
  escuro: 'linear-gradient(90deg,#ffffff 0%,#ffffff 36%,#b06bff 46%,#ff2d95 60%,#ff7a1f 80%,#ffc400 100%)',
};

/** Nome "Rolêzinho" em letra de pincel com degradê + traço por baixo. */
export function Logo({ tema = 'claro', tamanho = 'g', comSimbolo = true, id = 'logo' }: Props) {
  const grande = tamanho === 'g';
  return (
    <div className={`flex items-center ${grande ? 'flex-col gap-1' : 'flex-row gap-2'}`}>
      {comSimbolo && <Simbolo tamanho={grande ? 150 : 40} variante={tema} id={`${id}-s`} />}
      <div className="flex flex-col items-center">
        <span
          className={`font-pincel whitespace-nowrap bg-clip-text px-[0.15em] text-transparent ${grande ? 'text-6xl sm:text-8xl' : 'text-3xl'}`}
          style={{ backgroundImage: GRADIENTE[tema], lineHeight: 1.2 }}
        >
          Rolêzinho
        </span>
        {grande && (
          <svg viewBox="0 0 400 30" className="-mt-3 h-5 w-64 sm:w-80" aria-hidden="true">
            <defs>
              <linearGradient id={`${id}-traco`} x1="0" x2="1">
                <stop offset="0" stopColor="#ff1f8e" /><stop offset=".6" stopColor="#ff6a1f" /><stop offset="1" stopColor="#ffc400" />
              </linearGradient>
            </defs>
            <path d="M30 24 Q200 4 380 8" stroke={`url(#${id}-traco)`} strokeWidth="11" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
