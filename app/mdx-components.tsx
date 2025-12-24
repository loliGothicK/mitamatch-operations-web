import type { MDXComponents } from 'mdx/types';
import YouTube from '@/components/mdx/YouTube';
import Image from "next/image";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // ここに登録すると、MDX内で <YouTube /> と書くだけで動くようになる (MDXContentにこれを渡すので)
    YouTube,
    Image,
    // 他のコンポーネントも同様に登録可能
    // Callout,
    // LinkCard,

    ...components,
  };
}