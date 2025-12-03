import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

const siteName = "Mitamatch Operations";
const description =
  "デッキビルダーやオーダータイムラインビルダーなどラスバレを便利にするツールが使えます";
const url = "https://operations.mitama.io";

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
      "https://raw.githubusercontent.com/loliGothicK/mitamatch-operations-web/master/public/opengraph-image.png",
    ],
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [
      "https://raw.githubusercontent.com/loliGothicK/mitamatch-operations-web/master/public/opengraph-image.png",
    ],
    site: "@mitama_rs",
    creator: "@mitama_rs",
  },
  alternates: {
    canonical: url,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className={inter.className}>
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
        <GoogleTagManager gtmId={`${process.env.GTM}`} nonce={nonce} />
        <GoogleAnalytics gaId={`${process.env.GTAG}`} nonce={nonce} />
      </html>
    </ClerkProvider>
  );
}
