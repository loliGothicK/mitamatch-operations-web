import type { Metadata } from 'next';
import { metadata as defaultMetadata } from '@/layout';
import { pipe } from 'fp-ts/function';
import { Meta } from '@/metadata/lens';
import DataPage from '@/data/[[...slug]]/_router';

export default function Page({
  params,
}: {
  params: Promise<{ slug: string | string[] | undefined }>;
}) {
  return <DataPage params={params} />;
}

export async function generateMetadata(): Promise<Metadata> {
  return pipe(
    defaultMetadata,
    Meta.openGraph.modify(openGraph => ({
      ...openGraph,
      title: 'Deck Builder',
      description: '豊富な絞り込み機能で探していたメモリアもすぐに見つかる！',
    })),
    Meta.twitter.modify(twitter => ({
      ...twitter,
      description: '豊富な絞り込み機能で探していたメモリアもすぐに見つかる！',
      card: 'summary',
    })),
  );
}
