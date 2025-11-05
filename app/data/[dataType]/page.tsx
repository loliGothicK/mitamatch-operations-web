import type { Metadata } from 'next';
import { metadata as defaultMetadata } from '@/layout';
import { pipe } from 'fp-ts/function';
import { Meta } from '@/metadata/lens';
import DataPage from '@/data/_router';

export default async function Page(props: PageProps<'/data/[dataType]'>) {
  const { dataType } = await props.params;
  return <DataPage dataType={dataType} />;
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
