import { avatarSvg } from '@/lib/avatar';

type Props = { avatar: unknown; tamanho?: number; titulo?: string; className?: string };

/** Avatar redondo. O SVG só contém valores das listas de OPCOES (ver normalizarAvatar). */
export function AvatarRolezinho({ avatar, tamanho = 64, titulo, className = '' }: Props) {
  return (
    <span
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      className={`inline-block shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: tamanho, height: tamanho }}
      dangerouslySetInnerHTML={{ __html: avatarSvg(avatar, tamanho) }}
    />
  );
}
