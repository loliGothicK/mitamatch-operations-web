import { PropsWithChildren } from "react";
import { Layout as ClientLayout } from "@/components/layout/client";
import { getUserData } from "@/database";
import { auth } from "@clerk/nextjs/server";

export default async function Layout({ children }: PropsWithChildren<{}>) {
  const { userId } = await auth();
  const userData = userId ? await getUserData(userId) : undefined;
  return <ClientLayout userData={userData}>{children}</ClientLayout>;
}
