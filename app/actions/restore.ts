import type { Unit } from '@/domain/types';
import type { OrderWithPic } from '@/jotai/orderAtoms';
import { match } from 'ts-pattern';
import { decodeDeck, decodeTimeline } from '@/encode_decode/serde';
import prisma from '@/database/client';

export async function restore(_: {
  target: 'deck';
  param: string;
}): Promise<Unit>;
export async function restore(_: {
  target: 'timeline';
  param: string;
}): Promise<OrderWithPic[]>;
export async function restore({
  target,
  param,
}: {
  target: 'deck' | 'timeline';
  param: string;
}): Promise<Unit | OrderWithPic[]> {
  const { full } = await match(target)
    .with('deck', async () => {
      return (
        (await prisma.deck.findUnique({
          where: { short: param },
          select: { full: true },
        })) || { full: param }
      );
    })
    .with('timeline', async () => {
      return (
        (await prisma.deck.findUnique({
          where: { short: param },
          select: { full: true },
        })) || { full: param }
      );
    })
    .exhaustive();
  return match(target)
    .with('deck', () => decodeDeck(full)._unsafeUnwrap())
    .with('timeline', () => decodeTimeline(full)._unsafeUnwrap())
    .exhaustive();
}
