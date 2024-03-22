'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useAtom } from 'jotai';

import { Add, LinkSharp, Remove } from '@mui/icons-material';
import {
  Avatar,
  Button,
  ListItem,
  ListItemAvatar,
  Menu,
  MenuItem,
  Stack,
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

import { Layout } from '@/component/Layout';
import { Order } from '@/domain/order/order';
import {
  filterAtom,
  filteredOrderAtom,
  timelineAtom,
} from '@/jotai/orderAtoms';

import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { takeLeft } from 'fp-ts/Array';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { AutoSizer, List as VirtulizedList } from 'react-virtualized';

function TimelineItem({ order, left }: { order: Order; left: number }) {
  const [, setTimeline] = useAtom(timelineAtom);
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      id: order.id,
    });

  return (
    <>
      {' '}
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
            <ListItemText primary={order.name} secondary={order.effect} />
          </ListItem>
        </div>
        <IconButton
          sx={{
            position: 'absolute',
            right: 0,
            color: 'rgba(255, 50, 50, 0.9)',
            bgcolor: 'rgba(0, 0, 0, 0.05)',
          }}
          aria-label={`remove ${order.name}`}
          onClick={() => {
            // remove order from timeline
            setTimeline((prev) => prev.filter((o) => o.id !== order.id));
          }}
        >
          <Remove />
        </IconButton>
      </Stack>
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
                (value: number, order: Order, index): number => {
                  const prepareTime =
                    index == 0
                      ? order.prepare_time
                      : timeline[index - 1].name.includes('戦術加速')
                        ? 5
                        : order.prepare_time;
                  return value - prepareTime - order.active_time;
                },
                900,
              )}
            />
          ))}
          <Divider textAlign={'left'} sx={{ paddingLeft: 0 }}>
            <Typography fontSize={10}>
              {Math.floor(
                takeLeft(timeline.length)(timeline).reduce(
                  (value: number, order: Order, index): number => {
                    const prepareTime =
                      index == 0
                        ? order.prepare_time
                        : timeline[index - 1].name.includes('戦術加速')
                          ? 5
                          : order.prepare_time;
                    return value - prepareTime - order.active_time;
                  },
                  900,
                ) / 60,
              )}
              :
              {(
                takeLeft(timeline.length)(timeline).reduce(
                  (value: number, order: Order, index): number => {
                    const prepareTime =
                      index == 0
                        ? order.prepare_time
                        : timeline[index - 1].name.includes('戦術加速')
                          ? 5
                          : order.prepare_time;
                    return value - prepareTime - order.active_time;
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
                    setSelectedOrder((prev) => [...prev, orders[index]]);
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
                  <Typography variant="body2">
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
            <Link href={`/timeline-builder`}>
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
