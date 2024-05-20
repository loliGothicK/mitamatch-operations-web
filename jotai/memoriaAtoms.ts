import { atom } from 'jotai';

import { type Memoria, memoriaList } from '@/domain/memoria/memoria';
import { parseSkill } from '@/parser/skill';
import { parseSupport } from '@/parser/support';
import {
  type ElementFilterType,
  type RoleFilterType,
  elementFilter,
  elementFilterMap,
  roleFilterMap,
} from '@/types/filterType';
import type {
  AssistSupportSearch,
  BasicStatusSearch,
  ElementStatusSearch,
  LabelSearch,
  OtherSkillSearch,
  OtherSupportSearch,
  RecoverySupportSearch,
  VanguardSupportSearch,
} from '@/types/searchType';

import { encodeDeck } from '@/actions/serde';
import { charmList } from '@/domain/charm/charm';
import { costumeList } from '@/domain/costume/costume';
import Cookies from 'js-cookie';
import { match } from 'ts-pattern';

export const compareModeAtom = atom<MemoriaWithConcentration | undefined>(
  undefined,
);
export const candidateAtom = atom<MemoriaWithConcentration | undefined>(
  undefined,
);
export const adLevelAtom = atom(3);
export const charmAtom = atom(charmList.reverse()[0]);
export const costumeAtom = atom(costumeList.reverse()[0]);
export const defAtom = atom(400_000);
export const spDefAtom = atom(400_000);
/// [230_148, 243_832, 231_548, 236_140]
export const statusAtom = atom([163_172, 177_032, 178_994, 183_643] as [
  number,
  number,
  number,
  number,
]);
export type MemoriaWithConcentration = Memoria & { concentration: number };

export const sortKind = [
  'ID',
  'NAME',
  'ATK',
  'Sp.ATK',
  'DEF',
  'Sp.DEF',
  'ATK+Sp.ATK',
  'DEF+Sp.DEF',
] as const;
export type SortKind = (typeof sortKind)[number];

const deckAtom = atom<MemoriaWithConcentration[]>([]);
export const rwDeckAtom = atom(
  get => get(deckAtom),
  (
    get,
    set,
    update:
      | MemoriaWithConcentration[]
      | ((prev: MemoriaWithConcentration[]) => MemoriaWithConcentration[]),
  ) => {
    const newValue =
      typeof update === 'function' ? update(get(deckAtom)) : update;
    Cookies.set(
      'deck',
      encodeDeck(get(swAtom), newValue, get(rwLegendaryDeckAtom)),
    );
    set(deckAtom, newValue);
  },
);

const legendaryDeckAtom = atom<MemoriaWithConcentration[]>([]);
export const rwLegendaryDeckAtom = atom(
  get => get(legendaryDeckAtom),
  (
    get,
    set,
    update:
      | MemoriaWithConcentration[]
      | ((prev: MemoriaWithConcentration[]) => MemoriaWithConcentration[]),
  ) => {
    const newValue =
      typeof update === 'function' ? update(get(legendaryDeckAtom)) : update;
    Cookies.set('deck', encodeDeck(get(swAtom), get(rwDeckAtom), newValue));
    set(legendaryDeckAtom, newValue);
  },
);

export const swAtom = atom<'sword' | 'shield'>('shield');
export const roleFilterAtom = atom<RoleFilterType[]>([
  'support',
  'interference',
  'recovery',
]);
export const elementFilterAtom = atom<ElementFilterType[]>([...elementFilter]);
export const labelFilterAtom = atom<LabelSearch[]>([]);

export const currentRoleFilterAtom = atom(get => {
  const sw = get(swAtom);
  return match<'sword' | 'shield', RoleFilterType[]>(sw)
    .with('shield', () => ['support', 'interference', 'recovery'])
    .with('sword', () => [
      'normal_single',
      'normal_range',
      'special_single',
      'special_range',
    ])
    .exhaustive();
});

export const basicStatusFilterAtom = atom<BasicStatusSearch[]>([]);
export const elementStatusFilterAtom = atom<ElementStatusSearch[]>([]);
export const otherSkillFilterAtom = atom<OtherSkillSearch[]>([]);
export const vanguardSupportFilterAtom = atom<VanguardSupportSearch[]>([]);
export const assistSupportFilterAtom = atom<AssistSupportSearch[]>([]);
export const recoverySupportFilterAtom = atom<RecoverySupportSearch[]>([]);
export const otherSupportFilterAtom = atom<OtherSupportSearch[]>([]);

