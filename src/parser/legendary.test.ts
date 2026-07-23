import memoriaData from "@/domain/memoria/memoria.json";
const data = memoriaData.data;

import { parseLegendary } from "@/parser/legendary";
import { right } from "fp-ts/Either";

test.each(data.filter((memoria: any) => "legendarySkill" in memoria))(
  ".parseLegendary($name)",
  ({ legendarySkill, name }: any) => {
    expect(parseLegendary(legendarySkill, name)).toEqual(right(expect.anything()));
  },
);
