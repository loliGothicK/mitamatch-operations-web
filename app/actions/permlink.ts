'use server';
// biome-ignore lint/correctness/noNodejsModules: This is a Next.js API route, so we need to use the default Node.js import syntax
import crypto from 'node:crypto';
import { getSession } from '@/actions/auth';
import { getUser, upsertDeck, upsertTimeline } from '@/database';

export async function generateShortLink(data: { full: string }) {
  return await (async () =>
    crypto.createHash('md5').update(data.full).digest('hex'))();
}

export async function saveShortLink({
  target,
  full,
  short,
}: {
  target: 'deck' | 'timeline';
  full: string;
  short: string;
}) {
  'use server';
  const session = await getSession();
  const user = session !== null ? await getUser(session.userId) : null;
  if (target === 'deck') {
    await upsertDeck({
      short,
      full,
      userId: user?.id,
    });
  } else {
    await upsertTimeline({
      short,
      full,
      userId: user?.id,
    });
  }
}
