'use client';

import React, { useState } from 'react';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import {
  Autocomplete,
  Card,
  CardContent,
  CardMedia,
  Stack,
  TextField,
} from '@mui/material';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { Charm, charmList } from '@/domain/charm/charm';
import { Costume, costumeList } from '@/domain/costume/costume';
import { evaluate } from '@/evaluate/evaluate';
import { deckAtom, legendaryDeckAtom, swAtom } from '@/jotai/memoriaAtoms';
import { statusKind, StatusKind } from '@/parser/skill';

const defAtom = atomWithStorage('def', 400_000);
const spDefAtom = atomWithStorage('spDef', 400_000);
const statusAtom = atomWithStorage('status', [
  400_000, 400_000, 400_000, 400_000,
] as [number, number, number, number]);

export function Calculator() {
  const [deck] = useAtom(deckAtom);
  const [legendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw] = useAtom(swAtom);
  const [charm, setCharm] = useState<Charm>(charmList.reverse()[0]);
  const [costume, setCostume] = useState<Costume>(costumeList.reverse()[0]);
  const [def, setDef] = useAtom(defAtom);
  const [spDef, setSpDef] = useAtom(spDefAtom);
  const [selfStatus, setSelfStatus] = useAtom(statusAtom);

  const { skill, supportBuff, supportDebuff } = evaluate(
    [...deck, ...legendaryDeck],
    selfStatus,
    [def, spDef],
    charm,
    costume,
  );

  const expectedToalDamage = skill
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalBuff = skill
    .map(({ expected }) => expected.buff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) return acc;
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
      if (!cur) return acc;
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

  Object.entries(supportBuff)
    .filter(([, amount]) => !!amount)
    .forEach(([type, amount]) => {
      expectedTotalBuff.set(
        type as StatusKind,
        (expectedTotalBuff.get(type as StatusKind) || 0) +
          amount * [...deck, ...legendaryDeck].length,
      );
    });
  Object.entries(supportDebuff)
    .filter(([, amount]) => !!amount)
    .forEach(([type, amount]) => {
      expectedTotalDebuff.set(
        type as StatusKind,
        (expectedTotalDebuff.get(type as StatusKind) || 0) +
          amount * [...deck, ...legendaryDeck].length,
      );
    });

  const displayBuff = ({
    type,
    amount,
  }: {
    type: StatusKind;
    amount: number;
  }) => {
    return `${type}/UP: ${amount}`;
  };
  const displayDebuff = ({
    type,
    amount,
  }: {
    type: StatusKind;
    amount: number;
  }) => {
    return `${type}/DOWN: ${amount}`;
  };

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            disablePortal
            options={charmList.map((charm) => charm.name)}
            renderInput={(params) => <TextField {...params} label="charm" />}
            onChange={(_, value) => {
              if (value) {
                setCharm(charmList.find((charm) => charm.name === value)!);
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            disablePortal
            options={costumeList.map(
              (costume) => `${costume.lily}/${costume.name}`,
            )}
            renderInput={(params) => <TextField {...params} label="costume" />}
            onChange={(_, value) => {
              if (value) {
                setCostume(
                  costumeList.find(
                    (costume) => `${costume.lily}/${costume.name}` === value,
                  )!,
                );
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Stack direction={'row'} spacing={2}>
            <TextField
              label="Your ATK"
              defaultValue={selfStatus[0]}
              variant="standard"
              onChange={(e) => {
                setSelfStatus([
                  parseInt(e.target.value),
                  selfStatus[1],
                  selfStatus[2],
                  selfStatus[3],
                ]);
              }}
            />
            <TextField
              label="Your Sp.ATK"
              defaultValue={selfStatus[1]}
              variant="standard"
              onChange={(e) => {
                setSelfStatus([
                  selfStatus[0],
                  parseInt(e.target.value),
                  selfStatus[2],
                  selfStatus[3],
                ]);
              }}
            />
            <TextField
              label="Your DEF"
              defaultValue={selfStatus[2]}
              variant="standard"
              onChange={(e) => {
                setSelfStatus([
                  selfStatus[0],
                  selfStatus[1],
                  parseInt(e.target.value),
                  selfStatus[3],
                ]);
              }}
            />
            <TextField
              label="Your Sp.DEF"
              defaultValue={selfStatus[3]}
              variant="standard"
              onChange={(e) => {
                setSelfStatus([
                  selfStatus[0],
                  selfStatus[1],
                  selfStatus[2],
                  parseInt(e.target.value),
                ]);
              }}
            />
          </Stack>
        </Grid>
        {sw === 'sword' && (
          <>
            <Grid item xs={12}>
              <Stack direction={'row'} spacing={2}>
                <TextField
                  label="Opponent's DEF"
                  defaultValue={def}
                  variant="standard"
                  onChange={(e) => {
                    setDef(parseInt(e.target.value));
                  }}
                />
                <TextField
                  label="Opponent's Sp.DEF"
                  defaultValue={spDef}
                  variant="standard"
                  onChange={(e) => {
                    setSpDef(parseInt(e.target.value));
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
            <Typography variant="body1">{`ダメージ量: ${expectedToalDamage}`}</Typography>
          </Grid>
        ) : (
          <>
            <Grid item xs={6}>
              <Typography variant="body1">{`総合回復量: ${expectedTotalRecovery}`}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">{`平均回復量: ${Math.floor(expectedTotalRecovery / [...deck, ...legendaryDeck].length)}`}</Typography>
            </Grid>
          </>
        )}
        <Grid container item xs={12} spacing={2}>
          <Grid item key={'buff'}>
            <Typography>{'バフ量:'}</Typography>
          </Grid>
          {statusKind
            .filter((kind) => expectedTotalBuff.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid item key={kind}>
                  <Typography variant="body1" color={'darkred'}>
                    {`${kind}/UP: ${expectedTotalBuff.get(kind)!}`}
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
            .filter((kind) => expectedTotalDebuff.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid item key={kind}>
                  <Typography variant="body1" color={'darkblue'}>
                    {`${kind}/DOWN: ${expectedTotalDebuff.get(kind)!}`}
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
                  component="img"
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
                    <Typography variant="body2">{`damage: ${expected.damage}`}</Typography>
                  ) : (
                    <></>
                  )}
                  {expected.recovery ? (
                    <Typography variant="body2">{`recovery: ${expected.recovery}`}</Typography>
                  ) : (
                    <></>
                  )}
                  {expected.buff ? (
                    <>
                      {expected.buff.map((buff) => {
                        return (
                          <Typography
                            key={buff.type}
                            variant="body2"
                            color={'darkred'}
                          >
                            {displayBuff(buff)}
                          </Typography>
                        );
                      })}
                    </>
                  ) : (
                    <></>
                  )}
                  {expected.debuff ? (
                    <>
                      {expected.debuff.map((debuff) => {
                        return (
                          <Typography
                            key={debuff.type}
                            variant="body2"
                            color={'darkblue'}
                          >
                            {displayDebuff(debuff)}
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
