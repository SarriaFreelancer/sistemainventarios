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

export const metadata: Metadata = {
  title: 'GNS | Gestión de Negocios SarriaTech',
  description: 'GNS - Gestión de Negocios SarriaTech',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
          <CookieConsentBanner />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

