import { evaluate } from '@/evaluate/evaluate';
import { memoriaList } from '@/domain/memoria/memoria';
import { charmList } from '@/domain/charm/charm';
import { costumeList } from '@/domain/costume/costume';

test.each(memoriaList)('.evaluate($name.full/$kind)', memoiria => {
  const result = evaluate(
    [{ ...memoiria, concentration: 0 }],
    [1000, 1000, 1000, 1000],
    [1000, 1000],
    charmList[0],
    costumeList[0],
    3,
  );
  expect(result).toBeDefined();
});
