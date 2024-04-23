'use client';

import { charmList } from '@/domain/charm/charm';
import { costumeList } from '@/domain/costume/costume';
import { calcFinalStatus } from '@/evaluate/calc';
import { evaluate } from '@/evaluate/evaluate';
import {
  adLevelAtom,
  charmAtom,
  costumeAtom,
  defAtom,
  rwDeckAtom,
  rwLegendaryDeckAtom,
  spDefAtom,
  statusAtom,
  swAtom,
} from '@/jotai/memoriaAtoms';
import { type StatusKind, statusKind } from '@/parser/skill';
import {
  Unstable_NumberInput as BaseNumberInput,
  type NumberInputProps,
  numberInputClasses,
} from '@mui/base/Unstable_NumberInput';
import {
  Autocomplete,
  Card,
  CardContent,
  CardMedia,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  darken,
  lighten,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { type ForwardedRef, forwardRef } from 'react';

const NumberInput = forwardRef(function CustomNumberInput(
  props: NumberInputProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseNumberInput
      slots={{
        root: StyledInputRoot,
        input: StyledInputElement,
        incrementButton: StyledButton,
        decrementButton: StyledButton,
      }}
      slotProps={{
        incrementButton: {
          children: '▴',
        },
        decrementButton: {
          children: '▾',
        },
      }}
      {...props}
      ref={ref}
    />
  );
});

const charmFilterAtom = atomWithStorage<('火' | '水' | '風')[]>(
  'charmFilter',
  [],
);
const costumeFilterOptions = [
  'AD',
  '火',
  '水',
  '風',
  '通単',
  '通範',
  '特単',
  '特範',
  '支援',
  '妨害',
  '回復',
  '通常衣装',
  '特殊衣装',
] as const;
const costumeFilterAtom = atomWithStorage<
  (typeof costumeFilterOptions)[number][]
>('costumeFilter', []);

