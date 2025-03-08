'use server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import ws from 'ws';
// biome-ignore lint/correctness/noNodejsModules: This is a Next.js API route, so we need to use the default Node.js import syntax
import crypto from 'node:crypto';

dotenv.config();
neonConfig.webSocketConstructor = ws;
const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

export async function generateShortLink(data: { base64: string }) {
  return await (async () =>
    crypto.createHash('md5').update(data.base64).digest('hex'))();
}

export async function saveShortLink({
  base64,
  hash,
}: { base64: string; hash: string }) {
  const found = await prisma.shortUrl.findUnique({
    where: {
      shortUrl: hash,
    },
  });

  if (found !== null) {
    return found.shortUrl;
  }

  return await prisma.shortUrl.create({
    data: {
      url: base64,
      shortUrl: hash,
    },
  });
}

export async function getShortLink(data: {
  shortUrl: string;
}): Promise<string> {
  const found = await prisma.shortUrl.findUnique({
    where: {
      shortUrl: data.shortUrl,
    },
  });
  if (found === null) {
    throw new Error('Unable to find shortUrl');
  }
  return found.url;
}
