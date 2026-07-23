import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Layout from "@/components/layout/server";

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
  return (
    <ClerkProvider>
      <html lang="ja">
        <body
          style={{
            fontFamily:
              'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          }}
        >
          <AppRouterCacheProvider>
            <Layout>{children}</Layout>
          </AppRouterCacheProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
