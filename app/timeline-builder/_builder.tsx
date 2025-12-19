"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { type FormEvent, SetStateAction, Suspense, useCallback, useId, useState } from "react";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { Add, Assignment, DragIndicator, Edit, Remove, Share } from "@mui/icons-material";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/system";

import { encodeTimeline } from "@/endec/serde";
import Sortable from "@/components/sortable/Sortable";
import {
  filterAtom,
  filteredOrderAtom,
  type OrderWithPic,
  payedAtom,
  timelineAtom,
  timelineTitleAtom,
} from "@/jotai/orderAtoms";

import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { Virtuoso } from "react-virtuoso";
import { saveShortLink } from "@/actions/permlink";
import { restore } from "@/actions/restore";
import {
  ComputedOrder,
  formatTime,
  normalizeTimeline,
  useComputedTimeline,
} from "@/timeline-builder/_hook";
import { match } from "ts-pattern";
import { identity } from "fp-ts/function";
import { useAsync } from "react-use";
import { ulid } from "ulid";

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

function TimelineItem({ order }: { order: ComputedOrder }) {
  const [, setTimeline] = useAtom(timelineAtom);
  const { isDragging, setNodeRef, attributes, listeners, transform, transition } = useSortable({
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

  return (
    <div ref={setNodeRef} style={style}>
      <Divider textAlign={"left"}>
        <Typography
          variant="caption"
          component="span"
          sx={{
            whiteSpace: "nowrap", // 改行防止
            color: order.activationTime < 0 ? "error.main" : "text.primary", // 時間超過チェック
          }}
        >
          {/* 1. 発動時点での時間 (Parepare Start Time) */}
          <span style={{ fontWeight: "bold", fontSize: "12px" }}>
            {formatTime(order.prepareStartTime)}
          </span>
          {/* 2. -> 準備時間 -> (経過した時間を示す) */}
          <span style={{ color: "dimgray", margin: "0 8px", fontSize: "10px" }}>
            {" -> Prep:"}
            {order.actualPrepareTime}s{" -> "}
          </span>
          {/* 3. 効果終了時点の時間 (End Time) */}
          <span style={{ color: "primary.main", fontSize: "12px" }}>
            {formatTime(order.endTime)}
          </span>
        </Typography>
      </Divider>
      <Stack direction={"row"} padding={0} alignItems={"center"}>
        <div {...attributes} {...listeners}>
          <DragIndicator sx={{ color: "dimgrey", touchAction: "none" }} />
        </div>
        <Stack direction={"row"} padding={0} alignItems={"center"}>
          <Tooltip title={order.description} placement="top">
            <ListItem key={order.id} sx={{ padding: 0 }}>
              <ListItemAvatar>
                <Avatar>
                  <Image src={`/order/${order.name}.png`} alt={order.name} width={50} height={50} />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Info order={order} />} secondary={order.effect} />
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
              setTimeline((prev) => {
                return prev.map((o) =>
                  o.id === order.id
                    ? {
                        ...o,
                        delay: match(formJson.delay as string)
                          .with("", () => ({ source: "auto" as const }))
                          .otherwise((value) => ({
                            source: "manual",
                            value: Number.parseInt(value, 10),
                          })),
                        pic: match(formJson.pic as string)
                          .with("", () => undefined)
                          .otherwise(identity),
                        sub: match(formJson.sub as string)
                          .with("", () => undefined)
                          .otherwise(identity),
                      }
                    : o,
                );
              });
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
  const [timeline, setTimeline] = useAtom(timelineAtom);
  const params = useSearchParams();

  const handleChange = useCallback(
    (action: SetStateAction<OrderWithPic[]>) => {
      if (typeof action === "function") {
        setTimeline((prev) => {
          return normalizeTimeline(action(prev));
        });
      } else {
        const newTimeline = normalizeTimeline(action);
        setTimeline(newTimeline);
      }
    },
    [setTimeline],
  );

  // ■ ここで計算済みデータを取得
  const computedOrders = useComputedTimeline(timeline);

  useAsync(async () => {
    const value = params.get("timeline");
    const title = params.get("title");
    if (title) setTitle(decodeURI(title));
    else setTitle("No Title");

    if (value) {
      const restored = await restore({ target: "timeline", param: value });
      setTimeline(restored);
    }
  }, [setTitle, setTimeline, params]);

  return (
    timeline.length !== 0 && (
      <Sortable
        items={timeline}
        onChangeOrder={handleChange}
        strategy={verticalListSortingStrategy}
        dnd={{
          modifiers: [restrictToVerticalAxis],
        }}
      >
        <List sx={{ width: "100%", maxWidth: "65vh", overflow: "auto" }}>
          {computedOrders.map((order) => (
            // TimelineItemに計算済みの start (wait開始時間) を渡す
            <TimelineItem key={order.id} order={order} />
          ))}

          {/* 最後の終了時間表示 */}
          <Divider textAlign={"left"}>
            <Typography fontSize={12} sx={{ fontWeight: "bold" }}>
              {computedOrders.length > 0
                ? formatTime(computedOrders[computedOrders.length - 1].endTime)
                : "15:00"}
            </Typography>
          </Divider>
        </List>
      </Sortable>
    )
  );
}

function Source() {
  const [orders] = useAtom(filteredOrderAtom);
  const [timeline, setTimeline] = useAtom(timelineAtom);
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddOrder = (index: number) => {
    if (
      timeline.some(
        (order) =>
          orders[index].effect.replace(/^(.+)Lv.\d/g, "$1").replace(/(通常|特殊):/g, "") ===
            order.effect.replace(/^(.+)Lv.\d/g, "$1").replace(/(通常|特殊):/g, "") ||
          (orders[index].effect.includes("闇") &&
            !orders[index].effect.includes("光闇") &&
            order.effect.includes("闇") &&
            !order.effect.includes("光闇")) ||
          (orders[index].effect.includes("光") &&
            !orders[index].effect.includes("光闇") &&
            order.effect.includes("光") &&
            !order.effect.includes("光闇")),
      )
    ) {
      setOpen(true);
      return;
    }
    setTimeline((prev) => {
      const newOrder: OrderWithPic = {
        ...orders[index],
        delay: {
          source: "auto",
        },
      };
      return normalizeTimeline([...prev, newOrder]);
    });
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
                onClick={() => handleAddOrder(index)}
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
        message="同じカテゴリのオーダーは複数発動できません"
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
  const [timeline] = useAtom(timelineAtom);
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
                const short = ulid();
                setUrl(
                  `https://operations.mitama.io/timeline-builder?timeline=${short}&title=${encodeURI(title)}`,
                );
                await saveShortLink({ target: "timeline", timeline, short });
              }}
            >
              {"short link"}
            </MenuItem>
            <MenuItem
              onClick={() => {
                popupState.close();
                handleClick("full");
                setUrl(
                  `https://operations.mitama.io/timeline-builder?timeline=${encodeTimeline(timeline)}`,
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
              <FormControl variant="outlined" fullWidth={true} onClick={(e) => e.stopPropagation()}>
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

export function TimelineBuilderPage() {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("lg"));
  const [, setPayed] = useAtom(payedAtom);

  return (
    <Grid container spacing={2} size={{ xs: 12 }} direction={"row"} alignItems={"left"} margin={2}>
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
