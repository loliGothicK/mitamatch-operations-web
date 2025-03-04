import { data } from '@/domain/memoria/memoria.json';

import { test } from '@jest/globals';

import { parseSkill } from './skill';
import { right } from 'fp-ts/Either';

test.each(data)('.parseSkill($full_name)', memoria => {
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
  ).toEqual(right(expect.anything()));
});
