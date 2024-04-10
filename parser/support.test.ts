import { memoriaList } from '@/domain/memoria/memoria';

import { test } from '@jest/globals';

import { parseSupport } from './support';

test('support parser regex coverall', () => {
  for (const { support } of memoriaList) {
    parseSupport(support.name, support.description);
  }
});
