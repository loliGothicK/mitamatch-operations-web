import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeSlug from "rehype-slug";
import { rehypeImageMetadata } from "./lib/rehype-image-metadata.mjs";
import {z} from "zod";
import remarkGfm from "remark-gfm";

const docs = defineCollection({
  name: "docs",
  directory: "docs", // MDXファイルを置く場所
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    section: z.number(),
  }),
  transform: async (document, context) => {
    // MDXをコンパイルする際にプラグインを適用
    const mdx = await compileMDX(context, document, {
      rehypePlugins: [
        rehypeSlug, // 見出しにIDを自動付与（ToC用）
        rehypeImageMetadata, // ★ここで画像サイズ計算プラグインを適用
      ],
      remarkPlugins: [remarkGfm],
    });

    return {
      ...document,
      mdx, // コンパイル済みのMDX本体
      // ここでToC構造を抽出して返すことも可能
    };
  },
});

export default defineConfig({
  collections: [docs],
});