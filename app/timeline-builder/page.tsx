import type { Metadata, ResolvingMetadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import { TimelineBuilderPage } from "@/timeline-builder/_builder";

export default function Page() {
  return <TimelineBuilderPage />;
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
    typeof p.title === "string" ? p.title : "Timeline Builder";

  return typeof deck === "string"
    ? pipe(
        defaultMetadata,
        Meta.openGraph.modify((openGraph) => ({
          ...openGraph,
          title: title(params),
          description: "あなただけのオーダーを作成しよう",
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
          title: title(params),
          description: "あなただけのオーダーを作成しよう",
          card: "summary",
        })),
      )
    : pipe(
        defaultMetadata,
        Meta.openGraph.modify((openGraph) => ({
          ...openGraph,
          title: "Timeline Builder",
          description: "あなただけのオーダーを作成しよう",
        })),
        Meta.twitter.modify((twitter) => ({
          ...twitter,
          title: "Timeline Builder",
          description: "あなただけのオーダーを作成しよう",
          card: "summary",
        })),
      );
}
