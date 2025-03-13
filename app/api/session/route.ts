'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { decrypt, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('session')?.value;
  const session = await decrypt(cookie);
  if (!session?.isLoggedIn) {
    return NextResponse.json({});
  }

  return NextResponse.json({
    userId: session?.userId,
    userName: session?.userName,
    userEmail: session?.userEmail,
    avatar: session?.avatar,
    expires: session?.expires,
    isLoggedIn: !!session?.isLoggedIn,
  });
}

const User = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  const user = User.safeParse(await req.json());
  if (!user.success) {
    return NextResponse.json({ error: user.error }, { status: 400 });
  }
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({
    userId: user.data.user.id,
    userName: user.data.user.name,
    userEmail: user.data.user.email,
    avatar: user.data.user.avatar,
    isLoggedIn: true,
    expires,
  });
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });

  return NextResponse.json({ status: 200 });
}
