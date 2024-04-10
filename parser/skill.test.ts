import { memoriaList } from '@/domain/memoria/memoria';

import { test } from '@jest/globals';

import { parseSkill } from './skill';

test('support parser regex coverall', () => {
  for (const { skill } of memoriaList) {
    parseSkill(skill.name, skill.description);
  }
});
