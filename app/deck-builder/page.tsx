'use client';

import React, { ReactNode, SyntheticEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAtom } from 'jotai';

import {
  Add,
  ClearAll,
  FilterAlt,
  Launch,
  LinkSharp,
  QuestionMark,
  Remove,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Badge,
  BadgeProps,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  ImageListItem,
  ImageListItemBar,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  Tabs,
  TextField,
  Tooltip,
} from '@mui/material';
import Box from '@mui/material/Box';
import { blue, green, purple, red, yellow } from '@mui/material/colors';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';

import { decodeDeck, encodeDeck } from '@/actions/serde';
import Details from '@/component/deck-builder/Details';
import Filter from '@/component/deck-builder/Filter';
import Search from '@/component/deck-builder/Search';
import { Layout } from '@/component/Layout';
import { Charm, charmList } from '@/domain/charm/charm';
import { Costume, costumeList } from '@/domain/costume/costume';
import { evaluate } from '@/evaluate/evaluate';
import {
  deckAtom,
  filteredMemoriaAtom,
  legendaryDeckAtom,
  MemoriaWithConcentration,
  roleFilterAtom,
  sortKind,
  sortKindAtom,
  swAtom,
} from '@/jotai/memoriaAtoms';
import { StatusKind } from '@/parser/skill';

