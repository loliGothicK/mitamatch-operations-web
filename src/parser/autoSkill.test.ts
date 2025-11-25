import { data } from "@/domain/memoria/memoria.json";

import { parseAutoSkill } from "./autoSkill";
import { right } from "fp-ts/Either";

test.each(data)(".parseAutoSkill($name)", ({ name, autoSkill }) => {
  expect(parseAutoSkill({ memoriaName: name, autoSkill })).toEqual(right(expect.anything()));
});
