'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { discordOauth2 } from '@/discord/oauth2';
import { createSession } from '@/lib/session';

const discordTokenSchema = z.object({
  access_token: z.string(),
});

const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (code === null) {
    const query = new URLSearchParams({
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      client_id: process.env.DISCORD_CLIENT_ID!,
      redirect_uri: new URL('/api/auth/discord', req.nextUrl).toString(),
      response_type: 'code',
      scope: 'identify email',
    }).toString();
    const discordOAuth2Url = `https://discord.com/oauth2/authorize?${query}`;
    return NextResponse.redirect(discordOAuth2Url);
  }

  const body = new URLSearchParams({
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    client_id: process.env.DISCORD_CLIENT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: new URL('/api/auth/discord', req.nextUrl).toString(),
    code,
  }).toString();

  const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    body,
  });

  const res = await tokenResponse.json();
  const token = discordTokenSchema.safeParse(res);

  if (!token.success) {
    return NextResponse.json(
      { error: `Failed to get token: ${JSON.stringify(res)}` },
      { status: 400 },
    );
  }

  const user = await discordOauth2.getUser(token.data.access_token);

  await createSession({
    userId: user.id,
    userName: user.username,
    userEmail: user.email ? user.email : '',
    userAvatar: user.avatar ? user.avatar : 'default',
  });

  return NextResponse.redirect(`${req.nextUrl.origin}`);
}