import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Cookies from 'js-cookie';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { AutoSizer, List } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { match } from 'ts-pattern';

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
    .with('通常単体', () => {
      return (
        <Image src={'/NormalSingle.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .with('通常範囲', () => {
      return (
        <Image src={'/NormalRange.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .with('特殊単体', () => {
      return (
        <Image src={'/SpecialSingle.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .with('特殊範囲', () => {
      return (
        <Image src={'/SpecialRange.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .with('支援', () => {
      return <Image src={'/Assist.png'} alt={'kind'} width={25} height={25} />;
    })
    .with('妨害', () => {
      return (
        <Image src={'/Interference.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .with('回復', () => {
      return (
        <Image src={'/Recovery.png'} alt={'kind'} width={25} height={25} />
      );
    })
    .run();

  return match(element)
    .with('火', () => (
      <Avatar
        sx={{
          width: 30,
          height: 30,
          left: position,
          position: 'absolute',
          bgcolor: red[500],
        }}
      >
        {kindImage}
      </Avatar>
    ))
    .with('水', () => (
      <Avatar
        sx={{
          width: 30,
          height: 30,
          left: position,
          position: 'absolute',
          bgcolor: blue[500],
        }}
      >
        {kindImage}
      </Avatar>
    ))
    .with('風', () => (
      <Avatar
        sx={{
          width: 30,
          height: 30,
          left: position,
          position: 'absolute',
          bgcolor: green[500],
        }}
      >
        {kindImage}
      </Avatar>
    ))
    .with('光', () => (
      <Avatar
        sx={{
          width: 30,
          height: 30,
          left: position,
          position: 'absolute',
          bgcolor: yellow[500],
        }}
      >
        {kindImage}
      </Avatar>
    ))
    .with('闇', () => (
      <Avatar
        sx={{
          width: 30,
          height: 30,
          left: position,
          position: 'absolute',
          bgcolor: purple[500],
        }}
      >
        {kindImage}
      </Avatar>
    ))
    .run();
}

function Concentration({
  concentration,
  handleConcentration,
}: {
  concentration: number;
  handleConcentration: () => void;
}) {
  return (
    <IconButton
      onClick={handleConcentration}
      sx={{
        top: 25,
        left: 60,
        position: 'absolute',
      }}
    >
      {concentration == 4 ? (
        <Typography
          variant="body2"
          color="white"
          sx={{
            position: 'absolute',
          }}
        >
          MAX
        </Typography>
      ) : (
        <Typography
          variant="body2"
          color="white"
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

function MemoriaItem({ memoria }: { memoria: MemoriaWithConcentration }) {
  const { name, id, skill, support, concentration } = memoria;
  const [sw] = useAtom(swAtom);
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [concentrationValue, setConcentration] = useState(
    concentration ? concentration : 4,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isSorting,
  } = useSortable({
    id,
  });

  const handleConcentration = () => {
    if (concentrationValue > 0) {
      setConcentration(concentrationValue - 1);
    } else {
      setConcentration(4);
    }
    setDeck((prev) => {
      return prev.map((memoria) => {
        if (memoria.name === name) {
          return { ...memoria, concentration: concentrationValue };
        }
        return memoria;
      });
    });
    setLegendaryDeck((prev) => {
      return prev.map((memoria) => {
        if (memoria.name === name) {
          return { ...memoria, concentration: concentrationValue };
        }
        return memoria;
      });
    });
    Cookies.set(
      'deck',
      encodeDeck(
        sw,
        deck.map((memoria) => {
          if (memoria.name === name) {
            return { ...memoria, concentration: concentrationValue };
          }
          return memoria;
        }),
        legendaryDeck.map((memoria) => {
          if (memoria.name === name) {
            return { ...memoria, concentration: concentrationValue };
          }
          return memoria;
        }),
      ),
    );
  };

  return (
    <Grid item key={id}>
      {!isLoaded && <Skeleton variant="rectangular" width={100} height={100} />}
      <ImageListItem>
        <Box display={isSorting ? 'none' : 'inline'}>
          <Icon kind={memoria.kind} element={memoria.element} position={70} />
          <Concentration
            concentration={concentrationValue}
            handleConcentration={handleConcentration}
          />
        </Box>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
        >
          <Tooltip
            title={
              <Stack>
                <Typography variant="h6">{name}</Typography>
                <Typography variant="body2">{skill.name}</Typography>
                <Typography variant="body2">{support.name}</Typography>
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
            />
          </Tooltip>
        </div>
        <ImageListItemBar
          sx={{ bgcolor: 'rgba(0, 0, 0, 0)' }}
          position={'top'}
          actionPosition={'right'}
        />
        <Box display={isSorting ? 'none' : 'inline'}>
          <ImageListItemBar
            sx={{ bgcolor: 'rgba(0, 0, 0, 0)' }}
            position={'top'}
            actionPosition={'left'}
            actionIcon={
              <IconButton
                sx={{
                  color: 'rgba(255, 50, 50, 0.9)',
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  zIndex: Number.POSITIVE_INFINITY,
                }}
                aria-label={`remove ${name}`}
                onClick={() => {
                  setDeck((prev) =>
                    prev.filter((memoria) => memoria.name !== name),
                  );
                  setLegendaryDeck((prev) =>
                    prev.filter((memoria) => memoria.name !== name),
                  );
                  Cookies.set(
                    'deck',
                    encodeDeck(
                      sw,
                      deck.filter((memoria) => memoria.name !== name),
                      legendaryDeck.filter((memoria) => memoria.name !== name),
                    ),
                  );
                }}
              >
                <Remove />
              </IconButton>
            }
          />
        </Box>
      </ImageListItem>
    </Grid>
  );
}

function Deck() {
  const [deck, setDeck] = useAtom(deckAtom);

  return (
    <DndContext
      onDragEnd={(event) => {
        const { active, over } = event;
        if (over == null) {
          return;
        }
        if (active.id !== over.id) {
          setDeck((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext items={deck}>
        <Grid
          container
          direction={'row'}
          alignItems={'left'}
          spacing={2}
          sx={{ maxWidth: 600, minHeight: 100 }}
        >
          {deck.map((memoria) => {
            return <MemoriaItem memoria={memoria} key={memoria.id} />;
          })}
        </Grid>
      </SortableContext>
    </DndContext>
  );
}

function LegendaryDeck() {
  const [deck, setDeck] = useAtom(legendaryDeckAtom);

  return (
    <DndContext
      onDragEnd={(event) => {
        const { active, over } = event;
        if (over == null) {
          return;
        }
        if (active.id !== over.id) {
          setDeck((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext items={deck}>
        <Grid
          container
          direction={'row'}
          alignItems={'left'}
          spacing={2}
          sx={{ maxWidth: 600, minHeight: 100 }}
        >
          {deck.map((memoria) => {
            return <MemoriaItem memoria={memoria} key={memoria.id} />;
          })}
        </Grid>
      </SortableContext>
    </DndContext>
  );
}

function VirtualizedList() {
  const [memoria] = useAtom(filteredMemoriaAtom);
  const [sw] = useAtom(swAtom);
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={memoria.length}
          rowHeight={100}
          rowRenderer={({ key, index, style }) => {
            return (
              <Stack
                direction={'row'}
                key={key}
                style={style}
                sx={{ bgcolor: 'grey' }}
              >
                <Stack direction={'row'} alignItems={'center'}>
                  <ListItemIcon>
                    <Icon
                      kind={memoria[index].kind}
                      element={memoria[index].element}
                      position={70}
                    />
                    {!isLoaded && (
                      <Skeleton
                        variant="rectangular"
                        width={100}
                        height={100}
                      />
                    )}
                    <IconButton
                      edge="start"
                      aria-label="comments"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 10,
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                      }}
                      onClick={() => {
                        if (memoria[index].labels.includes('legendary')) {
                          setLegendaryDeck((prev) => [...prev, memoria[index]]);
                          Cookies.set(
                            'deck',
                            encodeDeck(sw, deck, [
                              ...legendaryDeck,
                              memoria[index],
                            ]),
                          );
                        } else {
                          setDeck((prev) => [...prev, memoria[index]]);
                          Cookies.set(
                            'deck',
                            encodeDeck(
                              sw,
                              [...deck, memoria[index]],
                              legendaryDeck,
                            ),
                          );
                        }
                      }}
                    >
                      <Add color={'warning'} />
                    </IconButton>
                    <Tooltip title={memoria[index].name} placement={'top'}>
                      <Image
                        src={`/memoria/${memoria[index].name}.png`}
                        alt={memoria[index].name}
                        width={100}
                        height={100}
                        onLoad={() => {
                          setIsLoaded(true);
                        }}
                      />
                    </Tooltip>
                  </ListItemIcon>
                  <ListItemText
                    secondary={
                      <>
                        <Typography
                          component="span"
                          fontWeight="bold"
                          fontSize={12}
                          sx={{ display: 'block' }}
                          color="text.primary"
                        >
                          {memoria[index].skill.name}
                        </Typography>
                        <Divider sx={{ margin: 1 }} />
                        <Typography
                          component="span"
                          fontWeight="bold"
                          fontSize={12}
                          sx={{ display: 'block' }}
                          color="text.primary"
                        >
                          {memoria[index].support.name}
                        </Typography>
                      </>
                    }
                    sx={{
                      marginLeft: 2,
                    }}
                  />
                </Stack>
                <IconButton sx={{ position: 'absolute', right: 0 }}>
                  <Link
                    href={`https://allb.game-db.tw/memoria/${memoria[index].link}`}
                    target={'_blank'}
                  >
                    <Launch />
                  </Link>
                </IconButton>
              </Stack>
            );
          }}
        />
      )}
    </AutoSizer>
  );
}

function SortMenu() {
  const [sort, setSort] = useAtom(sortKindAtom);
  return (
    <PopupState
      variant="popover"
      popupId="demo-popup-menu"
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {(popupState) => (
        <>
          <Button {...bindTrigger(popupState)}>sorted by {sort}</Button>
          <Menu {...bindMenu(popupState)}>
            {sortKind.map((kind) => {
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
  const [, setDeck] = useAtom(deckAtom);
  const [, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);

  return (
    <FormControlLabel
      control={<Switch checked={sw === 'shield'} />}
      label="前衛 <=> 後衛"
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
          <Typography id="modal-modal-title" variant="h6" component="h2">
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
          <Typography id="modal-modal-title" variant="h6" component="h2">
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

function DeckBuilder() {
  const params = useSearchParams();
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);
  const value = params.get('deck');
  const pathname = usePathname();

  const shareHandler = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://mitama.io/${pathname}?deck=${encodeDeck(sw, deck, legendaryDeck)}`,
      );
      alert('クリップボードに保存しました。');
    } catch (error) {
      alert('失敗しました。');
    }
  };

  useEffect(() => {
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
      }
    }
  }, [setDeck, setLegendaryDeck, setRoleFilter, setSw, value]);

  return (
    <Grid container direction={'row'} alignItems={'right'}>
      <Grid
        container
        item
        spacing={2}
        xs={12}
        direction={'row'}
        alignItems={'left'}
        flexShrink={2}
      >
        <Grid item xs={12} md={4} lg={2}>
          <Grid container direction={'column'} alignItems={'center'}>
            <Details />
          </Grid>
        </Grid>
        <Grid item xs={12} md={8} lg={6} alignItems={'center'}>
          <Tooltip title="clear all" placement={'top'}>
            <Button
              onClick={() => {
                setDeck([]);
                setLegendaryDeck([]);
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
              <IconButton aria-label="share">
                <LinkSharp />
              </IconButton>
            </Link>
          </Tooltip>
          <Container
            maxWidth={false}
            sx={{
              bgcolor: 'grey',
              minHeight: '60vh',
              maxWidth: 620,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <LegendaryDeck />
            <Divider sx={{ margin: 2 }} />
            <Deck />
          </Container>
        </Grid>
        <Grid item xs={12} md={12} lg={4}>
          <Source />
        </Grid>
      </Grid>
    </Grid>
  );
}

const StyledBadge = styled(Badge)<BadgeProps>(() => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: -3,
    padding: '0 4px',
  },
}));

function Calculator() {
  const [deck] = useAtom(deckAtom);
  const [legendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw] = useAtom(swAtom);
  const [charm, setCharm] = useState<Charm>(charmList.reverse()[0]);
  const [costume, setCostume] = useState<Costume>(costumeList.reverse()[0]);

  const expected = evaluate([...deck, ...legendaryDeck], charm, costume);

  const expectedToalDamage = expected
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalBuff = expected
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
  const expectedTotalDebuff = expected
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
  const expectedTotalRecovery = expected
    .map(({ expected }) => expected.recovery)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);

  const displayBuffDebuff = ({
    type,
    amount,
  }: {
    type: StatusKind;
    amount: number;
  }) => {
    return `${type}: ${amount}`;
  };

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item>
          <Autocomplete
            disablePortal
            options={charmList.map((charm) => charm.name)}
            sx={{ width: 400 }}
            renderInput={(params) => <TextField {...params} label="charm" />}
            onChange={(_, value) => {
              if (value) {
                setCharm(charmList.find((charm) => charm.name === value)!);
              }
            }}
          />
        </Grid>
        <Grid item>
          <Autocomplete
            disablePortal
            options={costumeList.map(
              (costume) => `${costume.lily}/${costume.name}`,
            )}
            sx={{ width: 400 }}
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
      </Grid>
      <Divider sx={{ margin: 2 }}>
        <StyledBadge
          badgeContent={
            <Tooltip
              title={
                'すべてのメモリアを1回ずつ打ち切ったときの効果量の期待値の合計'
              }
            >
              <QuestionMark fontSize={'small'} />
            </Tooltip>
          }
        >
          {'期待値総量'}
        </StyledBadge>
      </Divider>
      <Grid container spacing={2} direction={'row'}>
        {sw === 'sword' ? (
          <Grid item>
            <Typography variant="body1">{`damage: ${expectedToalDamage}`}</Typography>
          </Grid>
        ) : (
          <Grid item>
            <Typography variant="body1">{`recovery: ${expectedTotalRecovery}`}</Typography>
          </Grid>
        )}
        {[...expectedTotalBuff.entries()].map((entry) => {
          const [type, amount] = entry;
          return (
            <Grid item>
              <Typography variant="body1" key={type}>
                {`${type}: ${amount}`}
              </Typography>
            </Grid>
          );
        })}
        {[...expectedTotalDebuff.entries()].map((entry) => {
          const [type, amount] = entry;
          return (
            <Grid item>
              <Typography variant="body1" key={type}>
                {`${type}: ${amount}`}
              </Typography>
            </Grid>
          );
        })}
      </Grid>
      <Divider sx={{ margin: 2 }}>{'詳細'}</Divider>
      <Grid container spacing={2}>
        {expected.map(({ memoria, expected }) => {
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
                          <Typography key={buff.type} variant="body2">
                            {displayBuffDebuff(buff)}
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
                          <Typography key={debuff.type} variant="body2">
                            {displayBuffDebuff(debuff)}
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

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs() {
  const [value, setValue] = useState(0);

  const handleChange = (_: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label={'Builder'} {...a11yProps(0)} />
          <Tab label={'Calculator'} {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <DeckBuilder />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Calculator />
      </CustomTabPanel>
    </Layout>
  );
}
