"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { discordOauth2 } from "@/discord/oauth2";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const basePath =
    req.headers.get("x-base-path") ||
    (process.env.NODE_ENV === "production"
      ? "https://operations.mitama.io"
      : "http://localhost:3000");
  const code = searchParams.get("code");
  const redirectUri = new URL("/api/auth/discord", basePath).toString();

  if (code === null) {
    const authUrl = discordOauth2.generateAuthUrl({
      clientId: process.env.DISCORD_CLIENT_ID!,
      responseType: "code",
      redirectUri,
      scope: ["identify", "email"],
    });
    return NextResponse.redirect(authUrl);
  }

  const token = await discordOauth2.tokenRequest({
    code,
    scope: ["identify", "email"],
    grantType: "authorization_code",
    redirectUri,
  });

  const user = await discordOauth2.getUser(token.access_token);

  await createSession({
    userId: user.id,
    userName: user.username,
    userEmail: user.email ? user.email : "",
    userAvatar: user.avatar ? user.avatar : "default",
    access_token: token.access_token,
    refreshToken: token.refresh_token,
  });

  return NextResponse.redirect(`${req.nextUrl.origin}`);
}
