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
import { isLeft, right } from "fp-ts/Either";
import { parseIntSafe } from "@/parser/common";
import { either } from "fp-ts";
import { default as CharacterDetail } from "@/data/_character/detail";
import { normalizeJobName } from "@/domain/costume/function";
import View from "@/data/_character/view";
import Layout from "@/components/layout/server";

type Props = {
  params: Promise<{ slug?: string | string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type } = await searchParams;

  const cardType = match(type)
    .with(undefined, () => right(1 as const))
    .with(P.string, (type) =>
      pipe(
        parseIntSafe(type),
        either.flatMap((type) =>
          match(type)
            .with(P.number.between(1, 7), () => right(type as 1 | 2 | 3 | 4 | 5 | 6 | 7))
            .otherwise(() => bail(`${type}`, "Invalid card type")),
        ),
      ),
    )
    .otherwise((type) => bail(type.join(", "), "Invalid card type"));

  if (isLeft(cardType)) {
    return <NotFound />;
  }

  return match(slug)
    .with(undefined, () => (
      <Layout>
        <DataPage dataType={"memoria"} />
      </Layout>
    ))
    .with([P.union("memoria", "costume", "character").select()], (slug) => (
      <Layout>
        <DataPage dataType={slug} />
      </Layout>
    ))
    .with(["memoria", P.string], ([, name]) => (
      <Layout>
        <MemoriaDetail name={decodeURIComponent(name)} type={cardType.right} />
      </Layout>
    ))
    .with(["costume", P.string, P.string], ([, lily, job]) => (
      <Layout>
        <CostumeDetail
          lily={decodeURIComponent(lily)}
          job={normalizeJobName(decodeURIComponent(job))}
        />
      </Layout>
    ))
    .with(["character"], () => (
      <Layout>
        <View />
      </Layout>
    ))
    .with(["character", P.string.select()], (name) => (
      <Layout>
        <CharacterDetail name={decodeURIComponent(name)} />
      </Layout>
    ))
    .otherwise(() => <NotFound />);
}

type MetadataProps = {
  params: Promise<{ slug: string[] | undefined }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const slug = (await params).slug;

  const [ja, camel] = match(slug)
    .with(["memoria"], () => ["メモリア", "Memoria "])
    .with(["costume"], () => ["衣装", "Costume "])
    .with(["character"], () => ["キャラクター", "Character "])
    .otherwise(() => ["メモリアも衣装もキャラクター", ""]);

  return pipe(
    defaultMetadata,
    Meta.openGraph.modify((openGraph) => ({
      ...openGraph,
      title: `${camel}Data`,
      description: `豊富な絞り込み機能で探していた${ja}もすぐに見つかる！`,
    })),
    Meta.twitter.modify((twitter) => ({
      ...twitter,
      description: `豊富な絞り込み機能で探していた${ja}もすぐに見つかる！`,
      card: "summary",
    })),
  );
}
