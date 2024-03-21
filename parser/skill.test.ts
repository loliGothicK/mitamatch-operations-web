import { memoriaList } from '@/domain/memoria';

import { test } from '@jest/globals';

import { parse_skill } from './skill';

test('support parser regex coverall', () => {
  for (const { skill } of memoriaList) {
    parse_skill(skill.name, skill.description);
  }
});
