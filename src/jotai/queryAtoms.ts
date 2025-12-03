import { atomWithStorage } from "jotai/utils";

const memoriaQueryAtom = atomWithStorage<string>(
  "query[memoria]",
  "select * from memoria where `cost` > 18;",
  undefined,
  {
    getOnInit: true,
  },
);

const costumeQueryAtom = atomWithStorage<string>(
  "query[costume]",
  "select * from costume order by released_at desc;",
  undefined,
  {
    getOnInit: true,
  },
);

const queryAtom = {
  memoria: memoriaQueryAtom,
  costume: costumeQueryAtom,
};

export default queryAtom;
