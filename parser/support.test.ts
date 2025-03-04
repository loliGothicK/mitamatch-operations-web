import { data } from '@/domain/memoria/memoria.json';

import { test } from '@jest/globals';

import { parseSupport } from './support';
import { right } from 'fp-ts/Either';

test.each(data)('.parseSupport($full_name)', ({ support }) => {
  expect(parseSupport(support)).toEqual(right(expect.anything()));
});
