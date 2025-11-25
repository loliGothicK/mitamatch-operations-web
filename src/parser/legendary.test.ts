import { data } from "@/domain/memoria/memoria.json";

import { parseLegendary } from "@/parser/legendary";
import { right } from "fp-ts/Either";

test.each(data.filter((memoria) => "legendarySkill" in memoria))(
  ".parseLegendary($name)",
  ({ legendarySkill, name }) => {
    expect(parseLegendary(legendarySkill, name)).toEqual(right(expect.anything()));
  },
);
