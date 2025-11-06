"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useId, useState } from "react";

import {
  Add,
  Assignment,
  DragIndicator,
  Edit,
  Remove,
  Share,
} from "@mui/icons-material";
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
  alpha,
  Card,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/system";

import { decodeTimeline, encodeTimeline } from "@/endec/serde";
import { Layout } from "@/components/Layout";
import Sortable from "@/components/sortable/Sortable";
import {
  type OrderWithPic,
  filterAtom,
  filteredOrderAtom,
  payedAtom,
  rwTimelineAtom,
  timelineTitleAtom,
} from "@/jotai/orderAtoms";

import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { takeLeft } from "fp-ts/Array";
import Cookies from "js-cookie";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { Virtuoso } from "react-virtuoso";
import { generateShortLink, saveShortLink } from "@/actions/permlink";
import { restore } from "@/actions/restore";

function Info({ order }: { order: OrderWithPic }) {
  if (order.pic && order.sub && order.delay) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} / {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.pic && order.sub) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} / {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.sub && order.delay) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.pic && order.delay) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} ]
        </Typography>
      </Stack>
    );
  }
  if (order.pic) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.pic} ]
        </Typography>
      </Stack>
    );
  }
  if (order.sub) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
        <Typography variant="body2" fontSize={10}>
          [ {order.sub} ]
        </Typography>
      </Stack>
    );
  }
  if (order.delay) {
    return (
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <Typography variant="body1">{order.name}</Typography>
      </Stack>
    );
  }
  return <Typography variant="body1">{order.name}</Typography>;
}

function TimelineItem({ order, left }: { order: OrderWithPic; left: number }) {
  const [, setTimeline] = useAtom(rwTimelineAtom);
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
  const uniqueId = useId();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Number.POSITIVE_INFINITY : "auto",
    touchAction: "none",
  };

  const timeFormat = ({
    delay,
    prepare_time,
    active_time,
  }: OrderWithPic): string => {
    const totalTime = (delay || 0) + (prepare_time || 0) + (active_time || 0);
    return `${totalTime} (${delay ? `${delay}` : ""}${prepare_time ? `+${prepare_time}` : ""}${active_time ? `+${active_time}` : ""}) s`;
  };

  const starts = left - (order.delay || 0);

  return (
    <div ref={setNodeRef} style={style}>
      <Divider textAlign={"left"} sx={{ paddingLeft: 0 }}>
        <Typography fontSize={10}>
          {`${starts < 0 ? "-" : ""}${Math.trunc(starts / 60)}`}:
          {Math.abs(starts % 60)
            .toString()
            .padStart(2, "0")}
        </Typography>
      </Divider>
      <Stack direction={"row"} padding={0} alignItems={"center"}>
        <div {...attributes} {...listeners}>
          <DragIndicator sx={{ color: "dimgrey", touchAction: "none" }} />
        </div>
        <Stack direction={"row"} padding={0} alignItems={"center"}>
          <Tooltip title={timeFormat(order)} placement="top">
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
          </Tooltip>
        </Stack>
        <IconButton
          size={"small"}
          sx={{
            position: "absolute",
            right: 0,
            color: "rgba(255, 50, 50, 0.9)",
            bgcolor: "rgba(0, 0, 0, 0.05)",
          }}
          aria-label={`remove ${order.name}`}
          onClick={() => {
            // remove order from timeline
            setTimeline((prev) => {
              Cookies.set(
                "timeline",
                encodeTimeline(prev.filter((o) => o.id !== order.id)),
              );
              return prev.filter((o) => o.id !== order.id);
            });
          }}
        >
          <Remove />
        </IconButton>
        <IconButton
          size={"small"}
          sx={{
            position: "absolute",
            right: 50,
            color: "secondary",
            bgcolor: "rgba(0, 0, 0, 0.05)",
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
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const formJson = Object.fromEntries(formData.entries());
              setTimeline((prev) =>
                prev.map((o) =>
                  o.id === order.id
                    ? {
                        ...o,
                        delay: Number.parseInt(formJson.delay as string, 10),
                        pic: formJson.pic as string,
                        sub: formJson.sub as string,
                      }
                    : o,
                ),
              );
              handleClose();
            },
          },
        }}
      >
        <DialogTitle>Edit</DialogTitle>
        <DialogContent>
          <TextField
            defaultValue={order.delay}
            margin="dense"
            id={`delay-${uniqueId}`}
            name="delay"
            label="delay"
            type="number"
            fullWidth
            variant="standard"
          />
          <TextField
            defaultValue={order.pic}
            margin="dense"
            id={`pic-${uniqueId}`}
            name="pic"
            label="PIC"
            fullWidth
            variant="standard"
          />
          <TextField
            defaultValue={order.sub}
            margin="dense"
            id={`sub-${uniqueId}`}
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
    </div>
  );
}

