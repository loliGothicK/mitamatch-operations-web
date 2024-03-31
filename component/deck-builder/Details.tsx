'use client';

import { useAtom } from 'jotai';

import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { Memoria } from '@/domain/memoria/memoria';
import { deckAtom, legendaryDeckAtom } from '@/jotai/memoriaAtoms';
import { parse_skill, StatusKind, statusKind } from '@/parser/skill';
import { parse_support, SupportKind } from '@/parser/support';
import { elementFilter, elementFilterMap } from '@/types/FilterType';

import { Lens } from 'monocle-ts';
import { match } from 'ts-pattern';

type UpDown = 'UP' | 'DOWN';
type StatusPattern = `${StatusKind}/${UpDown}`;
const statusPattern: StatusPattern[] = statusKind.flatMap((s) => {
  return [`${s}/UP`, `${s}/DOWN`] as StatusPattern[];
});

export function intoStatusPattern({
  status,
  upDown,
}: {
  status: StatusKind;
  upDown: UpDown;
}): StatusPattern {
  return `${status}/${upDown}` as StatusPattern;
}

export function statusPatternToJapanese(pattern: StatusPattern): string {
  const [status, upDown] = pattern.split('/') as [StatusKind, UpDown];
  return match(status)
    .with('ATK', () => `攻${upDown}`)
    .with('DEF', () => `防${upDown}`)
    .with('Sp.ATK', () => `特攻${upDown}`)
    .with('Sp.DEF', () => `特防${upDown}`)
    .with('Life', () => `HP${upDown}`)
    .with('Fire ATK', () => `火攻${upDown}`)
    .with('Fire DEF', () => `火防${upDown}`)
    .with('Water ATK', () => `水攻${upDown}`)
    .with('Water DEF', () => `水防${upDown}`)
    .with('Wind ATK', () => `風攻${upDown}`)
    .with('Wind DEF', () => `風防${upDown}`)
    .with('Light ATK', () => `光攻${upDown}`)
    .with('Light DEF', () => `光防${upDown}`)
    .with('Dark ATK', () => `闇攻${upDown}`)
    .with('Dark DEF', () => `闇防${upDown}`)
    .exhaustive();
}

type SupportPattern =
  | `${Exclude<
      StatusKind,
      'Life' | 'Light ATK' | 'Light DEF' | 'Dark ATK' | 'Dark DEF'
    >}/${UpDown}`
  | 'DamageUp'
  | 'SupportUp'
  | 'RecoveryUp'
  | 'MatchPtUp'
  | 'MpCostDown'
  | 'RangeUp';
const supportPattern: SupportPattern[] = [
  'DamageUp',
  'SupportUp',
  'RecoveryUp',
  'MatchPtUp',
  'MpCostDown',
  'RangeUp',
  ...[
    'ATK',
    'DEF',
    'Sp.ATK',
    'Sp.DEF',
    'Fire ATK',
    'Fire DEF',
    'Water ATK',
    'Water DEF',
    'Wind ATK',
    'Wind DEF',
  ].flatMap((s) => {
    return [`${s}/UP`, `${s}/DOWN`] as SupportPattern[];
  }),
] as const;

export function supportPatternToJapanese(pattern: SupportPattern): string {
  return match(pattern)
    .with('ATK/UP', () => `攻UP`)
    .with('DEF/UP', () => `防UP`)
    .with('Sp.ATK/UP', () => `特攻UP`)
    .with('Sp.DEF/UP', () => `特防UP`)
    .with('ATK/DOWN', () => `攻DOWN`)
    .with('DEF/DOWN', () => `防DOWN`)
    .with('Sp.ATK/DOWN', () => `特攻DOWN`)
    .with('Sp.DEF/DOWN', () => `特防DOWN`)
    .with('Fire ATK/UP', () => `火攻UP`)
    .with('Fire DEF/UP', () => `火防UP`)
    .with('Water ATK/UP', () => `水攻UP`)
    .with('Water DEF/UP', () => `水防UP`)
    .with('Wind ATK/UP', () => `風攻UP`)
    .with('Wind DEF/UP', () => `風防UP`)
    .with('Fire ATK/DOWN', () => `火攻DOWN`)
    .with('Fire DEF/DOWN', () => `火防DOWN`)
    .with('Water ATK/DOWN', () => `水攻DOWN`)
    .with('Water DEF/DOWN', () => `水防DOWN`)
    .with('Wind ATK/DOWN', () => `風攻DOWN`)
    .with('Wind DEF/DOWN', () => `風防DOWN`)
    .with('DamageUp', () => 'ダメージUP')
    .with('SupportUp', () => '支援UP')
    .with('RecoveryUp', () => '回復UP')
    .with('MatchPtUp', () => 'PtUP')
    .with('MpCostDown', () => 'MP')
    .with('RangeUp', () => '範囲+1')
    .exhaustive();
}

