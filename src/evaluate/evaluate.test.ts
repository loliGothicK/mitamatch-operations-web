import { evaluate } from "@/evaluate/evaluate";
import { memoriaList } from "@/domain/memoria/memoria";
import { charmList } from "@/domain/charm/charm";
import { costumeList } from "@/domain/costume/costume";
import { option } from "fp-ts";

test.each(memoriaList)(".evaluate($name.full/$cardType)", (memoiria) => {
  const result = evaluate(
    [{ ...memoiria, concentration: 0 }],
    [1000, 1000, 1000, 1000],
    [1000, 1000],
    charmList[0],
    costumeList[0],
    { limitBraek: 3, isAwakened: true },
    {
      counter: true,
      stack: option.none,
    },
  );
  expect(result).toBeTruthy();
});
