import { PropsWithChildren } from "react";
import { Layout as ClientLayout } from "@/components/layout/client";
import { getUserData, upsertUser } from "@/database";
import { currentUser } from "@clerk/nextjs/server";

export default async function Layout({ children }: PropsWithChildren<{}>) {
  const user = await currentUser();
  if (user) {
    await upsertUser({
      id: user.id,
      username: user.username!,
    });
  }
  const userData = user ? await getUserData(user.id) : undefined;
  return <ClientLayout userData={userData}>{children}</ClientLayout>;
}
