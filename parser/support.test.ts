import { memoriaList } from '@/domain/memoria/memoria';

import { test } from '@jest/globals';

import { parse_support } from './support';

test('support parser regex coverall', () => {
  for (const { support } of memoriaList) {
    parse_support(support.name, support.description);
  }
});
