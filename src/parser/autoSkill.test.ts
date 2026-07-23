import memoriaData from "@/domain/memoria/memoria.json";
const data = memoriaData.data;

import { parseAutoSkill } from "./autoSkill";
import { right } from "fp-ts/Either";

test.each(data)(".parseAutoSkill($name)", ({ name, autoSkill }: any) => {
  expect(parseAutoSkill({ memoriaName: name, autoSkill })).toEqual(right(expect.anything()));
});
