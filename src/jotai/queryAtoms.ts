import { atomWithStorage } from "jotai/utils";
import { outdent } from "outdent";

function except(cols: string[]) {
  return `* except (${cols.map((col) => `\`${col}\``).join(", ")})`;
}

const memoriaQueryAtom = atomWithStorage<string>(
  "query[memoria]",
  outdent`
    select ${except(["questSkill"])}
      from memoria
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
    select ${except(["released_at"])}
      from costume
      order by \`released_at\` desc;
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
