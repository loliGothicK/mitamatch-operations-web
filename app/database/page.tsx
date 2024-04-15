'use client';

import { Layout } from '@/components/Layout';
import type { Memoria } from '@/domain/memoria/memoria';
import { costAtom, memoriaDataAtom } from '@/jotai/dataAtoms';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
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

const chartSetting = {
  width: 500,
  height: 300,
  [`.${axisClasses.left} .${axisClasses.label}`]: {
    transform: 'translate(-20px, 0)',
  },
};

const valueFormatter = (value: number | null) => `${value}枚`;

function HealDataset() {
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire DEF', 'Water DEF', 'Wind DEF'];
  const healDataset = [
    {
      id: 'fireHeal',
      normal: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Fire DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Fire DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
      ).length,
      month: '火防',
    },
    {
      id: 'waterHeal',
      normal: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Water DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Water DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
      ).length,
      month: '水防',
    },
    {
      id: 'windHeal',
      normal: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Wind DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '回復' &&
          m.skillData.effects.some(eff => eff.type === 'heal') &&
          m.skillData.effects.some(eff => eff.status === 'Wind DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
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
        xs={12}
        md={6}
        lg={4}
        item
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
            const normal = memoriaData.filter(
              m =>
                m.kind === '回復' &&
                m.skillData.effects.some(eff => eff.type === 'heal') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'DEF'),
            );
            const special = memoriaData.filter(
              m =>
                m.kind === '回復' &&
                m.skillData.effects.some(eff => eff.type === 'heal') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
                    width={100}
                    height={100}
                    key={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const assistDataset = [
    {
      id: 'fireAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '支援' &&
          m.skillData.effects.some(eff => eff.type === 'buff') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
        xs={12}
        md={6}
        lg={4}
        item
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
            const normal = memoriaData.filter(
              m =>
                m.kind === '支援' &&
                m.skillData.effects.some(eff => eff.type === 'buff') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'ATK'),
            );
            const special = memoriaData.filter(
              m =>
                m.kind === '支援' &&
                m.skillData.effects.some(eff => eff.type === 'buff') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
                    width={100}
                    height={100}
                    key={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const assistDataset = [
    {
      id: 'fireAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '妨害' &&
          m.skillData.effects.some(eff => eff.type === 'debuff') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
        xs={12}
        md={6}
        lg={4}
        item
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属攻妨害'}</Typography>
        <BarChart
          dataset={assistDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaData.filter(
              m =>
                m.kind === '妨害' &&
                m.skillData.effects.some(eff => eff.type === 'debuff') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'ATK'),
            );
            const special = memoriaData.filter(
              m =>
                m.kind === '妨害' &&
                m.skillData.effects.some(eff => eff.type === 'debuff') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
                    width={100}
                    height={100}
                    key={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire ATK', 'Water ATK', 'Wind ATK'];
  const vanguardDataset = [
    {
      id: 'fireAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Fire ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '火攻',
    },
    {
      id: 'waterAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Water ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
      ).length,
      month: '水攻',
    },
    {
      id: 'windAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'ATK'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Wind ATK') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
        xs={12}
        md={6}
        lg={4}
        item
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
            const normal = memoriaData.filter(
              m =>
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'ATK'),
            );
            const special = memoriaData.filter(
              m =>
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'Sp.ATK'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
                    width={100}
                    height={100}
                    key={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['Fire DEF', 'Water DEF', 'Wind DEF'];
  const assistDataset = [
    {
      id: 'fireAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Fire DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Fire DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
      ).length,
      month: '火防',
    },
    {
      id: 'waterAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Water DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Water DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
      ).length,
      month: '水防',
    },
    {
      id: 'windAssist',
      normal: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Wind DEF') &&
          m.skillData.effects.some(eff => eff.status === 'DEF'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.effects.some(eff => eff.status === 'Wind DEF') &&
          m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
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
        xs={12}
        md={6}
        lg={4}
        item
        bgcolor={
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255, 0.1)'
            : alpha(theme.palette.primary.main, 0.2)
        }
      >
        <Typography>{'属防デバ'}</Typography>
        <BarChart
          dataset={assistDataset}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'normal', label: '通常', valueFormatter },
            { dataKey: 'special', label: '特殊', valueFormatter },
          ]}
          {...chartSetting}
          onItemClick={(_, id) => {
            const normal = memoriaData.filter(
              m =>
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'DEF'),
            );
            const special = memoriaData.filter(
              m =>
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.effects.some(
                  eff => eff.status === map[id.dataIndex],
                ) &&
                m.skillData.effects.some(eff => eff.status === 'Sp.DEF'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
  const [memoriaData] = useAtom(memoriaDataAtom);
  const [data, setData] = useState<[Memoria[], Memoria[]]>([[], []]);
  const map = ['火', '水', '風'];
  const dataset = [
    {
      id: 'fireCounter',
      normal: memoriaData.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === '火' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === '火' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
      ).length,
      month: '火',
    },
    {
      id: 'waterCounter',
      normal: memoriaData.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === '水' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === '水' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
      ).length,
      month: '水',
    },
    {
      id: 'windCounter',
      normal: memoriaData.filter(
        m =>
          m.kind === '通常範囲' &&
          m.element === '風' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
      ).length,
      special: memoriaData.filter(
        m =>
          m.kind === '特殊範囲' &&
          m.element === '風' &&
          m.skillData.effects.some(eff => eff.type === 'damage') &&
          m.skillData.kinds?.some(k => k === 'counter'),
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
        xs={12}
        md={6}
        lg={4}
        item
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
            const normal = memoriaData.filter(
              m =>
                m.kind === '通常範囲' &&
                m.element === map[id.dataIndex] &&
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.kinds?.some(k => k === 'counter'),
            );
            const special = memoriaData.filter(
              m =>
                m.kind === '特殊範囲' &&
                m.element === map[id.dataIndex] &&
                m.skillData.effects.some(eff => eff.type === 'damage') &&
                m.skillData.kinds?.some(k => k === 'counter'),
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
                  key={m.name}
                  title={
                    <Stack>
                      <Typography variant='h6'>{m.name}</Typography>
                      <Typography variant='body2'>{m.skill.name}</Typography>
                      <Typography variant='body2'>{m.support.name}</Typography>
                    </Stack>
                  }
                  placement={'top'}
                  arrow
                >
                  <Image
                    src={`/memoria/${m.name}.png`}
                    alt={m.name}
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
