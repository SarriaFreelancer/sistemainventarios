import './globals.css';
import './layout.css';

import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Inter, Hanken_Grotesk } from 'next/font/google';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientSecurityShield } from "@/components/security/client-security-shield";
import { CookieConsentBanner } from "@/components/security/cookie-consent-banner";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

import { getAuthSession } from '@/auth';

export const metadata: Metadata = {
  title: {
    default: 'GNS | Gestión de Negocios SarriaTech',
    template: '%s | GNS'
  },
  description: 'Sistema integral ERP SaaS en la nube para control de inventario, punto de venta (POS), recursos humanos, contabilidad y facturación. Gestión de Negocios SarriaTech.',
  keywords: ['ERP', 'SaaS', 'Inventario', 'Punto de Venta', 'POS', 'Contabilidad', 'Facturación', 'Recursos Humanos', 'SarriaTech', 'Gestión de Negocios'],
  authors: [{ name: 'SarriaTech', url: 'https://sarriatech.com' }],
  creator: 'SarriaTech',
  publisher: 'SarriaTech',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://gns.sarriatech.com', // Replace with actual production URL
    siteName: 'Gestión de Negocios SarriaTech (GNS)',
    title: 'GNS | Gestión de Negocios SarriaTech',
    description: 'Sistema integral ERP SaaS en la nube para control de inventario, POS, finanzas y más.',
    images: [
      {
        url: '/gns-logo.png', // Ideally a wider OG image (1200x630)
        width: 800,
        height: 600,
        alt: 'GNS Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GNS | Gestión de Negocios SarriaTech',
    description: 'Sistema integral ERP SaaS en la nube para control de inventario, POS, finanzas y más.',
    creator: '@sarriatech',
    images: ['/gns-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/gns-logo.png',
    shortcut: '/gns-logo.png',
    apple: '/gns-logo.png',
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAuthSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const serverCookieConsent = (session?.user as any)?.cookieConsent === true;

  return (
    <html lang="es" suppressHydrationWarning className={cn("font-sans", inter.variable, hanken.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ClientSecurityShield />
          {children}
          <CookieConsentBanner serverConsent={serverCookieConsent} userId={userId} />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

