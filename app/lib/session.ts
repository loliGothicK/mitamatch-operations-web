import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import {users} from "@/db/schema";
import {drizzle} from "drizzle-orm/neon-http";
import {discordOauth2} from "@/discord/oauth2";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: JWTPayload) {
  return await (async () =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Date.now())
      .setExpirationTime('7d')
      .sign(encodedKey))();
}

export async function decrypt(session: string) {
  const { payload } = await jwtVerify(session, encodedKey, {
    algorithms: ['HS256'],
  });
  return payload;
}

// biome-ignore lint/style/noNonNullAssertion: We know this environment variable is set
const db = drizzle(process.env.DATABASE_URL!);

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
  await db.insert(users).values({
    discordId: json.userId,
    name: json.userName,
    email: json.userEmail,
    avatar: json.userAvatar,
    accessToken: json.access_token,
    refreshToken: json.refreshToken,
  }).onConflictDoUpdate({
    target: users.discordId,
    set: {
      name: json.userName,
      email: json.userEmail,
      avatar: json.userAvatar,
      accessToken: json.access_token,
      refreshToken: json.refreshToken,
    },
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

  await db.insert(users).values({
    discordId: payload.userId as string,
    name: payload.userName as string,
    email: payload.userEmail as string,
    avatar: payload.userAvatar as string,
    accessToken: token.access_token,
    refreshToken: payload.refreshToken as string,
  }).onConflictDoUpdate({
    target: users.discordId,
    set: {
      name: payload.userName as string,
      email: payload.userEmail as string,
      avatar: payload.userAvatar as string,
      accessToken: token.access_token,
      refreshToken: payload.refreshToken as string,
    },
  });
}
