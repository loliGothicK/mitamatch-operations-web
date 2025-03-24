'use server';
// biome-ignore lint/correctness/noNodejsModules: This is a Next.js API route, so we need to use the default Node.js import syntax
import crypto from 'node:crypto';
import { getUser } from '@/actions/auth';
import { prisma } from '@/database/prismaClient';

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
  const session = await getUser();
  const user =
    session !== null
      ? await prisma.user.findUnique({
          where: { discordId: session.userId },
          select: { id: true },
        })
      : null;
  if (target === 'deck') {
    await prisma.deck.save({
      where: {
        short,
      },
      create: user?.id
        ? {
            short,
            full,
            user: { connect: { id: user?.id } },
          }
        : {
            short,
            full,
          },
    });
  } else {
    await prisma.timeline.save({
      where: {
        short,
      },
      create: user?.id
        ? {
            short,
            full,
            user: { connect: { id: user?.id } },
          }
        : {
            short,
            full,
          },
    });
  }
}
