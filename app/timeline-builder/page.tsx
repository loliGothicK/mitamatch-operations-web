'use client';

import { type FormEvent, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAtom } from 'jotai';

import {
  Add,
  DragIndicator,
  Edit,
  LinkSharp,
  Remove,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/system';

import { decodeTimeline, encodeTimeline } from '@/actions/serde';
import { Layout } from '@/components/Layout';
import Sortable from '@/components/sortable/Sortable';
import {
  type OrderWithPic,
  filterAtom,
  filteredOrderAtom,
  payedAtom,
  timelineAtom,
} from '@/jotai/orderAtoms';

import { useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { takeLeft } from 'fp-ts/Array';
import Cookies from 'js-cookie';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { AutoSizer, List as VirtulizedList } from 'react-virtualized';

function Info({ order }: { order: OrderWithPic }) {
  if (order.pic && order.sub && order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.pic} / {order.sub} ] (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  }
  if (order.pic && order.sub) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.pic} / {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.sub && order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.sub} ] (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  }
  if (order.pic && order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.pic} ] (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  }
  if (order.pic) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.pic} ]
        </Typography>
      </Stack>
    );
  }
  if (order.sub) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          [ {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.delay) {
    return (
      <Stack direction={'row'} alignItems={'center'} spacing={1}>
        <Typography variant='body1'>{order.name}</Typography>
        <Typography variant='body2' fontSize={10}>
          (+{order.delay} sec)
        </Typography>
      </Stack>
    );
  }
  return <Typography variant='body1'>{order.name}</Typography>;
}

function TimelineItem({ order, left }: { order: OrderWithPic; left: number }) {
  const [, setTimeline] = useAtom(timelineAtom);
  const {
    isDragging,
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id: order.id,
  });
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Number.POSITIVE_INFINITY : 'auto',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Divider textAlign={'left'} sx={{ paddingLeft: 0 }}>
        <Typography fontSize={10}>
          {`${left < 0 ? '-' : ''}${Math.trunc(left / 60)}`}:
          {Math.abs(left % 60)
            .toString()
            .padStart(2, '0')}
        </Typography>
      </Divider>
      <Stack direction={'row'} padding={0} alignItems={'center'}>
        <div {...attributes} {...listeners}>
          <DragIndicator sx={{ color: 'dimgrey' }} />
        </div>
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
            setTimeline(prev => {
              Cookies.set(
                'timeline',
                encodeTimeline(prev.filter(o => o.id !== order.id)),
              );
              return prev.filter(o => o.id !== order.id);
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
            const formJson = Object.fromEntries(formData.entries());
            setTimeline(prev =>
              prev.map(o =>
                o.id === order.id
                  ? {
                      ...o,
                      delay: Number.parseInt(formJson.delay as string),
                      pic: formJson.pic as string,
                      sub: formJson.sub as string,
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
          <TextField
            autoFocus
            defaultValue={order.delay}
            margin='dense'
            id='delay'
            name='delay'
            label='delay'
            type='number'
            fullWidth
            variant='standard'
          />
          <TextField
            autoFocus
            defaultValue={order.pic}
            margin='dense'
            id='pic'
            name='pic'
            label='PIC'
            fullWidth
            variant='standard'
          />
          <TextField
            autoFocus
            defaultValue={order.sub}
            margin='dense'
            id='sub'
            name='sub'
            label='Sub PIC'
            fullWidth
            variant='standard'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type='submit'>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function Timeline() {
  const [timeline, setTimeline] = useAtom(timelineAtom);

  const reducer = (
    value: number,
    order: OrderWithPic,
    index: number,
  ): number => {
    const prepareTime =
      index === 0
        ? order.prepare_time
        : timeline[index - 1].name.includes('戦術加速')
          ? 5
          : order.prepare_time;
    const delay =
      index > timeline.length - 2 ? 0 : timeline[index + 1].delay || 0;
    return value - prepareTime - order.active_time - delay;
  };

  return timeline.length === 0 ? (
    <></>
  ) : (
    <Sortable
      items={timeline}
      onChangeOrder={setTimeline}
      strategy={verticalListSortingStrategy}
    >
      <List sx={{ width: '100%', maxWidth: '65vh', overflow: 'auto' }}>
        {timeline.map((order, index) => (
          <TimelineItem
            key={order.id}
            order={order}
            left={takeLeft(index)(timeline).reduce(reducer, 900)}
          />
        ))}
        <Divider textAlign={'left'} sx={{ paddingLeft: 0 }}>
          <Typography fontSize={10}>
            {(() => {
              const left = takeLeft(timeline.length)(timeline).reduce(
                reducer,
                900,
              );
              return `${left < 0 ? '-' : ''}${Math.trunc(left / 60)}:${Math.abs(
                left % 60,
              )
                .toString()
                .padStart(2, '0')}`;
            })()}
          </Typography>
        </Divider>
      </List>
    </Sortable>
  );
}

function Source() {
  const [orders] = useAtom(filteredOrderAtom);
  const [timeline, setSelectedOrder] = useAtom(timelineAtom);
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
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
                    edge='start'
                    aria-label='comments'
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 10,
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                    }}
                    onClick={() => {
                      if (
                        orders[index].kind.includes('Elemental') &&
                        timeline.some(order => {
                          return order.kind === orders[index].kind;
                        })
                      ) {
                        setOpen(true);
                        return;
                      }
                      setSelectedOrder(prev => {
                        const delay = prev.length === 0 ? undefined : 5;
                        Cookies.set(
                          'timeline',
                          encodeTimeline([
                            ...prev,
                            { ...orders[index], delay },
                          ]),
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
                    <Typography variant='body1'>
                      {orders[index].name}
                    </Typography>
                    <Divider />
                    <Typography variant='body2'>
                      {orders[index].effect}
                    </Typography>
                    <Typography variant='body2' fontSize={10}>
                      {orders[index].description}
                    </Typography>
                  </Stack>
                </Stack>
              );
            }}
          />
        )}
      </AutoSizer>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={handleClose}
        message='同属性オーダーがすでにタイムラインに存在します'
      />
    </>
  );
}

function FilterMenu() {
  const [filter, setFilter] = useAtom(filterAtom);
  return (
    <PopupState
      variant='popover'
      popupId='demo-popup-menu'
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {popupState => (
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
            ).map(kind => {
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
  const [, setPayed] = useAtom(payedAtom);
  const params = useSearchParams();

  const shareHandler = async () => {
    try {
      await navigator.clipboard.writeText(
        `https://mitama.io/${pathname}?timeline=${encodeTimeline(timeline)}`,
      );
      alert('クリップボードに保存しました。');
    } catch (_error) {
      alert('失敗しました。');
    }
  };

  useEffect(() => {
    const value = params.get('timeline');
    if (value) {
      setTimeline(decodeTimeline(value));
    } else {
      const cookie = Cookies.get('timeline');
      if (cookie) {
        setTimeline(decodeTimeline(cookie));
      }
    }
  }, [setTimeline, params.get]);

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
              <IconButton aria-label='share'>
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
            <Box
              flexDirection='row'
              justifyContent='flex-end'
              display='flex'
              alignItems={'center'}
              paddingRight={20}
            >
              <FilterMenu />
              <Divider orientation='vertical' flexItem sx={{ margin: 1 }} />
              <Typography>無課金</Typography>
              <Switch defaultChecked onChange={() => setPayed(prev => !prev)} />
              <Typography>課金</Typography>
            </Box>
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
