import 'server-only';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';
import type { Prisma } from '@prisma/client/extension';
import { match } from 'ts-pattern';

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

interface SaveWhereClause {
  short?: string;
  userId?: string;
}

const hasProps =
  <T extends (string | number | symbol)[]>(...props: T) =>
  <Obj extends Partial<{ [K in T[number]]: string }>>(
    obj: Obj,
  ): obj is Obj & { [key in T[number]]: string } => {
    return props.every(prop => prop in obj);
  };

const connectionString = `${process.env.POSTGRES_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
export const prisma = new PrismaClient({ adapter }).$extends({
  model: {
    deck: {
      async save<T>(
        this: T,
        {
          where,
          create,
        }: {
          where: SaveWhereClause;
          create: Prisma.Args<T, 'upsert'>['create'];
        },
      ) {
        return await match(where)
          .when(hasProps('userId'), async ({ userId }) => {
            return await prisma.deck.upsert({
              where: { userId },
              update: {},
              create,
            });
          })
          .when(hasProps('short'), async () => {
            return await prisma.deck.create({
              data: create,
            });
          })
          .exhaustive();
      },
    },
    timeline: {
      async save<T>(
        this: T,
        {
          where,
          create,
        }: {
          where: SaveWhereClause;
          create: Prisma.Args<T, 'upsert'>['create'];
        },
      ) {
        return await match(where)
          .when(hasProps('userId'), async ({ userId }) => {
            return await prisma.timeline.upsert({
              where: { userId },
              update: {},
              create,
            });
          })
          .when(hasProps('short'), async () => {
            return await prisma.timeline.create({
              data: create,
            });
          })
          .exhaustive();
      },
    },
  },
});
