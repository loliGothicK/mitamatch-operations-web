'use server';
// biome-ignore lint/correctness/noNodejsModules: This is a Next.js API route, so we need to use the default Node.js import syntax
import crypto from 'node:crypto';
import { getUser } from '@/actions/auth';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

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
  const session = await getUser();
  const user =
    session !== null
      ? await prisma.user.findUnique({
          where: { discordId: session.userId },
          select: { id: true },
        })
      : null;
  if (target === 'deck') {
    await prisma.deck.upsert({
      where: { short },
      update: {},
      create: {
        short,
        full,
        user: { connect: { id: user?.id } },
      },
    });
  } else {
    await prisma.timeline.upsert({
      where: { short },
      update: {},
      create: {
        short,
        full,
        user: { connect: { id: user?.id } },
      },
    });
  }
}
