import { DeckBuilderPage } from "@/deck-builder/_builder";
import type { Metadata, ResolvingMetadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import { currentUser } from "@clerk/nextjs/server";
import { getUser } from "@/database";

export default async function Page() {
  const clerkUser = await currentUser();
  const user = clerkUser ? await getUser(clerkUser.id) : undefined;

  return <DeckBuilderPage user={user} />;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const deck = params.deck;
  const metadata = await parent;

  const title = (p: { [key: string]: string | string[] | undefined }) =>
    typeof p.title === "string" ? p.title : "Deck Builder";

  return typeof deck === "string"
    ? pipe(
        defaultMetadata,
        Meta.openGraph.modify((openGraph) => ({
          ...openGraph,
          title: title(params),
          description: "豊富な絞り込み機能で最高のデッキを作成しよう",
          images: {
            url: new URL(
              `/api/og?deck=${deck}`,
              metadata.metadataBase || "https://operations.mitama.io",
            ),
            width: 500,
            height: 500,
          },
        })),
        Meta.twitter.modify((twitter) => ({
          ...twitter,
          description: "豊富な絞り込み機能で最高のデッキを作成しよう",
          card: "summary",
        })),
      )
    : pipe(
        defaultMetadata,
        Meta.openGraph.modify((openGraph) => ({
          ...openGraph,
          title: "Deck Builder",
          description: "豊富な絞り込み機能で最高のデッキを作成しよう",
        })),
        Meta.twitter.modify((twitter) => ({
          ...twitter,
          description: "豊富な絞り込み機能で最高のデッキを作成しよう",
          card: "summary",
        })),
      );
}
