'use client';

import { Layout } from '@/components/Layout';
import { type Memoria, memoriaList } from '@/domain/memoria/memoria';
import { costAtom } from '@/jotai/dataAtoms';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { axisClasses } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { useAtom } from 'jotai';
import Image from 'next/image';
import { useState } from 'react';
import { Lenz } from '@/domain/memoria/lens';
import { isBuffEffect, isDebuffEffect } from '@/parser/skill';

const chartSetting = {
  width: 500,
  height: 300,
  [`.${axisClasses.left} .${axisClasses.label}`]: {
    transform: 'translate(-20px, 0)',
  },
};

const valueFormatter = (value: number | null) => `${value}枚`;

function HealDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire DEF', 'Water DEF', 'Wind DEF'];
  const healDataset = [
    {
      id: 'fireHeal',
      normal: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '火防',
    },
    {
      id: 'waterHeal',
      normal: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '水防',
    },
    {
      id: 'windHeal',
      normal: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '回復' &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '風防',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属防回復'}</Typography>
        <BarChart
          dataset={healDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                m.kind === '回復' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'heal') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'DEF'),
            );
            const special = memoriaList.filter(
              m =>
                m.kind === '回復' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'heal') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'Sp.DEF'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                    key={Lenz.memoria.shortName.get(m)}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AssistDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const assistDataset = [
    {
      id: 'fireAssist',
      normal: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '支援' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '風攻',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属攻支援'}</Typography>
        <BarChart
          dataset={assistDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                m.kind === '支援' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
            );
            const special = memoriaList.filter(
              m =>
                m.kind === '支援' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'buff') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                    key={Lenz.memoria.shortName.get(m)}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function InterferenceDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const interferebceDataset = [
    {
      id: 'fireInterference',
      normal: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '妨害' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '風攻',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属攻妨害'}</Typography>
        <BarChart
          dataset={interferebceDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                m.kind === '妨害' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isDebuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isDebuffEffect(eff) && eff.status === 'ATK'),
            );
            const special = memoriaList.filter(
              m =>
                m.kind === '妨害' &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'debuff') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isDebuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.ATK'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                    key={Lenz.memoria.shortName.get(m)}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AttackDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const vanguardDataset = [
    {
      id: 'fireAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Fire ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Water ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Wind ATK') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
      ).length,
      month: '風攻',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属攻バフ'}</Typography>
        <BarChart
          dataset={vanguardDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'ATK'),
            );
            const special = memoriaList.filter(
              m =>
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isBuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isBuffEffect(eff) && eff.status === 'Sp.ATK'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                    key={Lenz.memoria.shortName.get(m)}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DefenseDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire DEF', 'Water DEF', 'Wind DEF'];
  const interferenceDataset = [
    {
      id: 'fireAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Fire DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Fire DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '火防',
    },
    {
      id: 'waterAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Water DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Water DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '水防',
    },
    {
      id: 'windAssist',
      normal: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Wind DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'DEF'),
      ).length,
      special: memoriaList.filter(
        m =>
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Wind DEF') &&
          Lenz.skill.effects
            .get(m)
            .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.DEF'),
      ).length,
      month: '風防',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属防デバ'}</Typography>
        <BarChart
          dataset={interferenceDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isDebuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isDebuffEffect(eff) && eff.status === 'DEF'),
            );
            const special = memoriaList.filter(
              m =>
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.effects
                  .get(m)
                  .some(
                    eff =>
                      isDebuffEffect(eff) && eff.status === map[id.dataIndex],
                  ) &&
                Lenz.skill.effects
                  .get(m)
                  .some(eff => isDebuffEffect(eff) && eff.status === 'Sp.DEF'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function CounterDataset() {
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['火', '水', '風'];
  const dataset = [
    {
      id: 'fireCounter',
      normal: memoriaList.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === 'Fire' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === 'Fire' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      month: '火',
    },
    {
      id: 'waterCounter',
      normal: memoriaList.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === 'Water' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === 'Water' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      month: '水',
    },
    {
      id: 'windCounter',
      normal: memoriaList.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === 'Wind' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      special: memoriaList.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === 'Wind' &&
          Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
          Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
      ).length,
      month: '風',
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Grid
        container
        direction={'column'}
        size={{ xs: 12, md: 6, lg: 4 }}
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'カウンター'}</Typography>
        <BarChart
          dataset={dataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaList.filter(
              m =>
                m.kind === '通常範囲' &&
                m.element === map[id.dataIndex] &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
            );
            const special = memoriaList.filter(
              m =>
                m.kind === '特殊範囲' &&
                m.element === map[id.dataIndex] &&
                Lenz.skill.effects.get(m).some(eff => eff.type === 'damage') &&
                Lenz.skill.kinds.get(m)?.some(k => k === 'counter'),
            );
            setData([normal, special]);
            handleClickOpen();
          }}
        />
      </Grid>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'内容物'}</DialogTitle>
        <DialogContent>
          <Grid>
            <Typography>{'通常'}</Typography>
            <Divider />
            <Grid>
              {data[0].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
          <Grid>
            <Typography>{'特殊'}</Typography>
            <Divider />
            <Grid>
              {data[1].map(m => (
                <Tooltip
                  key={Lenz.memoria.shortName.get(m)}
                  title={
                    <Stack>
                      <Typography variant='h6'>
                        {Lenz.memoria.shortName.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.skill.name.get(m)}
                      </Typography>
                      <Typography variant='body2'>
                        {Lenz.support.name.get(m)}
                      </Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${Lenz.memoria.shortName.get(m)}.png`}
                    alt={Lenz.memoria.shortName.get(m)}
                    width={100}
                    height={100}
                  />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Database() {
  const [cost, setCost] = useAtom(costAtom);

  return (
    <>
      <Box sx={{ marginBottom: 5 }}>
        <FormControl fullWidth>
          <InputLabel id='demo-simple-select-label'>Cost</InputLabel>
          <Select
            labelId='demo-simple-select-label'
            id='demo-simple-select'
            value={cost}
            label='Cost'
            onChange={e => {
              setCost(e.target.value as number);
            }}
          >
            {[17, 18, 19, 20, 21, 22].map(c => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Typography>{'回復'}</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid
        container
        direction={'row'}
        sx={{ minWidth: '80vw' }}
        justifyContent={'center'}
      >
        <HealDataset />
      </Grid>
      <Typography>{'支援'}</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid
        container
        direction={'row'}
        sx={{ minWidth: '80vw' }}
        justifyContent={'center'}
      >
        <AssistDataset />
      </Grid>
      <Typography>{'妨害'}</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid
        container
        direction={'row'}
        sx={{ minWidth: '80vw' }}
        justifyContent={'center'}
      >
        <InterferenceDataset />
      </Grid>
      <Typography>{'前衛'}</Typography>
      <Divider sx={{ margin: 2 }} />
      <Grid
        container
        direction={'row'}
        sx={{ minWidth: '80vw' }}
        justifyContent={'center'}
      >
        <AttackDataset />
        <DefenseDataset />
        <CounterDataset />
      </Grid>
    </>
  );
}

export default function Page() {
  return (
    <Layout>
      <Database />
    </Layout>
  );
}
