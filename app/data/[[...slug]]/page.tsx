import type { Metadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import DataPage from "@/data/_common/Top";
import { match, P } from "ts-pattern";
import NotFound from "next/dist/client/components/builtin/not-found";
import { default as MemoriaDetail } from "@/data/_memoria/deital";
import { default as CostumeDetail } from "@/data/_costume/deital";
import { bail } from "@/error/error";
import { z } from "zod";
import { isLeft, right } from "fp-ts/Either";

type Props = {
  params: Promise<{ slug?: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const cardTypeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type } = await searchParams;

  const cardType = match(type)
    .with(undefined, () => right(1 as const))
    .with(P.string, (type) =>
      match(cardTypeSchema.safeParse(type))
        .with({ success: true }, ({ data }) => right(data))
        .otherwise(() => bail(type, "Invalid card type")),
    )
    .otherwise((type) => bail(type.join(", "), "Invalid card type"));

  if (isLeft(cardType)) {
    return <NotFound />;
  }

  return match(slug)
    .with(undefined, () => <DataPage />)
    .with([P.union("memoria", "order", "costume")], ([slug]) => (
      <DataPage dataType={slug} />
    ))
    .with(["memoria", P.string], ([, name]) => (
      <MemoriaDetail name={decodeURIComponent(name)} type={cardType.right} />
    ))
    .with(["costume", P.string, P.string], ([, lily, job]) => (
      <CostumeDetail
        lily={decodeURIComponent(lily)}
        job={decodeURIComponent(job)}
      />
    ))
    .otherwise(() => <NotFound />);
}

export async function generateMetadata(): Promise<Metadata> {
  return pipe(
    defaultMetadata,
    Meta.openGraph.modify((openGraph) => ({
      ...openGraph,
      title: "Deck Builder",
      description: "豊富な絞り込み機能で探していたメモリアもすぐに見つかる！",
    })),
    Meta.twitter.modify((twitter) => ({
      ...twitter,
      description: "豊富な絞り込み機能で探していたメモリアもすぐに見つかる！",
      card: "summary",
    })),
  );
}
