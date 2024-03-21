import { test } from '@jest/globals';

import { memoriaList } from '@/domain/memoria';
import { parse_skill } from './skill';

test('support parser regex coverall', () => {
  for (const { skill } of memoriaList) {
    parse_skill(skill.name, skill.description);
  }
});
