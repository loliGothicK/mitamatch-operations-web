import { Lens } from 'monocle-ts';
import type { Memoria } from '@/domain/memoria/memoria';

const memoriaLens = {
  id: Lens.fromPath<Memoria>()(['id']),
  shortName: Lens.fromPath<Memoria>()(['name', 'short']),
  fullName: Lens.fromPath<Memoria>()(['name', 'full']),
  kind: Lens.fromPath<Memoria>()(['cardType']),
  element: Lens.fromPath<Memoria>()(['attribute']),
  status: Lens.fromPath<Memoria>()(['status']),
  cost: Lens.fromPath<Memoria>()(['cost']),
  labels: Lens.fromPath<Memoria>()(['labels']),
  skill: Lens.fromPath<Memoria>()(['skills', 'gvgSkill']),
  support: Lens.fromPath<Memoria>()(['skills', 'autoSkill']),
  legendary: Lens.fromPath<Memoria>()(['skills', 'legendary']),
};

const gvgSkillLens = {
  name: Lens.fromPath<Memoria>()(['skills', 'gvgSkill', 'raw', 'name']),
  description: Lens.fromPath<Memoria>()([
    'skills',
    'gvgSkill',
    'raw',
    'description',
  ]),
  effects: Lens.fromPath<Memoria>()(['skills', 'gvgSkill', 'effects']),
  kinds: Lens.fromPath<Memoria>()(['skills', 'gvgSkill', 'kinds']),
};

const supportLens = {
  name: Lens.fromPath<Memoria>()(['skills', 'autoSkill', 'raw', 'name']),
  description: Lens.fromPath<Memoria>()([
    'skills',
    'autoSkill',
    'raw',
    'description',
  ]),
  trigger: Lens.fromPath<Memoria>()(['skills', 'autoSkill', 'trigger']),
  probability: Lens.fromPath<Memoria>()(['skills', 'autoSkill', 'probability']),
  effects: Lens.fromPath<Memoria>()(['skills', 'autoSkill', 'effects']),
};

export const Lenz = {
  memoria: memoriaLens,
  gvgSkill: gvgSkillLens,
  autoSkill: supportLens,
};
