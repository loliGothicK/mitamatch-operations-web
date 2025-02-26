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
  const hash = crypto.createHash('md5').update(data.base64).digest('hex');

  const found = await prisma.shortUrl.findUnique({
    where: {
      shortUrl: hash,
    },
  });

  if (found !== null) {
    return found.shortUrl;
  }

  await prisma.shortUrl.create({
    data: {
      url: data.base64,
      shortUrl: hash,
    },
  });

  return hash;
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
