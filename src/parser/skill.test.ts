import { data } from '@/domain/memoria/memoria.json';

import {isDamageEffect, parseSkill} from './skill';
import {isLeft, right} from 'fp-ts/Either';

// integration test
test.each(data)('.parseSkill($full_name)', memoria => {
  const skill = parseSkill({
    kind: memoria.kind as
      | '通常範囲'
      | '特殊範囲'
      | '支援'
      | '妨害'
      | '回復'
      | '通常単体'
      | '特殊単体',
    skill: memoria.skill,
  });

  describe('should be parsed without error', () => {
    expect(skill).toEqual(right(expect.anything()));
  })

  // for refinement
  if (isLeft(skill)) {
    return;
  }

  describe('damage effect should exists only one exactly', () => {
    const damageEffects = skill.right.effects.filter(isDamageEffect);
    if (['支援', '妨害', '回復'].includes(memoria.kind)) {
      expect(damageEffects.length).toBe(0);
    } else {
      expect(damageEffects.length).toBe(1);
    }
  });
});

// test for 極大ダメージ
test.each(
  data.filter(({ skill }) => skill.description.includes('極大ダメージ')),
)('.parseSkill($full_name)/極大ダメージ', memoria => {
  expect(
    parseSkill({
      kind: memoria.kind as
        | '通常範囲'
        | '特殊範囲'
        | '支援'
        | '妨害'
        | '回復'
        | '通常単体'
        | '特殊単体',
      skill: memoria.skill,
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
