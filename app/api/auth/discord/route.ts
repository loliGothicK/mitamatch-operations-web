'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { discordOauth2 } from '@/discord/oauth2';

const discordTokenSchema = z.object({
  access_token: z.string(),
});

const OAUTH_QUERY = new URLSearchParams({
  client_id: process.env.DISCORD_CLIENT_ID!,
  redirect_uri: `${process.env.MITAMATCH_HOST}/api/auth/discord`,
  response_type: 'code',
  scope: 'identify email',
}).toString();

const DISCORD_OAUTH_URL = `https://discord.com/oauth2/authorize?${OAUTH_QUERY}`;
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (code === null) {
    return NextResponse.redirect(DISCORD_OAUTH_URL);
  }

  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.MITAMATCH_HOST}/api/auth/discord`,
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

  const saved = await fetch(`${process.env.MITAMATCH_HOST}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    }),
  });

  if (!saved.ok) {
    return NextResponse.json(
      { error: `Failed to save token: ${JSON.stringify(saved.json())}` },
      { status: 400 },
    );
  }

  return NextResponse.redirect(`${req.nextUrl.origin}?user=${user.id}`);
}
