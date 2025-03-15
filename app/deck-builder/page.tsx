import { DeckBuilderPage } from '@/deck-builder/_builder';
import { Metadata, ResolvingMetadata } from 'next';
import { metadata as defaultMetadata } from '@/layout';

export default function Page() {
  return <DeckBuilderPage />;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const deck = params['deck'];
  const metadata = await parent;

  const get =
    (p: { [key: string]: string | string[] | undefined }) => (key: string) =>
      typeof p[key] === 'string' ? p[key] : undefined;

  return typeof deck === 'string'
    ? {
        openGraph: {
          title: get(params)('title') || 'Deck Builder',
          images: {
            url: new URL(
              `/api/og?deck=${deck}`,
              metadata.metadataBase || 'https://mitama.io',
            ),
            width: 500,
            height: 500,
          },
        },
      }
    : {
        ...defaultMetadata,
        openGraph: {
          title: 'Deck Builder',
          description: '豊富な検索オプションを使って、最強のデッキを最速で作成！',
        },
    };
}
