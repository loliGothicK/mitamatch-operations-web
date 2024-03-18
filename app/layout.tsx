import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import { Provider } from "jotai";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

const siteName = "Mitamatch Operations for Web";
const description = "Mitamatch Operations の機能の一部がブラウザで使えます";
const url = "https://mitama.io";

export const metadata = {
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
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    site: "@mitama_rs",
    creator: "@mitama_rs",
  },
  alternates: {
    canonical: url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Provider>{children}</Provider>
        <Analytics />
        <SpeedInsights />
      </body>
      <GoogleTagManager gtmId={`${process.env.GTAG}`} />
      <GoogleAnalytics gaId={`${process.env.GTAG}`} />
    </html>
  );
}
