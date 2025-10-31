import { data } from '@/domain/memoria/memoria.json';

import { isDamageEffect, parseSkill } from './skill';
import { isLeft, right } from 'fp-ts/Either';
import { match } from 'ts-pattern';

const cardType = (type: number) =>
  match(type)
    .with(1, () => '通常単体' as const)
    .with(2, () => '通常範囲' as const)
    .with(3, () => '特殊単体' as const)
    .with(4, () => '特殊範囲' as const)
    .with(5, () => '支援' as const)
    .with(6, () => '妨害' as const)
    .with(7, () => '回復' as const)
    .run();

// integration test
test.each(data)('.parseSkill($name)', memoria => {
  const skill = parseSkill({
    memoriaName: memoria.name,
    cardType: cardType(memoria.cardType),
    skill: memoria.gvgSkill,
  });

  describe('should be parsed without error', () => {
    expect(skill).toEqual(right(expect.anything()));
  });

  // for refinement
  if (isLeft(skill)) {
    return;
  }

  describe('damage effect should exists only one exactly', () => {
    const damageEffects = skill.right.effects.filter(isDamageEffect);
    if (['支援', '妨害', '回復'].includes(memoria.cardType)) {
      expect(damageEffects.length).toBe(0);
    } else {
      expect(damageEffects.length).toBe(1);
    }
  });
});

// test for 極大ダメージ
test.each(
  data.filter(({ gvgSkill }) => gvgSkill.description.includes('極大ダメージ')),
)('.parseSkill($name)/極大ダメージ', memoria => {
  expect(
    parseSkill({
      memoriaName: memoria.name,
      cardType: cardType(memoria.cardType),
      skill: memoria.gvgSkill,
    }),
  ).toEqual(
    right(
      expect.objectContaining({
        effects: expect.arrayContaining([
          expect.objectContaining({ amount: 'ultra-large' }),
        ]),
      }),
    ),
  );
});