export function Calculator() {
  const theme = useTheme();
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [sw] = useAtom(swAtom);
  const [charm, setCharm] = useAtom(charmAtom);
  const [costume, setCostume] = useAtom(costumeAtom);
  const [def, setDef] = useAtom(defAtom);
  const [spDef, setSpDef] = useAtom(spDefAtom);
  const [selfStatus, setSelfStatus] = useAtom(statusAtom);
  const [charmFilter, setCharmFilter] = useAtom(charmFilterAtom);
  const [costumeFilter, setCostumeFilter] = useAtom(costumeFilterAtom);
  const [adLevel, setAdLevel] = useAtom(adLevelAtom);

  const finalStatus = calcFinalStatus(
    [...deck, ...legendaryDeck],
    selfStatus,
    charm,
    costume,
  );

  const { skill, supportBuff, supportDebuff } = evaluate(
    [...deck, ...legendaryDeck],
    finalStatus,
    [def, spDef],
    charm,
    costume,
    adLevel,
  );

  const expectedToalDamage = skill
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalBuff = skill
    .map(({ expected }) => expected.buff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());
  const expectedTotalDebuff = skill
    .map(({ expected }) => expected.debuff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());
  const expectedTotalRecovery = skill
    .map(({ expected }) => expected.recovery)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);

  for (const [type, amount] of Object.entries(supportBuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalBuff.set(
      type as StatusKind,
      (expectedTotalBuff.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  for (const [type, amount] of Object.entries(supportDebuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalDebuff.set(
      type as StatusKind,
      (expectedTotalDebuff.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  const display = ({
    upDown,
    type,
    amount,
  }: {
    upDown: 'UP' | 'DOWN';
    type: StatusKind;
    amount: number;
  }) => {
    return `${type}/${upDown}: ${amount}`;
  };
  const charmOptions = charmList
    .filter(charm => {
      if (charmFilter.length === 0) {
        return true;
      }
      return charmFilter.every(elem => charm.ability.includes(elem));
    })
    .map(charm => ({
      title: charm.name,
      ability: charm.ability,
    }));
  const costumeOptions = costumeList
    .filter(costume => {
      if (!(costume.ex || costume.adx)) {
        return false;
      }
      if (costumeFilter.length === 0) {
        return true;
      }
      return costumeFilter.every(option =>
        option === 'AD'
          ? costume.adx !== undefined && costume.adx !== null
          : option === '通常衣装'
            ? costume.status[0] > costume.status[1]
            : option === '特殊衣装'
              ? costume.status[0] < costume.status[1]
              : option === '火' || option === '水' || option === '風'
                ? costume.ex?.description.includes(option) ||
                  costume.adx
                    ?.flatMap(ad => ad)
                    .some(({ name }) => name.includes(`${option}属性効果増加`))
                : costume.type.includes(option),
      );
    })
    .map(costume => ({
      title: `${costume.lily}/${costume.name}`,
      ex: costume.ex || costume.adx?.[3][0],
    }));

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormGroup sx={{ flexDirection: 'row', height: 56 }}>
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label='火'
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, '火']);
                } else {
                  setCharmFilter(charmFilter.filter(elem => elem !== '火'));
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label='水'
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, '水']);
                } else {
                  setCharmFilter(charmFilter.filter(elem => elem !== '水'));
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label='風'
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, '風']);
                } else {
                  setCharmFilter(charmFilter.filter(elem => elem !== '風'));
                }
              }}
            />
          </FormGroup>
          <Autocomplete
            disablePortal
            options={charmOptions.sort((a, b) =>
              a.ability.localeCompare(b.ability),
            )}
            groupBy={option => option.ability}
            getOptionLabel={option => option.title}
            renderInput={params => <TextField {...params} label='charm' />}
            renderGroup={params => (
              <li key={params.key}>
                <GroupHeader>{params.group}</GroupHeader>
                <GroupItems>{params.children}</GroupItems>
              </li>
            )}
            onChange={(_, value) => {
              if (value) {
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                setCharm(charmList.find(charm => charm.name === value.title)!);
              }
            }}
            sx={{ marginTop: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            renderInput={params => <TextField {...params} label='衣装検索' />}
            options={costumeFilterOptions}
            multiple
            onChange={(_, value) => {
              setCostumeFilter(
                value as (typeof costumeFilterOptions)[number][],
              );
            }}
          />
          <Autocomplete
            options={costumeOptions.sort((a, b) =>
              a.ex?.name && b.ex?.name
                ? a.ex.name.localeCompare(b.ex.name)
                : a.title.localeCompare(b.title),
            )}
            groupBy={option => option.ex?.name || 'その他'}
            getOptionLabel={option => option.title}
            renderInput={params => <TextField {...params} label='costume' />}
            renderGroup={params => (
              <li key={params.key}>
                <GroupHeader>{params.group}</GroupHeader>
                <GroupItems>{params.children}</GroupItems>
              </li>
            )}
            onChange={(_, value) => {
              if (value) {
                setCostume(
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  costumeList.find(
                    costume =>
                      `${costume.lily}/${costume.name}` === value.title,
                  )!,
                );
              }
            }}
            sx={{ marginTop: 2 }}
          />
          {costume?.adx && (
            <NumberInput
              defaultValue={adLevel}
              min={0}
              max={3}
              onChange={(_, val) => setAdLevel(val || 0)}
            />
          )}
        </Grid>
        <Grid item xs={12}>
          <Stack direction={'row'} spacing={2}>
            <Stack>
              <TextField
                label='Your ATK'
                defaultValue={selfStatus[0]}
                variant='standard'
                onChange={e => {
                  setSelfStatus([
                    Number.parseInt(e.target.value),
                    selfStatus[1],
                    selfStatus[2],
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[0]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label='Your Sp.ATK'
                defaultValue={selfStatus[1]}
                variant='standard'
                onChange={e => {
                  setSelfStatus([
                    selfStatus[0],
                    Number.parseInt(e.target.value),
                    selfStatus[2],
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[1]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label='Your DEF'
                defaultValue={selfStatus[2]}
                variant='standard'
                onChange={e => {
                  setSelfStatus([
                    selfStatus[0],
                    selfStatus[1],
                    Number.parseInt(e.target.value),
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[2]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label='Your Sp.DEF'
                defaultValue={selfStatus[3]}
                variant='standard'
                onChange={e => {
                  setSelfStatus([
                    selfStatus[0],
                    selfStatus[1],
                    selfStatus[2],
                    Number.parseInt(e.target.value),
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[3]}`}</Typography>
            </Stack>
          </Stack>
        </Grid>
        {sw === 'sword' && (
          <>
            <Grid item xs={12}>
              <Stack direction={'row'} spacing={2}>
                <TextField
                  label="Opponent's DEF"
                  defaultValue={def}
                  variant='standard'
                  onChange={e => {
                    setDef(Number.parseInt(e.target.value));
                  }}
                />
                <TextField
                  label="Opponent's Sp.DEF"
                  defaultValue={spDef}
                  variant='standard'
                  onChange={e => {
                    setSpDef(Number.parseInt(e.target.value));
                  }}
                />
              </Stack>
            </Grid>
          </>
        )}
      </Grid>
      <Divider sx={{ margin: 2 }}>{'期待値'}</Divider>
      <Grid container spacing={2} direction={'row'}>
        {sw === 'sword' ? (
          <Grid item xs={12}>
            <Typography variant='body1'>{`ダメージ量: ${expectedToalDamage}`}</Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={6}>
              <Typography variant='body1'>{`総合回復量: ${expectedTotalRecovery}`}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant='body1'>{`平均回復量: ${Math.floor(
                expectedTotalRecovery / [...deck, ...legendaryDeck].length,
              )}`}</Typography>
            </Grid>
          </>
        )}
        <Grid container item xs={12} spacing={2}>
          <Grid item key={'buff'}>
            <Typography>{'バフ量:'}</Typography>
          </Grid>
          {statusKind
            .filter(kind => expectedTotalBuff.get(kind) !== undefined)
            .map(kind => {
              return (
                <Grid item key={kind}>
                  <Typography
                    variant='body1'
                    color={theme.palette.mode === 'light' ? 'darkred' : 'pink'}
                  >
                    {`${kind}/UP: ${
                      // biome-ignore lint/style/noNonNullAssertion: <explanation>
                      expectedTotalBuff.get(kind)!
                    }`}
                  </Typography>
                </Grid>
              );
            })}
        </Grid>
        <Grid container item xs={12} spacing={2}>
          <Grid item key={'debuff'}>
            <Typography>{'デバフ量:'}</Typography>
          </Grid>
          {statusKind
            .filter(kind => expectedTotalDebuff.get(kind) !== undefined)
            .map(kind => {
              return (
                <Grid item key={kind}>
                  <Typography
                    variant='body1'
                    color={
                      theme.palette.mode === 'light' ? 'darkblue' : 'turquoise'
                    }
                  >
                    {`${kind}/DOWN: ${
                      // biome-ignore lint/style/noNonNullAssertion: <explanation>
                      expectedTotalDebuff.get(kind)!
                    }`}
                  </Typography>
                </Grid>
              );
            })}
        </Grid>
      </Grid>
      <Divider sx={{ margin: 2 }}>{'詳細'}</Divider>
      <Grid container spacing={2}>
        {skill.map(({ memoria, expected }) => {
          return (
            <Grid item key={memoria.id} xs={12} md={6}>
              <Card sx={{ display: 'flex' }}>
                <CardMedia
                  component='img'
                  sx={{ width: 100, height: 100 }}
                  image={`/memoria/${memoria.name}.png`}
                  alt={memoria.name}
                />
                <CardContent
                  sx={{
                    flex: '1 0 auto',
                  }}
                >
                  {expected.damage ? (
                    <Typography variant='body2'>{`damage: ${expected.damage}`}</Typography>
                  ) : (
                    <></>
                  )}
                  {expected.recovery ? (
                    <Typography variant='body2'>{`recovery: ${expected.recovery}`}</Typography>
                  ) : (
                    <></>
                  )}
                  {expected.buff ? (
                    <>
                      {expected.buff.map(buff => {
                        return (
                          <Typography
                            key={buff.type}
                            variant='body2'
                            color={
                              theme.palette.mode === 'light'
                                ? 'darkred'
                                : 'pink'
                            }
                          >
                            {display({ ...buff, upDown: 'UP' })}
                          </Typography>
                        );
                      })}
                    </>
                  ) : (
                    <></>
                  )}
                  {expected.debuff ? (
                    <>
                      {expected.debuff.map(debuff => {
                        return (
                          <Typography
                            key={debuff.type}
                            variant='body2'
                            color={
                              theme.palette.mode === 'light'
                                ? 'darkblue'
                                : 'turquoise'
                            }
                          >
                            {display({ ...debuff, upDown: 'DOWN' })}
                          </Typography>
                        );
                      })}
                    </>
                  ) : (
                    <></>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

const GroupHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: '-8px',
  padding: '4px 10px',
  color: theme.palette.primary.main,
  backgroundColor:
    theme.palette.mode === 'light'
      ? lighten(theme.palette.primary.light, 0.85)
      : darken(theme.palette.primary.main, 0.8),
}));

const GroupItems = styled('ul')({
  padding: 0,
});

const blue = {
  100: '#DAECFF',
  200: '#80BFFF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0px 2px 2px ${
    theme.palette.mode === 'dark' ? grey[900] : grey[50]
  };
  display: grid;
  grid-template-columns: 1fr 19px;
  grid-template-rows: 1fr 1fr;
  overflow: hidden;
  column-gap: 8px;
  padding: 4px;

  &.${numberInputClasses.focused} {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${
      theme.palette.mode === 'dark' ? blue[600] : blue[200]
    };
  }

  &:hover {
    border-color: ${blue[400]};
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`,
);

const StyledInputElement = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.5;
  grid-column: 1/2;
  grid-row: 1/3;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: inherit;
  border: none;
  border-radius: inherit;
  padding: 8px 12px;
  outline: 0;
`,
);

const StyledButton = styled('button')(
  ({ theme }) => `
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  appearance: none;
  padding: 0;
  width: 19px;
  height: 19px;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1;
  box-sizing: border-box;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 0;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    cursor: pointer;
  }

  &.${numberInputClasses.incrementButton} {
    grid-column: 2/3;
    grid-row: 1/2;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border: 1px solid;
    border-bottom: 0;
    &:hover {
      cursor: pointer;
      background: ${blue[400]};
      color: ${grey[50]};
    }

  border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  }

  &.${numberInputClasses.decrementButton} {
    grid-column: 2/3;
    grid-row: 2/3;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border: 1px solid;
    &:hover {
      cursor: pointer;
      background: ${blue[400]};
      color: ${grey[50]};
    }

  border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  }
  & .arrow {
    transform: translateY(-1px);
  }
`,
);
