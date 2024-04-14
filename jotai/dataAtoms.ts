import { memoriaList } from '@/domain/memoria/memoria';
import { parseSkill } from '@/parser/skill';
import { parseSupport } from '@/parser/support';
import { atom } from 'jotai';

export const costAtom = atom(18);

export const memoriaDataAtom = atom(get =>
  memoriaList
    .filter(memoria => memoria.cost >= get(costAtom))
    .map(memoria => ({
      ...memoria,
      skillData: parseSkill(memoria.skill.name, memoria.skill.description),
      supportData: parseSupport(
        memoria.support.name,
        memoria.support.description,
      ),
    })),
);
