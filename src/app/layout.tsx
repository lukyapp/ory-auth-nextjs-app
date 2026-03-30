import './globals.css';
import { resolveOryLocale } from '@/lib/ory/resolve-ory-locale';
import { Inter } from 'next/font/google';
import React, { ReactNode, Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await resolveOryLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={inter.className}>
      <body>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
