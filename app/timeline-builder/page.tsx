'use client';

import { FormEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAtom } from 'jotai';

import { Add, Edit, LinkSharp, Remove } from '@mui/icons-material';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItem,
  ListItemAvatar,
  Menu,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useMediaQuery } from '@mui/system';

import { decodeTimeline, encodeTimeline } from '@/actions/serde';
import { Layout } from '@/component/Layout';
import {
  filterAtom,
  filteredOrderAtom,
  OrderWithPIC,
  timelineAtom,
} from '@/jotai/orderAtoms';

import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { takeLeft } from 'fp-ts/Array';
import Cookies from 'js-cookie';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { AutoSizer, List as VirtulizedList } from 'react-virtualized';

function Info({ order }: { order: OrderWithPIC }) {
  if (order.pic && order.sub && order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} / {order.sub} ] (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  } else if (order.pic && order.sub) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} / {order.sub} ]
        </Typography>
      </Stack>
    );
  } else if (order.pic && order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} ] (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  } else if (order.pic) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} ]
        </Typography>
      </Stack>
    );
  } else if (order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  } else {
    return <Typography variant="body1">{order.name}</Typography>;
  }
}

function TimelineItem({ order, left }: { order: OrderWithPIC; left: number }) {
  const [, setTimeline] = useAtom(timelineAtom);
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      id: order.id,
    });
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Divider textAlign={'left'} sx={{ paddingLeft: 0 }}>
        <Typography fontSize={10}>
          {Math.floor(left / 60)}:{(left % 60).toString().padStart(2, '0')}
        </Typography>
      </Divider>
      <Stack direction={'row'} padding={0} alignItems={'center'}>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
          }}
        >
          <Stack direction={'row'} padding={0} alignItems={'center'}>
            <ListItem key={order.id} sx={{ padding: 0 }}>
              <ListItemAvatar>
                <Avatar>
                  <Image
                    src={`/order/${order.name}.png`}
                    alt={order.name}
                    width={50}
                    height={50}
                  />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Info order={order} />}
                secondary={order.effect}
              />
            </ListItem>
          </Stack>
        </div>
        <IconButton
          size={'small'}
          sx={{
            position: 'absolute',
            right: 0,
            color: 'rgba(255, 50, 50, 0.9)',
            bgcolor: 'rgba(0, 0, 0, 0.05)',
          }}
          aria-label={`remove ${order.name}`}
          onClick={() => {
            // remove order from timeline
            setTimeline((prev) => {
              Cookies.set(
                'timeline',
                encodeTimeline(prev.filter((o) => o.id !== order.id)),
              );
              return prev.filter((o) => o.id !== order.id);
            });
          }}
        >
          <Remove />
        </IconButton>
        <IconButton
          size={'small'}
          sx={{
            position: 'absolute',
            right: 50,
            color: 'secondary',
            bgcolor: 'rgba(0, 0, 0, 0.05)',
          }}
          aria-label={`remove ${order.name}`}
          onClick={handleClickOpen}
        >
          <Edit />
        </IconButton>
      </Stack>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            setTimeline((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      delay: formJson.delay,
                      pic: formJson.pic,
                      sub: formJson.sub,
                    }
                  : o,
              ),
            );
            handleClose();
          },
        }}
      >
        <DialogTitle>Edit</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <TextField
            autoFocus
            defaultValue={order.delay}
            margin="dense"
            id="delay"
            name="delay"
            label="delay"
            type="number"
            fullWidth
            variant="standard"
          />
          <TextField
            autoFocus
            defaultValue={order.pic}
            margin="dense"
            id="pic"
            name="pic"
            label="PIC"
            fullWidth
            variant="standard"
          />
          <TextField
            autoFocus
            defaultValue={order.sub}
            margin="dense"
            id="sub"
            name="sub"
            label="Sub PIC"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Timeline() {
  const [timeline, setTimeline] = useAtom(timelineAtom);

  return timeline.length == 0 ? (
    <></>
  ) : (
    <DndContext
      onDragEnd={(event) => {
        const { active, over } = event;
        if (over == null) {
          return;
        }
        if (active.id !== over.id) {
          setTimeline((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }}
    >
      <SortableContext items={timeline}>
        <List sx={{ width: '100%', maxWidth: '65vh', overflow: 'auto' }}>
          {timeline.map((order, index) => (
            <TimelineItem
              order={order}
              left={takeLeft(index)(timeline).reduce(
                (value: number, order: OrderWithPIC, index): number => {
                  const prepareTime =
                    index == 0
                      ? order.prepare_time
                      : timeline[index - 1].name.includes('戦術加速')
                        ? 5
                        : order.prepare_time;
                  const delay =
                    index > timeline.length - 2
                      ? 0
                      : timeline[index + 1].delay || 0;
                  return value - prepareTime - order.active_time - delay;
                },
                900,
              )}
            />
          ))}
          <Divider textAlign={'left'} sx={{ paddingLeft: 0 }}>
            <Typography fontSize={10}>
              {Math.floor(
                takeLeft(timeline.length)(timeline).reduce(
                  (value: number, order: OrderWithPIC, index): number => {
                    const prepareTime =
                      index == 0
                        ? order.prepare_time
                        : timeline[index - 1].name.includes('戦術加速')
                          ? 5
                          : order.prepare_time;
                    const delay =
                      index > timeline.length - 2
                        ? 0
                        : timeline[index + 1].delay || 0;
                    return value - prepareTime - order.active_time - delay;
                  },
                  900,
                ) / 60,
              )}
              :
              {(
                takeLeft(timeline.length)(timeline).reduce(
                  (value: number, order: OrderWithPIC, index): number => {
                    const prepareTime =
                      index == 0
                        ? order.prepare_time
                        : timeline[index - 1].name.includes('戦術加速')
                          ? 5
                          : order.prepare_time;
                    const delay =
                      index > timeline.length - 2
                        ? 0
                        : timeline[index + 1].delay || 0;
                    return value - prepareTime - order.active_time - delay;
                  },
                  900,
                ) % 60
              )
                .toString()
                .padStart(2, '0')}
            </Typography>
          </Divider>
        </List>
      </SortableContext>
    </DndContext>
  );
}

function Source() {
  const [orders] = useAtom(filteredOrderAtom);
  const [, setSelectedOrder] = useAtom(timelineAtom);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <VirtulizedList
          height={height}
          width={width}
          rowCount={orders.length}
          rowHeight={100}
          rowRenderer={({ key, index, style }) => {
            return (
              <Stack
                key={key}
                style={style}
                direction={'row'}
                alignItems={'center'}
              >
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
                    setSelectedOrder((prev) => {
                      const delay = prev.length == 0 ? undefined : 5;
                      Cookies.set(
                        'timeline',
                        encodeTimeline([...prev, { ...orders[index], delay }]),
                      );
                      return [...prev, { ...orders[index], delay }];
                    });
                  }}
                >
                  <Add color={'warning'} />
                </IconButton>
                <Image
                  src={`/order/${orders[index].name}.png`}
                  alt={orders[index].name}
                  width={100}
                  height={100}
                />
                <Stack marginLeft={2}>
                  <Typography variant="body1">{orders[index].name}</Typography>
                  <Divider />
                  <Typography variant="body2">
                    {orders[index].effect}
                  </Typography>
                  <Typography variant="body2" fontSize={10}>
                    {orders[index].description}
                  </Typography>
                </Stack>
              </Stack>
            );
          }}
        />
      )}
    </AutoSizer>
  );
}

