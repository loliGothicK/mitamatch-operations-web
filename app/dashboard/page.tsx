import type { Metadata } from "next";
import { metadata as defaultMetadata } from "@/layout";
import { pipe } from "fp-ts/function";
import { Meta } from "@/metadata/lens";
import { Dashboard } from "@/dashboard/_parts/Layout";
import { getUser } from "@/database";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/signed-in");
  const user = await getUser(clerkUser.id);
  return <Dashboard user={user} />;
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
