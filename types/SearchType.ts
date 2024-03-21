import {
  Elemental,
  ElementalKind,
  elementalKind,
  Elements,
  elements,
} from '@/parser/skill';

import { match } from 'ts-pattern';

export const labelSearch = ['legendary', 'ultimate'] as const;
export type LabelSearch = (typeof labelSearch)[number];
export const basicStatus = ['ATK', 'DEF', 'Sp.ATK', 'Sp.DEF', 'Life'] as const;
export type BasicStatus = (typeof basicStatus)[number];
export const elementStatus = [
  'Fire ATK',
  'Fire DEF',
  'Water ATK',
  'Water DEF',
  'Wind ATK',
  'Wind DEF',
  'Light ATK',
  'Light DEF',
  'Dark ATK',
  'Dark DEF',
] as const;
export type ElementStatus = (typeof elementStatus)[number];
export type BasicStatusSearch = { status: BasicStatus; upDown: 'UP' | 'DOWN' };
export type ElementStatusSearch = {
  status: ElementStatus;
  upDown: 'UP' | 'DOWN';
};

export function allBasicStatusSearch(): BasicStatusSearch[] {
  return basicStatus.flatMap((status) => {
    return ['UP', 'DOWN']
      .map((upDown) => {
        return { status, upDown: upDown as 'UP' | 'DOWN' };
      })
      .filter((v) => v.status !== 'Life' || v.upDown === 'UP');
  });
}

export function allElementStatusSearch(): ElementStatusSearch[] {
  return elementStatus.flatMap((status) => {
    return ['UP', 'DOWN'].map((upDown) => {
      return { status, upDown: upDown as 'UP' | 'DOWN' };
    });
  });
}

export type OtherSkillSearch = 'charge' | 'counter' | 'heal' | Elemental;
export type ElementalSkillPattern =
  `${Elemental['element']}/${Elemental['kind']}`;
export function intoElementalSkillPattern({
  element,
  kind,
}: Elemental): ElementalSkillPattern {
  return `${element}/${kind}`;
}
export function elementalSkillPatternToJapanese(
  pattern: ElementalSkillPattern,
) {
  const [element, kind] = pattern.split('/');
  const first = match(element as unknown as Elements)
    .with('Fire', () => '火')
    .with('Water', () => '水')
    .with('Wind', () => '風')
    .with('Light', () => '光')
    .with('Dark', () => '闇')
    .exhaustive();
  const second = match(kind as unknown as ElementalKind)
    .with('Stimulation', () => ':')
    .with('Spread', () => '拡:')
    .with('Strengthen', () => '強:')
    .with('Weaken', () => '弱:')
    .exhaustive();
  return `${first}${second}`;
}

export function allOtherSkillSearch(): OtherSkillSearch[] {
  return [
    'charge',
    'counter',
    'heal',
    ...elementalKind.flatMap((kind) =>
      elements.map((element) => ({ kind, element })),
    ),
  ];
}

export type VanguardSupportSearch =
  | 'NormalMatchPtUp'
  | 'SpecialMatchPtUp'
  | 'DamageUp'
  | BasicStatusSearch
  | ElementStatusSearch;

export function allVanguardSupportSearch(): VanguardSupportSearch[] {
  return [
    'NormalMatchPtUp',
    'SpecialMatchPtUp',
    'DamageUp',
    ...allBasicStatusSearch(),
    ...allElementStatusSearch(),
  ];
}

export type AssistSupportSearch =
  | 'SupportUp'
  | BasicStatusSearch
  | ElementStatusSearch;

export function allAssistSupportSearch(): AssistSupportSearch[] {
  return ['SupportUp', ...allBasicStatusSearch(), ...allElementStatusSearch()];
}

export type RecoverySupportSearch =
  | 'RecoveryUp'
  | BasicStatusSearch
  | ElementStatusSearch;

export function allRecoverySupportSearch(): RecoverySupportSearch[] {
  return ['RecoveryUp', ...allBasicStatusSearch(), ...allElementStatusSearch()];
}

export const otherSupportSearch = ['MpCostDown', 'RangeUp'] as const;
export type OtherSupportSearch = (typeof otherSupportSearch)[number];
