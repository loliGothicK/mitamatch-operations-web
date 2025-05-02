import 'server-only';
import { cookies } from 'next/headers';
import { discordOauth2 } from '@/discord/oauth2';
import { decrypt, encrypt } from '@/lib/crypt';
import { updateToken, upsertUser } from '@/database';

export async function createSession(json: {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  access_token: string;
  refreshToken: string;
}) {
  'use server';
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({
    ...json,
    isLoggedIn: true,
    expires,
  });
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: 'lax',
    path: '/',
  });

  await upsertUser({
    discordId: json.userId,
    name: json.userName,
    email: json.userEmail,
    avatar: json.userAvatar,
    accessToken: json.access_token,
    refreshToken: json.refreshToken,
  });
}

export async function updateSession(session: string) {
  const payload = await decrypt(session);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await discordOauth2.tokenRequest({
    refreshToken: payload?.refreshToken as string,
    scope: ['identify', 'email'],
    grantType: 'refresh_token',
  });
  const newSession = await encrypt({
    ...payload,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expires,
  });
  const cookieStore = await cookies();
  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: 'lax',
  });

  await updateToken({
    discordId: payload.userId as string,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
  });
}
