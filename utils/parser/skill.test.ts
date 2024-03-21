import { test } from '@jest/globals';

import { data } from '../../public/memoria.json';
import { parse_skill } from './skill';

test('support parser regex coverall', () => {
  for (const { skill } of data) {
    parse_skill(skill.name, skill.description);
  }
});
