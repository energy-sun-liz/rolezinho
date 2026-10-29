import type { Metadata, Viewport } from 'next';
import { Kaushan_Script, Outfit } from 'next/font/google';
import './globals.css';

const pincel = Kaushan_Script({ variable: '--font-pincel', subsets: ['latin', 'latin-ext'], weight: '400' });
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: { default: 'Rolêzinho — seu rolê, sem complicação', template: '%s · Rolêzinho' },
  description: 'Organize o rolê, divida os custos e receba no Pix sem constrangimento. Convidado entra pelo link, sem baixar app.',
};

export const viewport: Viewport = { themeColor: '#14123a' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${pincel.variable} ${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
