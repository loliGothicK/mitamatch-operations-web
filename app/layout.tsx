import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import { Provider } from "jotai";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mitamatch Operations for Web",
  description: "Mitamatch Operations for Web",
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
