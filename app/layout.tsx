import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Provider } from 'jotai';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

const siteName = 'Mitamatch Operations';
const description =
  'デッキビルダーやオーダータイムラインビルダーなどラスバレを便利にするツールが使えます';
const url = 'https://mitama.io';

export const metadata: Metadata = {
  title: {
    default: siteName,
    /** `next-seo`の`titleTemplate`に相当する機能 */
    template: `%s - ${siteName}`,
  },
  description,
  openGraph: {
    title: siteName,
    description,
    url,
    images: [
      'https://raw.githubusercontent.com/loliGothicK/mitamatch-operations-web/master/public/opengraph-image.png',
    ],
    siteName,
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
    images: [
      'https://raw.githubusercontent.com/loliGothicK/mitamatch-operations-web/master/public/opengraph-image.png',
    ],
    site: '@mitama_rs',
    creator: '@mitama_rs',
  },
  alternates: {
    canonical: url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='ja'>
      <body className={inter.className}>
        <Provider>{children}</Provider>
        <Analytics />
        <SpeedInsights />
      </body>
      <GoogleTagManager gtmId={`${process.env.GTM}`} />
      <GoogleAnalytics gaId={`${process.env.GTAG}`} />
    </html>
  );
}
