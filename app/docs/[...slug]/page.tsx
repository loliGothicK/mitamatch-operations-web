import { allDocs } from "content-collections";
import { notFound } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { Metadata } from "next";
import { MdxViewer } from "@/docs/_mdx/mdx";

/**
 * ビルド時に全ページを静的に生成する（SSG）
 * これがないとリクエストのたびにサーバーでレンダリングされ、遅くなる
 */
export async function generateStaticParams() {
  return allDocs.map((doc) => {
    // "/docs/foo/bar" -> ["foo", "bar"] に変換
    const slugParts = doc.slug.split("/").filter((p) => p !== "" && p !== "docs");
    return { slug: slugParts };
  });
}

/**
 * メタデータ（ブラウザのタブ名など）を動的に生成
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocFromParams(slug);
  if (!doc) return {};

  return {
    title: `${doc.title} | Mitamatch Operations`,
    description: "Mitamatch Operations References",
  };
}

/**
 * URLパラメータからドキュメントを探すヘルパー
 */
function getDocFromParams(slug: string[]) {
  return allDocs.find((d) => d.slug === `/${slug.join("/")}`);
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const doc = getDocFromParams(slug);

  if (!doc) {
    notFound();
  }

  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* 記事タイトル */}
      <Typography variant="h1" gutterBottom sx={{ fontSize: "2.5rem", fontWeight: 700 }}>
        {doc.title}
      </Typography>

      {/* MDX本文のレンダリング */}
      {/* ここで mdx-components.tsx が自動的に適用されます */}
      <MdxViewer code={doc.mdx} />
    </Box>
  );
}
