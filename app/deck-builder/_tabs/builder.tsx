'use client';

import { useAtom } from 'jotai';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type MouseEvent, Suspense, useEffect, useState } from 'react';

import {
  Add,
  ArrowRightAlt,
  ClearAll,
  FilterAlt,
  Launch,
  Layers,
  LayersOutlined,
  LinkSharp,
  Remove,
  Reply,
  ReplyOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  ImageListItem,
  ImageListItemBar,
  InputLabel,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
  alpha,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import type { SelectChangeEvent, Theme } from '@mui/material';
import { blue, green, purple, red, yellow } from '@mui/material/colors';

import { decodeDeck, encodeDeck } from '@/actions/serde';
import Details from '@/components/deck-builder/Details';
import Filter from '@/components/deck-builder/Filter';
import Search from '@/components/deck-builder/Search';
import Sortable from '@/components/sortable/Sortable';
import type { Memoria } from '@/domain/memoria/memoria';
import {
  type MemoriaWithConcentration,
  adLevelAtom,
  candidateAtom,
  charmAtom,
  compareModeAtom,
  costumeAtom,
  defAtom,
  filteredMemoriaAtom,
  roleFilterAtom,
  rwDeckAtom,
  rwLegendaryDeckAtom,
  sortKind,
  sortKindAtom,
  spDefAtom,
  statusAtom,
  swAtom,
  targetBeforeAtom,
  targetAfterAtom,
} from '@/jotai/memoriaAtoms';

import { calcDiff } from '@/evaluate/calc';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import Cookies from 'js-cookie';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { CloseIcon } from 'next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon';
import { Virtuoso } from 'react-virtuoso';
import { match } from 'ts-pattern';
import { parseSkill } from '@/parser/skill';

function Icon({
  kind,
  element,
  position,
}: {
  kind: string;
  element: string;
  position?: number;
}) {
  const kindImage = match(kind)
    .with('通常単体', () => (
      <Image src={'/NormalSingle.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('通常範囲', () => (
      <Image src={'/NormalRange.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('特殊単体', () => (
      <Image src={'/SpecialSingle.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('特殊範囲', () => (
      <Image src={'/SpecialRange.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('支援', () => (
      <Image src={'/Assist.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('妨害', () => (
      <Image src={'/Interference.png'} alt={'kind'} width={25} height={25} />
    ))
    .with('回復', () => (
      <Image src={'/Recovery.png'} alt={'kind'} width={25} height={25} />
    ))
    .run();

  const avatar = (color: string) => (
    <Avatar
      sx={{
        width: 30,
        height: 30,
        left: position,
        position: 'absolute',
        bgcolor: color,
      }}
    >
      {kindImage}
    </Avatar>
  );

  return match(element)
    .with('火', () => avatar(red[500]))
    .with('水', () => avatar(blue[500]))
    .with('風', () => avatar(green[500]))
    .with('光', () => avatar(yellow[500]))
    .with('闇', () => avatar(purple[500]))
    .run();
}

function Concentration({
  concentration,
  handleConcentration,
}: {
  concentration: number;
  handleConcentration: (() => void) | false;
}) {
  return (
    <IconButton
      onClick={handleConcentration === false ? undefined : handleConcentration}
      sx={{
        top: 25,
        left: 60,
        position: 'absolute',
      }}
    >
      {concentration === 4 ? (
        <Typography
          variant='body2'
          color='white'
          sx={{
            position: 'absolute',
          }}
        >
          MAX
        </Typography>
      ) : (
        <Typography
          variant='body2'
          color='white'
          sx={{
            position: 'absolute',
          }}
        >
          {concentration}
        </Typography>
      )}
      <Image
        src={'/Concentration.png'}
        alt={'concentration'}
        width={30}
        height={30}
      />
    </IconButton>
  );
}

function MemoriaItem({
  memoria,
  remove,
  onConcentrationChange,
  onContextMenu,
}: {
  memoria: MemoriaWithConcentration;
  remove?: false;
  onConcentrationChange?: ((value: number) => void) | false;
  onContextMenu?: false;
}) {
  const { name, id, skill, support, concentration } = memoria;
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [concentrationValue, setConcentration] = useState(concentration);
  const [isLoaded, setIsLoaded] = useState(false);
  const [compare, setCompare] = useAtom(compareModeAtom);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // Repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior, we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  const {
    isDragging,
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id,
  });

  const changeValue = (prev: MemoriaWithConcentration[]) => {
    return prev.map(memoria => {
      if (memoria.name === name) {
        return {
          ...memoria,
          concentration: concentrationValue > 0 ? concentrationValue - 1 : 4,
        };
      }
      return memoria;
    });
  };

  const handleConcentration = () => {
    if (concentrationValue > 0) {
      setConcentration(concentrationValue - 1);
    } else {
      setConcentration(4);
    }
    if (onConcentrationChange) {
      onConcentrationChange(
        concentrationValue > 0 ? concentrationValue - 1 : 4,
      );
    } else {
      setDeck(changeValue);
      setLegendaryDeck(changeValue);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Number.POSITIVE_INFINITY : 'auto',
  };

  return (
    <Grid key={id} ref={setNodeRef} style={style}>
      {!isLoaded && <Skeleton variant='rectangular' width={100} height={100} />}
      <Box
        sx={
          compare && compare.id === memoria.id
            ? {
                filter: 'grayscale(80%)',
              }
            : {}
        }
      >
        <ImageListItem>
          <Box>
            <Icon kind={memoria.kind} element={memoria.element} position={70} />
            <Concentration
              concentration={concentrationValue}
              handleConcentration={handleConcentration}
            />
          </Box>
          <div {...attributes} {...listeners} style={{ touchAction: 'none' }}>
            <Tooltip
              title={
                <Stack>
                  <Typography variant='h6'>{name}</Typography>
                  <Typography variant='body2'>{skill.name}</Typography>
                  <Typography variant='body2'>{support.name}</Typography>
                </Stack>
              }
              placement={'top'}
              arrow
            >
              <Image
                src={`/memoria/${name}.png`}
                alt={name}
                width={100}
                height={100}
                onLoad={() => {
                  setIsLoaded(true);
                }}
                onContextMenu={onContextMenu ? undefined : handleContextMenu}
              />
            </Tooltip>
          </div>
          <ImageListItemBar
            sx={{ bgcolor: 'rgba(0, 0, 0, 0)' }}
            position={'top'}
            actionPosition={'right'}
          />
          <Box>
            <ImageListItemBar
              sx={{ bgcolor: 'rgba(0, 0, 0, 0)' }}
              position={'top'}
              actionPosition={'left'}
              actionIcon={
                remove === undefined && (
                  <IconButton
                    sx={{
                      color: 'rgba(255, 50, 50, 0.9)',
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                      zIndex: Number.POSITIVE_INFINITY,
                    }}
                    aria-label={`remove ${name}`}
                    onClick={() => {
                      setDeck(prev =>
                        prev.filter(memoria => memoria.name !== name),
                      );
                      setLegendaryDeck(prev =>
                        prev.filter(memoria => memoria.name !== name),
                      );
                    }}
                  >
                    <Remove />
                  </IconButton>
                )
              }
            />
          </Box>
        </ImageListItem>
      </Box>
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference='anchorPosition'
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {compare === undefined ? (
          <MenuItem
            onClick={() => {
              setContextMenu(null);
              setCompare(memoria);
            }}
          >
            入れ替え
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              setContextMenu(null);
              setCompare(undefined);
            }}
          >
            キャンセル
          </MenuItem>
        )}
      </Menu>
    </Grid>
  );
}

function Deck() {
  const [deck, setDeck] = useAtom(rwDeckAtom);

  return (
    <Sortable items={deck} onChangeOrder={setDeck}>
      <Grid
        container
        direction={'row'}
        alignItems={'left'}
        spacing={2}
        sx={{ maxWidth: 600, minHeight: 100 }}
      >
        {deck.map(memoria => {
          return <MemoriaItem memoria={memoria} key={memoria.id} />;
        })}
      </Grid>
    </Sortable>
  );
}

function LegendaryDeck() {
  const [deck, setDeck] = useAtom(rwLegendaryDeckAtom);

  return (
    <Sortable items={deck} onChangeOrder={setDeck}>
      <Grid
        container
        direction={'row'}
        alignItems={'left'}
        spacing={2}
        sx={{ maxWidth: 600, minHeight: 100 }}
      >
        {deck.map(memoria => {
          return <MemoriaItem memoria={memoria} key={memoria.id} />;
        })}
      </Grid>
    </Sortable>
  );
}

function Unit() {
  const params = useSearchParams();
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);
  const [, setCompare] = useAtom(compareModeAtom);

  useEffect(() => {
    const value = params.get('deck');
    if (value) {
      const { sw, deck, legendaryDeck } = decodeDeck(value);
      setSw(sw);
      setRoleFilter(
        sw === 'shield'
          ? ['support', 'interference', 'recovery']
          : [
              'normal_single',
              'normal_range',
              'special_single',
              'special_range',
            ],
      );
      setDeck(deck);
      setLegendaryDeck(legendaryDeck);
      setCompare(undefined);
    } else {
      const cookie = Cookies.get('deck');
      if (cookie) {
        const { sw, deck, legendaryDeck } = decodeDeck(cookie);
        setSw(sw);
        setRoleFilter(
          sw === 'shield'
            ? ['support', 'interference', 'recovery']
            : [
                'normal_single',
                'normal_range',
                'special_single',
                'special_range',
              ],
        );
        setDeck(deck);
        setLegendaryDeck(legendaryDeck);
        setCompare(undefined);
      }
    }
  }, [setDeck, setLegendaryDeck, setRoleFilter, setSw, params.get, setCompare]);

  return (
    <>
      <LegendaryDeck />
      <Divider sx={{ margin: 2 }} />
      <Deck />
    </>
  );
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  // biome-ignore lint/style/useNamingConvention: <explanation>
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name: string, personName: string[], theme: Theme) {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

export default function MultipleSelect({
  times,
  kind,
  targets,
}: {
  kind: 'before' | 'after';
  times: number;
  targets: MemoriaWithConcentration[];
}) {
  const theme = useTheme();
  const [personName, setPersonName] = useState<string[]>([]);
  const [, setStackBeforeTargets] = useAtom(targetBeforeAtom);
  const [, setStackAfterTargets] = useAtom(targetAfterAtom);
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const unit = legendaryDeck.concat(deck);

  const handleChange = (event: SelectChangeEvent<typeof personName>) => {
    const {
      target: { value },
    } = event;
    (kind === 'before' ? setStackBeforeTargets : setStackAfterTargets)(
      typeof value === 'string'
        ? value
            .split(',')
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            .map(name => unit.find(memoria => memoria.name === name)!.id)
        : // biome-ignore lint/style/noNonNullAssertion: <explanation>
          value.map(name => unit.find(memoria => memoria.name === name)!.id),
    );
    setPersonName(
      // On autofill, we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id='targets'>スタック適用対象</InputLabel>
        <Select
          multiple
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput label='Target' />}
          MenuProps={MenuProps}
          variant={'outlined'}
        >
          {targets.map(memoria => (
            <MenuItem
              key={memoria.name}
              value={memoria.name}
              disabled={
                !(
                  personName.length < times || personName.includes(memoria.name)
                )
              }
              style={getStyles(memoria.name, personName, theme)}
            >
              {memoria.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

function Compare({
  counter,
  stack,
}: {
  counter?: boolean;
  stack?: boolean;
}) {
  const theme = useTheme();
  const [compare] = useAtom(compareModeAtom);
  const [candidate] = useAtom(candidateAtom);
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [selfStatus] = useAtom(statusAtom);
  const [def] = useAtom(defAtom);
  const [spDef] = useAtom(spDefAtom);
  const [charm] = useAtom(charmAtom);
  const [costume] = useAtom(costumeAtom);
  const [adLevel] = useAtom(adLevelAtom);
  const [targetBefore] = useAtom(targetBeforeAtom);
  const [targetAfter] = useAtom(targetAfterAtom);
  const [sw] = useAtom(swAtom);

  if (candidate === undefined || compare === undefined) {
    return <Typography>error!</Typography>;
  }

  const [stackRateBefore, stackTimesBefore] = match(sw)
    .with('sword', () => {
      const stack = parseSkill(
        compare.skill.name,
        compare.skill.description,
      ).effects.find(eff => eff.stack?.type === 'Meteor')?.stack;

      return [stack?.rate, stack?.times];
    })
    .with('shield', () => {
      const stack = parseSkill(
        compare.skill.name,
        compare.skill.description,
      ).effects.find(
        eff => eff.stack?.type === 'Eden' || eff.stack?.type === 'ANiMA',
      )?.stack;

      return [stack?.rate, stack?.times];
    })
    .exhaustive();
  const [stackRateAfter, stackTimesAfter] = match(sw)
    .with('sword', () => {
      const stack = parseSkill(
        candidate.skill.name,
        candidate.skill.description,
      ).effects.find(eff => eff.stack?.type === 'Meteor')?.stack;

      return [stack?.rate, stack?.times];
    })
    .with('shield', () => {
      const stack = parseSkill(
        candidate.skill.name,
        candidate.skill.description,
      ).effects.find(
        eff => eff.stack?.type === 'Eden' || eff.stack?.type === 'ANiMA',
      )?.stack;

      return [stack?.rate, stack?.times];
    })
    .exhaustive();

  const diff = calcDiff(
    candidate,
    deck,
    legendaryDeck,
    compare,
    selfStatus,
    [def, spDef],
    charm,
    costume,
    adLevel,
    {
      counter,
      stack: stack
        ? {
            before: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              rate: stackRateBefore!,
              targets: targetBefore,
            },
            after: {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              rate: stackRateAfter!,
              targets: targetAfter,
            },
          }
        : undefined,
    },
  );

  const style = {
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr',
    width: 'max-content',
    maxWidth: '100%',
    padding: '2rem',
    lineHeight: 2,
  };

  const intoRow = ([type, [before, after]]: [string, [number, number]]) => {
    const sign = after - before > 0;
    const color = {
      color: theme.palette[sign ? 'success' : 'error'][theme.palette.mode],
    };
    return (
      <>
        <dt
          key={type}
          style={{
            paddingRight: '1em',
            textAlignLast: 'justify',
            ...color,
          }}
        >{`${type}:`}</dt>
        <dd style={color}>{`${sign ? '+' : ''}${after - before}`}</dd>
        <dd>{`(${before} => ${after})`}</dd>
      </>
    );
  };

  return (
    <Grid
      container
      direction={'column'}
      alignItems='center'
      justifyContent='space-between'
    >
      <Grid container>
        <Grid size={{ xs: 5 }}>
          <Stack direction={'column'}>
            <Stack direction={'row'}>
              <Grid>
                <MemoriaItem
                  memoria={compare}
                  onConcentrationChange={false}
                  onContextMenu={false}
                />
              </Grid>
              <Stack direction={'column'} paddingLeft={5}>
                <Typography variant='body2'>{`${compare?.name}`}</Typography>
                <Typography variant='body2'>{`${compare.skill.name}`}</Typography>
                <Typography variant='body2'>{`${compare.support.name}`}</Typography>
              </Stack>
            </Stack>
            {compare.skill.description.includes('スタック') ? (
              <MultipleSelect
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                times={stackTimesBefore!}
                kind={'before'}
                targets={legendaryDeck
                  .concat(deck)
                  .filter(m => ![compare.id, candidate.id].includes(m.id))}
              />
            ) : (
              <></>
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 2 }} paddingTop={4}>
          <ArrowRightAlt fontSize={'large'} />
        </Grid>
        <Grid size={{ xs: 5 }}>
          <Stack direction={'column'}>
            <Stack direction={'row'}>
              <Grid>
                <MemoriaItem
                  memoria={candidate}
                  onConcentrationChange={false}
                  onContextMenu={false}
                />
              </Grid>
              <Stack direction={'column'} paddingLeft={5}>
                <Typography variant='body2'>{`${candidate?.name}`}</Typography>
                <Typography variant='body2'>{`${candidate.skill.name}`}</Typography>
                <Typography variant='body2'>{`${candidate.support.name}`}</Typography>
              </Stack>
            </Stack>
            {candidate.skill.description.includes('スタック') ? (
              <MultipleSelect
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                times={stackTimesAfter!}
                kind={'after'}
                targets={legendaryDeck
                  .concat(deck)
                  .filter(m => ![compare.id, candidate.id].includes(m.id))}
              />
            ) : (
              <></>
            )}
          </Stack>
        </Grid>
      </Grid>
      <Divider textAlign={'left'} sx={{ margin: 2, width: '30vw' }}>
        ステータス
      </Divider>
      <Grid>
        <dl style={style}>
          {intoRow([
            'ATK',
            [
              compare.status[compare.concentration][0],
              candidate.status[compare.concentration][0],
            ],
          ])}
          {intoRow([
            'Sp.ATK',
            [
              compare.status[compare.concentration][1],
              candidate.status[compare.concentration][1],
            ],
          ])}
          {intoRow([
            'DEF',
            [
              compare.status[compare.concentration][2],
              candidate.status[compare.concentration][2],
            ],
          ])}
          {intoRow([
            'Sp.DEF',
            [
              compare.status[compare.concentration][3],
              candidate.status[compare.concentration][3],
            ],
          ])}
        </dl>
      </Grid>
      <Divider textAlign={'left'} sx={{ margin: 2, width: '30vw' }}>
        {diff.expectedToalDamage[1] - diff.expectedToalDamage[0] !== 0
          ? 'ダメージ'
          : '回復'}
      </Divider>
      <Grid>
        <dl style={style}>
          {/* damage */}
          {diff.expectedToalDamage[1] - diff.expectedToalDamage[0] !== 0 &&
            intoRow(['ダメージ', diff.expectedToalDamage])}
          {/* recovery */}
          {diff.expectedTotalRecovery[1] - diff.expectedTotalRecovery[0] !==
            0 && intoRow(['回復', diff.expectedTotalRecovery])}
        </dl>
      </Grid>
      <Divider textAlign={'left'} sx={{ margin: 2, width: '30vw' }}>
        {'バフ'}
      </Divider>
      <Grid>
        <dl style={style}>
          {[...diff.expectedTotalBuff.entries()]
            .filter(([_, value]) => value[0] > 0 && value[0] !== value[1])
            .map(([type, value]) => intoRow([type, value]))}
        </dl>
      </Grid>
      <Divider textAlign={'left'} sx={{ margin: 2, width: '30vw' }}>
        {'デバフ'}
      </Divider>
      <Grid>
        <dl style={style}>
          {[...diff.expectedTotalDebuff.entries()]
            .filter(([_, value]) => value[0] > 0 && value[0] !== value[1])
            .map(([type, value]) => intoRow([type, value]))}
        </dl>
      </Grid>
    </Grid>
  );
}

function VirtualizedList() {
  const theme = useTheme();
  const [memoria] = useAtom(filteredMemoriaAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [open, setOpen] = useState(false);
  const [compare, setCompare] = useAtom(compareModeAtom);
  const [candidate, setCandidate] = useAtom(candidateAtom);
  const [counter, setCounter] = useState(false);
  const [stack, setStack] = useState(false);
  const [, setTargetBefore] = useAtom(targetBeforeAtom);
  const [, setTargetAfter] = useAtom(targetAfterAtom);

  const addMemoria = (
    prev: MemoriaWithConcentration[],
    newMemoria: Memoria,
  ) => {
    return [...prev, { ...newMemoria, concentration: 4 }];
  };

  const onDialogClose = () => {
    setTargetBefore([]);
    setTargetAfter([]);
    setOpen(false);
  };

  return (
    <>
      <Virtuoso
        style={{ height: '60vh' }}
        totalCount={memoria.length}
        itemContent={index => {
          return (
            <Card
              sx={{
                display: 'flex',
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : alpha(theme.palette.primary.main, 0.2),
              }}
              key={index}
            >
              <IconButton
                sx={{
                  position: 'absolute',
                  left: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                }}
                aria-label='add'
                onClick={() => {
                  if (compare !== undefined) {
                    setOpen(true);
                    setCandidate({
                      ...memoria[index],
                      concentration: 4,
                    });
                    return;
                  }
                  if (memoria[index].labels.includes('legendary')) {
                    setLegendaryDeck(prev => addMemoria(prev, memoria[index]));
                  } else {
                    setDeck(prev => addMemoria(prev, memoria[index]));
                  }
                }}
              >
                <Add color={'warning'} />
              </IconButton>
              <Tooltip title={memoria[index].name} placement={'top'}>
                <CardMedia
                  component='img'
                  sx={{ width: 100, height: 100 }}
                  image={`/memoria/${memoria[index].name}.png`}
                  alt={memoria[index].name}
                />
              </Tooltip>
              <CardContent>
                <Stack direction={'column'} sx={{ paddingLeft: 2 }}>
                  <Typography
                    component='span'
                    fontWeight='bold'
                    fontSize={12}
                    sx={{ display: 'block' }}
                    color='text.primary'
                  >
                    {memoria[index].skill.name}
                  </Typography>
                  <Divider sx={{ margin: 1 }} />
                  <Typography
                    component='span'
                    fontWeight='bold'
                    fontSize={12}
                    sx={{ display: 'block' }}
                    color='text.primary'
                  >
                    {memoria[index].support.name}
                  </Typography>
                </Stack>
              </CardContent>

              <IconButton sx={{ position: 'absolute', right: 0 }}>
                <Link
                  href={`https://allb.game-db.tw/memoria/${memoria[index].link}`}
                  target={'_blank'}
                >
                  <Launch />
                </Link>
              </IconButton>
            </Card>
          );
        }}
      />
      <Dialog fullScreen open={open} onClose={onDialogClose}>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge='start'
              color='inherit'
              onClick={onDialogClose}
              aria-label='close'
            >
              <CloseIcon />
            </IconButton>

            <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
              期待値比較
            </Typography>
            <Tooltip title='カウンター' placement='left'>
              <Checkbox
                disabled={
                  ![compare, candidate].some(m =>
                    m?.skill.description.includes('スタック'),
                  )
                }
                icon={<ReplyOutlined style={{ transform: 'rotate(90deg)' }} />}
                checkedIcon={<Reply style={{ transform: 'rotate(90deg)' }} />}
                onChange={(_, checked) => setCounter(() => checked)}
              />
            </Tooltip>
            <Tooltip title='スタック' placement='left'>
              <Checkbox
                disabled={
                  ![compare, candidate].some(m =>
                    m?.skill.description.includes('スタック'),
                  )
                }
                icon={<LayersOutlined />}
                checkedIcon={<Layers />}
                onChange={(_, checked) => setStack(() => checked)}
              />
            </Tooltip>
            <Button
              autoFocus
              color='inherit'
              onClick={() => {
                if (candidate?.labels.includes('legendary')) {
                  setLegendaryDeck(prev =>
                    [...prev].map(memoria =>
                      memoria.id === compare?.id ? candidate : memoria,
                    ),
                  );
                } else {
                  setDeck(prev =>
                    [...prev].map(memoria =>
                      // biome-ignore lint/style/noNonNullAssertion: <explanation>
                      memoria.id === compare?.id ? candidate! : memoria,
                    ),
                  );
                }
                setOpen(false);
                setCandidate(undefined);
                setCompare(undefined);
              }}
            >
              save
            </Button>
          </Toolbar>
        </AppBar>
        <Grid
          container
          sx={{
            paddingLeft: { xs: '5%', md: '10%', lg: '20%' },
            paddingRight: { xs: '5%', md: '10%', lg: '20%' },
          }}
        >
          {compare?.labels.includes('legendary') ===
          candidate?.labels.includes('legendary') ? (
            <DialogContent>
              <Compare counter={counter} stack={stack} />
            </DialogContent>
          ) : (
            <DialogContent>
              <Typography id='modal-modal-title' variant='h6' component='h2'>
                Error
              </Typography>
              <Typography variant='body2'>
                レジェンダリーメモリアと通常メモリアを比較することはできません。
              </Typography>
            </DialogContent>
          )}
        </Grid>
      </Dialog>
    </>
  );
}

function SortMenu() {
  const [sort, setSort] = useAtom(sortKindAtom);
  return (
    <PopupState
      variant='popover'
      popupId='demo-popup-menu'
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {popupState => (
        <>
          <Button {...bindTrigger(popupState)}>sorted by {sort}</Button>
          <Menu {...bindMenu(popupState)}>
            {sortKind.map(kind => {
              return (
                <MenuItem
                  key={kind}
                  onClick={() => {
                    popupState.close();
                    setSort(kind);
                  }}
                >
                  {kind}
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </PopupState>
  );
}

function Source() {
  return (
    <Grid
      container
      direction={'column'}
      alignItems={'center'}
      minHeight={'70vh'}
    >
      <Grid minHeight={'60vh'} minWidth={'100%'}>
        <ToggleButtons />
        <FilterModal />
        <SearchModal />
        <SortMenu />
        <VirtualizedList />
      </Grid>
    </Grid>
  );
}

function ToggleButtons() {
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);
  const [, setCompare] = useAtom(compareModeAtom);

  return (
    <FormControlLabel
      control={<Switch checked={sw === 'shield'} />}
      label='前衛 <=> 後衛'
      onChange={() => {
        if (sw === 'shield') {
          setSw('sword');
          setRoleFilter([
            'normal_single',
            'normal_range',
            'special_single',
            'special_range',
          ]);
        } else {
          setSw('shield');
          setRoleFilter(['support', 'interference', 'recovery']);
        }
        setDeck([]);
        setLegendaryDeck([]);
        setCompare(undefined);
      }}
    />
  );
}

function FilterModal() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={'filter'} placement={'top'}>
        <Button onClick={handleOpen}>
          <FilterAlt />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id='modal-modal-title' variant='h6' component='h2'>
            Filter
          </Typography>
          <Filter />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SearchModal() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={'search'} placement={'top'}>
        <Button onClick={handleOpen}>
          <SearchOutlined />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id='modal-modal-title' variant='h6' component='h2'>
            Search
          </Typography>
          <Search />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function DeckBuilder() {
  const theme = useTheme();
  const [deck, setDeck] = useAtom(rwDeckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [sw] = useAtom(swAtom);
  const pathname = usePathname();
  const [, setCompare] = useAtom(compareModeAtom);

  const shareHandler = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://mitama.io/${pathname}?deck=${encodeDeck(
          sw,
          deck,
          legendaryDeck,
        )}`,
      );
      alert('クリップボードに保存しました。');
    } catch (_error) {
      alert('失敗しました。');
    }
  };

  return (
    <Grid container direction={'row'} alignItems={'right'}>
      <Grid
        container
        size={{ xs: 12 }}
        direction={'row'}
        alignItems={'left'}
        flexShrink={2}
      >
        <Grid
          size={{ xs: 12, md: 4, lg: 2 }}
          direction={'column'}
          alignItems={'center'}
        >
          <Details />
        </Grid>
        <Grid size={{ xs: 12, md: 8, lg: 6 }} alignItems={'center'}>
          <Tooltip title='clear all' placement={'top'}>
            <Button
              onClick={() => {
                setDeck([]);
                setLegendaryDeck([]);
                setCompare(undefined);
              }}
            >
              <ClearAll />
            </Button>
          </Tooltip>
          <Tooltip title={'generate share link'} placement={'top'}>
            <Link
              href={`/deck-builder?deck=${encodeDeck(sw, deck, legendaryDeck)}`}
              onClick={shareHandler}
            >
              <IconButton aria-label='share'>
                <LinkSharp />
              </IconButton>
            </Link>
          </Tooltip>
          <Container
            maxWidth={false}
            sx={{
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : alpha(theme.palette.primary.main, 0.2),
              minHeight: '60vh',
              maxWidth: 620,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <Suspense>
              <Unit />
            </Suspense>
          </Container>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 4 }}>
          <Source />
        </Grid>
      </Grid>
    </Grid>
  );
}