function Timeline() {
  const [, setTitle] = useAtom(timelineTitleAtom);
  const [timeline, setTimeline] = useAtom(rwTimelineAtom);
  const params = useSearchParams();

  useEffect(() => {
    (async () => {
      const value = params.get("timeline");
      const title = params.get("title");
      setTitle(title ? decodeURI(title) : "No Title");
      const cookie = Cookies.get("timeline");
      if (value) {
        const timeline = await restore({ target: "timeline", param: value });
        setTimeline(timeline);
      } else if (cookie) {
        const decodeResult = decodeTimeline(cookie);
        if (decodeResult.isOk()) {
          setTimeline(decodeResult.value);
        }
      }
    })();
  }, [setTitle, setTimeline, params]);

  const reducer = (
    left: number,
    order: OrderWithPic,
    index: number,
  ): number => {
    const prepareTime =
      index === 0
        ? order.prepare_time
        : timeline[index - 1].name.includes("戦術加速")
          ? 5
          : order.prepare_time;
    const delay =
      index > timeline.length - 2 ? 0 : timeline[index + 1].delay || 0;
    return left - prepareTime - order.active_time - delay;
  };

  return (
    timeline.length !== 0 && (
      <Sortable
        items={timeline}
        onChangeOrder={setTimeline}
        strategy={verticalListSortingStrategy}
      >
        <List sx={{ width: "100%", maxWidth: "65vh", overflow: "auto" }}>
          {timeline.map((order, index) => (
            <TimelineItem
              key={order.id}
              order={order}
              left={takeLeft(index)(timeline).reduce(reducer, 900)}
            />
          ))}
          <Divider textAlign={"left"} sx={{ paddingLeft: 0 }}>
            <Typography fontSize={10}>
              {(() => {
                const left = takeLeft(timeline.length)(timeline).reduce(
                  reducer,
                  900,
                );
                return `${left < 0 ? "-" : ""}${Math.trunc(left / 60)}:${Math.abs(
                  left % 60,
                )
                  .toString()
                  .padStart(2, "0")}`;
              })()}
            </Typography>
          </Divider>
        </List>
      </Sortable>
    )
  );
}

