import type { Metadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import { auth } from "@clerk/nextjs/server";
import { Layout } from "@/components/Layout";

export default async function Page() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  return (
    <Layout>
      <h1>Hello, {userId}</h1>
    </Layout>
  );
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
