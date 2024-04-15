import { evaluate } from '@/evaluate/evaluate';
import {
  type MemoriaWithConcentration,
  charmAtom,
  compareModeAtom,
  costumeAtom,
  defAtom,
  rwDeckAtom,
  rwLegendaryDeckAtom,
  spDefAtom,
  statusAtom,
} from '@/jotai/memoriaAtoms';
import { type StatusKind, statusKind } from '@/parser/skill';
import { useAtom } from 'jotai';

export function calcFinalStatus(deck: MemoriaWithConcentration[]) {
  const [selfStatus] = useAtom(statusAtom);
  const [charm] = useAtom(charmAtom);
  const [costume] = useAtom(costumeAtom);

  return deck.reduce(
    (
      prev: [number, number, number, number],
      memoria,
    ): [number, number, number, number] => {
      return [
        prev[0] + memoria.status[memoria.concentration][0],
        prev[1] + memoria.status[memoria.concentration][1],
        prev[2] + memoria.status[memoria.concentration][2],
        prev[3] + memoria.status[memoria.concentration][3],
      ];
    },
    [
      selfStatus[0] + charm.status[0] + costume.status[0],
      selfStatus[1] + charm.status[1] + costume.status[1],
      selfStatus[2] + charm.status[2] + costume.status[2],
      selfStatus[3] + charm.status[3] + costume.status[3],
    ],
  );
}

export function calcDiff(candidate: MemoriaWithConcentration) {
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [compareMode] = useAtom(compareModeAtom);
  const [def] = useAtom(defAtom);
  const [spDef] = useAtom(spDefAtom);
  const [charm] = useAtom(charmAtom);
  const [costume] = useAtom(costumeAtom);

  const deckBefore = [...legendaryDeck, ...deck];
  const deckAfter = [...legendaryDeck, ...deck].map(m =>
    m.id === compareMode?.id ? candidate : m,
  );
  const statusBefore = calcFinalStatus(deckBefore);
  const statusAfter = calcFinalStatus(deckAfter);

  const resultBefore = evaluate(
    deckBefore,
    statusBefore,
    [def, spDef],
    charm,
    costume,
  );
  const resultAfter = evaluate(
    deckAfter,
    statusAfter,
    [def, spDef],
    charm,
    costume,
  );

  const expectedToalDamageBefore = resultBefore.skill
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedToalDamageAfter = resultAfter.skill
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalRecoveryBefore = resultBefore.skill
    .map(({ expected }) => expected.recovery)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalRecoveryAfter = resultAfter.skill
    .map(({ expected }) => expected.recovery)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);

  const expectedTotalBuffBefore = resultBefore.skill
    .map(({ expected }) => expected.buff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());

  for (const [type, amount] of Object.entries(resultBefore.supportBuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalBuffBefore.set(
      type as StatusKind,
      (expectedTotalBuffBefore.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  const expectedTotalBuffAfter = resultAfter.skill
    .map(({ expected }) => expected.buff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());

  for (const [type, amount] of Object.entries(resultAfter.supportBuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalBuffAfter.set(
      type as StatusKind,
      (expectedTotalBuffAfter.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  const expectedTotalDebuffBefore = resultBefore.skill
    .map(({ expected }) => expected.debuff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());

  for (const [type, amount] of Object.entries(
    resultBefore.supportDebuff,
  ).filter(([, amount]) => !!amount)) {
    expectedTotalDebuffBefore.set(
      type as StatusKind,
      (expectedTotalDebuffBefore.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  const expectedTotalDebuffAfter = resultAfter.skill
    .map(({ expected }) => expected.debuff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());

  for (const [type, amount] of Object.entries(resultAfter.supportDebuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalDebuffAfter.set(
      type as StatusKind,
      (expectedTotalDebuffAfter.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  return {
    expectedToalDamage: [expectedToalDamageBefore, expectedToalDamageAfter] as [
      number,
      number,
    ],
    expectedTotalRecovery: [
      expectedTotalRecoveryBefore,
      expectedTotalRecoveryAfter,
    ] as [number, number],
    expectedTotalBuff: new Map([
      ...statusKind.map(type => {
        return [
          type,
          [
            expectedTotalBuffBefore.get(type) || 0,
            expectedTotalBuffAfter.get(type) || 0,
          ],
        ] as [StatusKind, [number, number]];
      }),
    ]),
    expectedTotalDebuff: new Map([
      ...statusKind.map(type => {
        return [
          type,
          [
            expectedTotalDebuffBefore.get(type) || 0,
            expectedTotalDebuffAfter.get(type) || 0,
          ],
        ] as [StatusKind, [number, number]];
      }),
    ]),
  };
}
