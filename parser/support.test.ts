import { test } from '@jest/globals';

import { data } from '../public/memoria.json';
import { parse_support } from './support';

test('support parser regex coverall', () => {
  for (const { support } of data) {
    parse_support(support.name, support.description);
  }
});
