import { Lens } from 'monocle-ts';
import type { Memoria } from '@/domain/memoria/memoria';

const memoriaLens = {
  id: Lens.fromPath<Memoria>()(['id']),
  shortName: Lens.fromPath<Memoria>()(['name', 'short']),
  fullName: Lens.fromPath<Memoria>()(['name', 'full']),
  link: Lens.fromPath<Memoria>()(['name', 'link']),
  kind: Lens.fromPath<Memoria>()(['kind']),
  element: Lens.fromPath<Memoria>()(['element']),
  status: Lens.fromPath<Memoria>()(['status']),
  cost: Lens.fromPath<Memoria>()(['cost']),
  labels: Lens.fromPath<Memoria>()(['labels']),
  skill: Lens.fromPath<Memoria>()(['skills', 'skill']),
  support: Lens.fromPath<Memoria>()(['skills', 'support']),
  legendary: Lens.fromPath<Memoria>()(['skills', 'legendary']),
};

const skillLens = {
  name: Lens.fromPath<Memoria>()(['skills', 'skill', 'raw', 'name']),
  description: Lens.fromPath<Memoria>()([
    'skills',
    'skill',
    'raw',
    'description',
  ]),
  effects: Lens.fromPath<Memoria>()(['skills', 'skill', 'effects']),
  kinds: Lens.fromPath<Memoria>()(['skills', 'skill', 'kinds']),
};

const supportLens = {
  name: Lens.fromPath<Memoria>()(['skills', 'support', 'raw', 'name']),
  description: Lens.fromPath<Memoria>()([
    'skills',
    'support',
    'raw',
    'description',
  ]),
  trigger: Lens.fromPath<Memoria>()(['skills', 'support', 'trigger']),
  probability: Lens.fromPath<Memoria>()(['skills', 'support', 'probability']),
  effects: Lens.fromPath<Memoria>()(['skills', 'support', 'effects']),
};

export const Lenz = {
  memoria: memoriaLens,
  skill: skillLens,
  support: supportLens,
};
