import { atomWithStorage } from "jotai/utils";
import { outdent } from "outdent";

function except(cols: string[]) {
  return `* except (${cols.map((col) => `\`${col}\``).join(", ")})`;
}

const memoriaQueryAtom = atomWithStorage<string>(
  "query[memoria]",
  outdent`
    SELECT ${except(["questSkill"])} FROM memoria
      where \`cost\` > 18;
  `,
  undefined,
  {
    getOnInit: true,
  },
);

const costumeQueryAtom = atomWithStorage<string>(
  "query[costume]",
  outdent`
    SELECT ${except(["released_at"])} FROM costume
      ORDER BY \`released_at\` DESC;
  `,
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