export const resetFilterAtom = atom(null, (_, set) => {
  set(labelFilterAtom, []);
  set(basicStatusFilterAtom, []);
  set(elementStatusFilterAtom, []);
  set(otherSkillFilterAtom, []);
  set(vanguardSupportFilterAtom, []);
  set(assistSupportFilterAtom, []);
  set(recoverySupportFilterAtom, []);
  set(otherSupportFilterAtom, []);
});

export const sortKindAtom = atom<SortKind>('ID');

export const filteredMemoriaAtom = atom(get => {
  return memoriaList
    .filter(memoria => {
      const sw = match(get(swAtom))
        .with('shield', () => ['支援', '妨害', '回復'].includes(memoria.kind))
        .with('sword', () =>
          ['通常単体', '通常範囲', '特殊単体', '特殊範囲'].includes(
            memoria.kind,
          ),
        )
        .exhaustive();

      const role = get(roleFilterAtom).some(filter => {
        return memoria.kind === roleFilterMap[filter];
      });

      const element = get(elementFilterAtom).some(filter => {
        return memoria.element === elementFilterMap[filter];
      });

      const label = get(labelFilterAtom).every(filter => {
        return memoria.labels.includes(filter);
      });

      const skill = parseSkill(memoria.skill.name, memoria.skill.description);

      const basicStatus = get(basicStatusFilterAtom).every(filter => {
        return skill.effects.some(x => {
          return (
            x.status === filter.status &&
            (filter.upDown === 'UP' ? x.type === 'buff' : x.type === 'debuff')
          );
        });
      });

      const elementStatus = get(elementStatusFilterAtom).every(filter => {
        return skill.effects.some(x => {
          return (
            x.status === filter.status &&
            (filter.upDown === 'UP' ? x.type === 'buff' : x.type === 'debuff')
          );
        });
      });

      const otherSkill = get(otherSkillFilterAtom).every(filter => {
        if (
          filter === 'Meteor' ||
          filter === 'ANiMA' ||
          filter === 'Barrier' ||
          filter === 'Eden'
        ) {
          return skill.effects.some(x => x.stack === filter);
        }
        return skill.kinds?.some(x => {
          return typeof x === 'string' && typeof filter === 'string'
            ? x === filter
            : typeof x !== 'string' && typeof filter !== 'string'
              ? x.element === filter.element && x.kind === filter.kind
              : false;
        });
      });

      const support = parseSupport(
        memoria.support.name,
        memoria.support.description,
      );

      const vanguardSupport = get(vanguardSupportFilterAtom).every(filter => {
        if (typeof filter === 'string') {
          return support.effects.some(x => x.type === filter);
        }
        return support.effects.some(x => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const assistSupport = get(assistSupportFilterAtom).every(filter => {
        if (typeof filter === 'string') {
          return support.effects.some(x => x.type === filter);
        }
        return support.effects.some(x => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const recoverySupport = get(recoverySupportFilterAtom).every(filter => {
        if (typeof filter === 'string') {
          return support.effects.some(x => x.type === filter);
        }
        return support.effects.some(x => {
          return x.status === filter.status && x.type === filter.upDown;
        });
      });

      const otherSupport = get(otherSupportFilterAtom).every(filter => {
        return support.effects.some(x => {
          return x.type === filter;
        });
      });

      return (
        sw &&
        role &&
        element &&
        label &&
        basicStatus &&
        elementStatus &&
        otherSkill &&
        vanguardSupport &&
        assistSupport &&
        recoverySupport &&
        otherSupport &&
        !get(rwDeckAtom).some(({ name }) => memoria.name === name) &&
        !get(rwLegendaryDeckAtom).some(({ name }) => memoria.name === name)
      );
    })
    .sort((a, b) => {
      return match(get(sortKindAtom))
        .with('ID', () => b.id - a.id)
        .with('NAME', () => a.name.localeCompare(b.name))
        .with('ATK', () => b.status[4][0] - a.status[4][0])
        .with('Sp.ATK', () => b.status[4][1] - a.status[4][1])
        .with('DEF', () => b.status[4][2] - b.status[4][1])
        .with('Sp.DEF', () => b.status[4][3] - b.status[4][3])
        .with(
          'ATK+Sp.ATK',
          () =>
            b.status[4][0] + b.status[4][1] - (a.status[4][0] + a.status[4][1]),
        )
        .with(
          'DEF+Sp.DEF',
          () =>
            b.status[4][2] + b.status[4][3] - (a.status[4][2] + a.status[4][3]),
        )
        .exhaustive();
    });
});
