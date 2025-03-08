import { data } from '@/domain/memoria/memoria.json';

import { parseLegendary } from '@/parser/legendary';
import { right } from 'fp-ts/Either';

test.each(data)('.parseSkill($full_name)', ({ legendary_skill }) => {
  if (legendary_skill !== undefined) {
    expect(
      parseLegendary({
        name: legendary_skill.name,
        description: legendary_skill.description as unknown as readonly [
          string,
          string,
          string,
          string,
          string,
        ],
      }),
    ).toEqual(right(expect.anything()));
  }
});