function FilterMenu() {
  const [filter, setFilter] = useAtom(filterAtom);
  return (
    <PopupState
      variant="popover"
      popupId="demo-popup-menu"
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {(popupState) => (
        <>
          <Button {...bindTrigger(popupState)}>{filter}</Button>
          <Menu {...bindMenu(popupState)}>
            {(
              [
                'Usually',
                'Elemental',
                'Buff',
                'DeBuff',
                'Mp',
                'TriggerRateFluctuation',
                'Shield',
                'Formation',
                'Stack',
                'Other',
              ] as const
            ).map((kind) => {
              return (
                <MenuItem
                  key={kind}
                  onClick={() => {
                    popupState.close();
                    setFilter(kind);
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

export default function TimelineBuilder() {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('lg'));
  const pathname = usePathname();
  const [timeline, setTimeline] = useAtom(timelineAtom);
  const params = useSearchParams();
  const value = params.get('deck');

  const shareHandler = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://mitama.io/${pathname}?timeline=${encodeTimeline(timeline)}`,
      );
      alert('クリップボードに保存しました。');
    } catch (error) {
      alert('失敗しました。');
    }
  };

  useEffect(() => {
    if (value) {
      setTimeline(decodeTimeline(value));
    } else {
      const cookie = Cookies.get('timeline');
      if (cookie) {
        setTimeline(decodeTimeline(cookie));
      }
    }
  }, [value]);

  return (
    <Layout>
      <Grid container direction={'row'} alignItems={'right'}>
        <Grid
          container
          item
          spacing={2}
          xs={12}
          direction={'row'}
          alignItems={'left'}
          flexShrink={1}
        >
          <Grid item xs={12} md={6} lg={6} alignItems={'center'}>
            <Link
              href={`/timeline-builder?timeline=${encodeTimeline(timeline)}`}
              onClick={shareHandler}
            >
              <IconButton aria-label="share">
                <LinkSharp />
              </IconButton>
            </Link>
            <Container
              maxWidth={false}
              sx={{
                bgcolor: 'grey',
                minHeight: '70vh',
                maxWidth: matches ? '25vw' : '100%',
              }}
            >
              <Timeline />
            </Container>
          </Grid>
          <Grid item xs={12} md={6} lg={6}>
            <FilterMenu />
            <Container
              maxWidth={false}
              sx={{
                bgcolor: 'grey',
                minHeight: '70vh',
                maxWidth: matches ? '25vw' : '100%',
              }}
            >
              <Source />
            </Container>
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
}