function Source() {
  const [orders] = useAtom(filteredOrderAtom);
  const [timeline, setSelectedOrder] = useAtom(rwTimelineAtom);
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Virtuoso
        style={{ height: "70vh", width: "100%", padding: 0 }}
        totalCount={orders.length}
        computeItemKey={(index) => orders[index].id}
        itemContent={(index) => {
          return (
            <Card
              sx={{
                display: "flex",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : alpha(theme.palette.primary.main, 0.2),
              }}
              key={index}
            >
              <IconButton
                sx={{
                  position: "absolute",
                  left: 0,
                  bgcolor: "rgba(0, 0, 0, 0.2)",
                }}
                onClick={() => {
                  if (
                    orders[index].kind.includes("Elemental") &&
                    !orders[index].kind.includes("Special") &&
                    timeline.some((order) => {
                      return order.kind === orders[index].kind;
                    })
                  ) {
                    setOpen(true);
                    return;
                  }
                  setSelectedOrder((prev) => {
                    const delay = prev.length === 0 ? undefined : 5;
                    Cookies.set(
                      "timeline",
                      encodeTimeline([...prev, { ...orders[index], delay }]),
                    );
                    return [...prev, { ...orders[index], delay }];
                  });
                }}
              >
                <Add color={"warning"} />
              </IconButton>
              <Image
                src={`/order/${orders[index].name}.png`}
                alt={orders[index].name}
                width={100}
                height={100}
                priority={index < 8}
              />
              <Stack marginLeft={2}>
                <Typography variant="body1">{orders[index].name}</Typography>
                <Divider />
                <Typography variant="body2">{orders[index].effect}</Typography>
                <Typography
                  variant="body2"
                  fontSize={10}
                  sx={{ display: { xs: "none", md: "none", lg: "block" } }}
                >
                  {orders[index].description}
                </Typography>
              </Stack>
            </Card>
          );
        }}
      />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={open}
        onClose={handleClose}
        message="同属性オーダーがすでにタイムラインに存在します"
      />
    </>
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
                "Usually",
                "Elemental",
                "Buff",
                "DeBuff",
                "Mp",
                "TriggerRateFluctuation",
                "Shield",
                "Formation",
                "Stack",
                "Other",
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

function ShareButton() {
  const [title] = useAtom(timelineTitleAtom);
  const [timeline] = useAtom(rwTimelineAtom);
  const [modalOpen, setModalOpen] = useState<"short" | "full" | false>(false);
  const [openTip, setOpenTip] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("");

  const handleClick = (mode: "short" | "full") => {
    setModalOpen(mode);
  };
  const handleClose = () => {
    setModalOpen(false);
    setOpenTip(false);
  };
  const handleCloseTip = (): void => {
    setOpenTip(false);
  };
  const handleClickButton = async (): Promise<void> => {
    setOpenTip(true);
    await navigator.clipboard.writeText(url);
  };

  const full = encodeTimeline(timeline);

  return (
    <PopupState
      variant="popover"
      popupId="demo-popup-menu"
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {(popupState) => (
        <>
          <Button {...bindTrigger(popupState)}>
            <Share />
          </Button>
          <Menu {...bindMenu(popupState)}>
            <MenuItem
              onClick={async () => {
                popupState.close();
                handleClick("short");
                const short = await generateShortLink({ full });
                setUrl(
                  `https://operations.mitama.io/timeline-builder?timeline=${short}&title=${encodeURI(title)}`,
                );
                await saveShortLink({ target: "timeline", full, short });
              }}
            >
              {"short link"}
            </MenuItem>
            <MenuItem
              onClick={() => {
                popupState.close();
                handleClick("full");
                setUrl(
                  `https://operations.mitama.io/timeline-builder?timeline=${full}`,
                );
              }}
            >
              {"full link"}
            </MenuItem>
          </Menu>
          <Dialog
            open={modalOpen !== false}
            onClose={handleClose}
            aria-labelledby="form-dialog-title"
            fullWidth={true}
          >
            <DialogContent>
              <FormControl
                variant="outlined"
                fullWidth={true}
                onClick={(e) => e.stopPropagation()}
              >
                <OutlinedInput
                  type="text"
                  value={url}
                  fullWidth={true}
                  endAdornment={
                    <InputAdornment position="end">
                      <Tooltip
                        arrow
                        open={openTip}
                        onClose={handleCloseTip}
                        disableHoverListener
                        placement="top"
                        title="Copied!"
                      >
                        <IconButton onClick={handleClickButton}>
                          <Assignment />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </PopupState>
  );
}

function TimelineBuilder() {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("lg"));
  const [, setPayed] = useAtom(payedAtom);

  return (
    <Grid
      container
      spacing={2}
      size={{ xs: 12 }}
      direction={"row"}
      alignItems={"left"}
      margin={2}
    >
      <Grid size={{ xs: 12, md: 8, lg: 8 }} alignItems={"center"} mt={5}>
        <Container
          maxWidth={false}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255, 0.1)"
                : alpha(theme.palette.primary.main, 0.2),
            minHeight: "80vh",
            maxWidth: matches ? "30vw" : "100%",
          }}
        >
          <Suspense>
            <Timeline />
          </Suspense>
        </Container>
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 4 }}>
        <Box
          flexDirection="row"
          justifyContent="flex-end"
          display="flex"
          alignItems={"center"}
          paddingRight={20}
        >
          <ShareButton />
          <FilterMenu />
          <Divider orientation="vertical" flexItem sx={{ margin: 1 }} />
          <Typography>無課金</Typography>
          <Switch defaultChecked onChange={() => setPayed((prev) => !prev)} />
          <Typography>課金</Typography>
        </Box>
        <Container
          maxWidth={false}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255, 0.1)"
                : alpha(theme.palette.primary.main, 0.2),
            minHeight: "80vh",
            maxWidth: matches ? "25vw" : "100%",
            paddingTop: 5,
          }}
        >
          <Source />
        </Container>
      </Grid>
    </Grid>
  );
}

export function TimelineBuilderPage() {
  return (
    <Layout>
      <TimelineBuilder />
    </Layout>
  );
}
