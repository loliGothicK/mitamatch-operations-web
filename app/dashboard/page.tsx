import type { Metadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";

export default async function Page() {
  return <h1>Dashboard </h1>;
}

export async function generateMetadata(): Promise<Metadata> {
  return pipe(
    defaultMetadata,
    Meta.openGraph.modify((openGraph) => ({
      ...openGraph,
      title: "Dashboard",
      description: "Mitamatch Operations / Dashboard",
    })),
    Meta.twitter.modify((twitter) => ({
      ...twitter,
      title: "Dashboard",
      description: "Mitamatch Operations / Dashboard",
      card: "summary",
    })),
  );
}
