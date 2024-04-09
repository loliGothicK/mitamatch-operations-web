'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import {
  Add,
  ClearAll,
  FilterAlt,
  Launch,
  LinkSharp,
  Remove,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  ImageListItem,
  ImageListItemBar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { blue, green, purple, red, yellow } from '@mui/material/colors';

import { decodeDeck, encodeDeck } from '@/actions/serde';
import Details from '@/component/deck-builder/Details';
import Filter from '@/component/deck-builder/Filter';
import Search from '@/component/deck-builder/Search';
import Sortable from '@/component/sortable/Sortable';
import { Memoria } from '@/domain/memoria/memoria';
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

import { useSortable } from '@dnd-kit/sortable';
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
  const [concentrationValue, setConcentration] = useState(concentration);
  const [isLoaded, setIsLoaded] = useState(false);

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
    return prev.map((memoria) => {
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
    setDeck(changeValue);
    setLegendaryDeck(changeValue);
    Cookies.set(
      'deck',
      encodeDeck(sw, changeValue(deck), changeValue(legendaryDeck)),
    );
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Number.POSITIVE_INFINITY : 'auto',
  };

  return (
    <Grid item key={id} ref={setNodeRef} style={style}>
      {!isLoaded && <Skeleton variant="rectangular" width={100} height={100} />}
      <ImageListItem>
        <Box>
          <Icon kind={memoria.kind} element={memoria.element} position={70} />
          <Concentration
            concentration={concentrationValue}
            handleConcentration={handleConcentration}
          />
        </Box>
        <div {...attributes} {...listeners}>
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
        <Box>
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
    <Sortable items={deck} onChangeOrder={setDeck}>
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
    </Sortable>
  );
}

function LegendaryDeck() {
  const [deck, setDeck] = useAtom(legendaryDeckAtom);

  return (
    <Sortable items={deck} onChangeOrder={setDeck}>
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
    </Sortable>
  );
}

function VirtualizedList() {
  const [memoria] = useAtom(filteredMemoriaAtom);
  const [sw] = useAtom(swAtom);
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [isLoaded, setIsLoaded] = useState(false);

  const addMemoria = (
    prev: MemoriaWithConcentration[],
    newMemoria: Memoria,
  ) => {
    return [...prev, { ...newMemoria, concentration: 4 }];
  };
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
                          setLegendaryDeck((prev) =>
                            addMemoria(prev, memoria[index]),
                          );
                          Cookies.set(
                            'deck',
                            encodeDeck(
                              sw,
                              deck,
                              addMemoria(legendaryDeck, memoria[index]),
                            ),
                          );
                        } else {
                          setDeck((prev) => addMemoria(prev, memoria[index]));
                          Cookies.set(
                            'deck',
                            encodeDeck(
                              sw,
                              addMemoria(deck, memoria[index]),
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

const fstAtom = atomWithStorage('fst', true);

export function DeckBuilder() {
  const params = useSearchParams();
  const [deck, setDeck] = useAtom(deckAtom);
  const [legendaryDeck, setLegendaryDeck] = useAtom(legendaryDeckAtom);
  const [sw, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);
  const value = params.get('deck');
  const pathname = usePathname();
  const [fst, setFst] = useAtom(fstAtom);

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
    if (fst) {
      setFst(false);
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
    }
  }, [setDeck, setLegendaryDeck, setRoleFilter, setSw, value, fst, setFst]);

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
