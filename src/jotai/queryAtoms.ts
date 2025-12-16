import { atomWithStorage } from "jotai/utils";
import { outdent } from "outdent";

const memoriaQueryAtom = atomWithStorage<string>(
  "query[memoria]",
  outdent`
      select (\`image\`, \`name\`, \`type\`, \`attribute\`, \`atk\`, \`spatk\`, \`def\`, \`spdef\`, \`gvgSkill\`, \`autoSkill\`)
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