export function intoSupportPattern(kind: SupportKind): SupportPattern {
  return match(kind.type)
    .with('DamageUp', () => 'DamageUp')
    .with('SupportUp', () => 'SupportUp')
    .with('RecoveryUp', () => 'RecoveryUp')
    .with('MatchPtUp', () => 'MatchPtUp')
    .with('MpCostDown', () => 'MpCostDown')
    .with('RangeUp', () => 'RangeUp')
    .with('UP', () => intoStatusPattern({ status: kind.status!, upDown: 'UP' }))
    .with('DOWN', () =>
      intoStatusPattern({ status: kind.status!, upDown: 'DOWN' }),
    )
    .exhaustive() as SupportPattern;
}

export default function Details() {
  const [deck] = useAtom(deckAtom);
  const [legendaryDeck] = useAtom(legendaryDeckAtom);

  const skillName = Lens.fromPath<Memoria>()(['skill', 'name']);
  const skillDescription = Lens.fromPath<Memoria>()(['skill', 'description']);
  const supportName = Lens.fromPath<Memoria>()(['support', 'name']);
  const supportDescription = Lens.fromPath<Memoria>()([
    'support',
    'description',
  ]);

  const skills = [...deck, ...legendaryDeck].map((memoria) => {
    return parse_skill(skillName.get(memoria), skillDescription.get(memoria));
  });

  const skillAggregate = new Map<StatusPattern, number>();
  for (const pattern of skills.flatMap((skill) => {
    return skill.effects
      .filter((eff) => eff.status !== undefined)
      .map((eff) => {
        return intoStatusPattern({
          status: eff.status!,
          upDown: eff.type === 'buff' ? 'UP' : 'DOWN',
        });
      });
  })) {
    skillAggregate.set(pattern, (skillAggregate.get(pattern) || 0) + 1);
  }

  const supports = [...deck, ...legendaryDeck].map((memoria) => {
    return parse_support(
      supportName.get(memoria),
      supportDescription.get(memoria),
    );
  });

  const supportAggregate = new Map<SupportPattern, number>();
  for (const pattern of supports.flatMap((support) => {
    return support.effects.map((eff) => {
      return intoSupportPattern(eff);
    });
  })) {
    supportAggregate.set(pattern, (supportAggregate.get(pattern) || 0) + 1);
  }

  const elementAggregate = new Map<string, number>();
  for (const element of [...deck, ...legendaryDeck].map((memoria) => {
    return memoria.element;
  })) {
    elementAggregate.set(element, (elementAggregate.get(element) || 0) + 1);
  }

  const kindAggregate = new Map<string, number>();
  for (const kind of [...deck, ...legendaryDeck].map((memoria) => {
    return memoria.kind;
  })) {
    kindAggregate.set(kind, (kindAggregate.get(kind) || 0) + 1);
  }

  return (
    <Grid
      container
      spacing={2}
      alignItems={'left'}
      direction={'column'}
      sx={{ marginTop: 5 }}
    >
      <Typography variant="body1">スキル</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {skillAggregate.size == 0 ? (
          <></>
        ) : (
          statusPattern
            .filter((pattern) => skillAggregate.get(pattern) != undefined)
            .map((pattern, index) => {
              return (
                <Grid item xs={4} key={index}>
                  <Typography fontSize={10}>
                    {statusPatternToJapanese(pattern)} :{' '}
                    {skillAggregate.get(pattern)}
                  </Typography>
                </Grid>
              );
            })
        )}
      </Grid>
      <Typography variant="body1" marginTop={5}>
        補助スキル
      </Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {supportAggregate.size == 0 ? (
          <></>
        ) : (
          supportPattern
            .filter((pattern) => supportAggregate.get(pattern) != undefined)
            .map((pattern, index) => {
              return (
                <Grid item xs={4} key={index}>
                  <Typography fontSize={10}>
                    {supportPatternToJapanese(pattern)} :{' '}
                    {supportAggregate.get(pattern)}
                  </Typography>
                </Grid>
              );
            })
        )}
      </Grid>
      <Typography variant="body1" marginTop={5}>
        属性
      </Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {elementAggregate.size == 0 ? (
          <></>
        ) : (
          elementFilter
            .map((kind) => elementFilterMap[kind])
            .filter((kind) => elementAggregate.get(kind) != undefined)
            .map((kind) => {
              return (
                <Grid item xs={4} key={kind}>
                  <Typography fontSize={10}>
                    {kind} : {elementAggregate.get(kind)}
                  </Typography>
                </Grid>
              );
            })
        )}
      </Grid>
      <Typography variant="body1" marginTop={5}>
        内訳
      </Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid container spacing={1}>
        {kindAggregate.size == 0 ? (
          <></>
        ) : (
          [
            '通常単体',
            '通常範囲',
            '特殊単体',
            '特殊範囲',
            '支援',
            '妨害',
            '回復',
          ]
            .filter((kind) => kindAggregate.get(kind) != undefined)
            .map((kind) => {
              return (
                <Grid item xs={4} key={kind}>
                  <Typography fontSize={10}>
                    {kind} : {kindAggregate.get(kind)}
                  </Typography>
                </Grid>
              );
            })
        )}
      </Grid>
    </Grid>
  );
}
