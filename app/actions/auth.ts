"use server";

import type { SessionData } from "@/session/sessionData";
import { decrypt } from "@/lib/crypt";
import { cookies } from "next/headers";

export async function getSession(): Promise<Omit<
  SessionData,
  "isLoggedIn" | "expires"
> | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;

  if (!cookie) {
    return null;
  }

  const session = await decrypt(cookie);

  if (!session?.isLoggedIn) {
    return null;
  }

  return {
    userId: session?.userId as string,
    userName: session?.userName as string,
    userEmail: session?.userEmail as string,
    userAvatar: session?.userAvatar as string,
  };
}
