"use client";

import { useAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import {
  type SubmitEvent,
  SetStateAction,
  Suspense,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import {
  Add,
  Assignment,
  DragIndicator,
  Edit,
  Image as ImageIcon,
  Remove,
  Share,
  FilterList,
} from "@mui/icons-material";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import {
  alpha,
  Autocomplete,
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
import { OrderIcon } from "@/components/image/OrderIcon";
import { useMediaQuery } from "@mui/system";

import { encodeTimeline } from "@/endec/serde";
import { isSameLineage } from "@/domain/order/order";
import Sortable from "@/components/sortable/Sortable";
import {
  filterAtom,
  filteredOrderAtom,
  orderKinds,
  type OrderWithPic,
  payedAtom,
  timelineAtom,
  timelineTitleAtom,
} from "@/jotai/orderAtoms";

import { useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { Virtuoso } from "react-virtuoso";
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
import { ULID, ulid } from "ulid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTimelinesAction } from "@/_actions/timelines";
import { TimelineBuilderTour } from "@/timeline-builder/_tour";
import { AutoAssignButton } from "@/timeline-builder/_auto-assign";
import { TimelineShareCard } from "@/timeline-builder/_share-card";
import { copyNodeAsImage } from "@/components/share/copyImage";

export const TimelineItem = ({
  order,
  userData,
}: {
  order: ComputedOrder;
  userData?: UserData;
}) => {
  const [, setTimeline] = useAtom(timelineAtom);
  const { isDragging, setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: order.id,
  });
  const [open, setOpen] = useState(false);
  const uniqueId = useId();

  // Get a list of all unique member names from all legions the user belongs to
  const memberNames = Array.from(
    new Set(
      userData?.legions.flatMap((l) =>
        l.members
          ? l.members
              .filter((m) => m.orders.includes(order.name))
              .map((m) => m.displayName ?? m.name)
          : [],
      ) || [],
    ),
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
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
      <Stack
        direction={"row"}
        spacing={0}
        sx={{ p: 0, alignItems: "center", width: "100%", overflow: "hidden" }}
      >
        <div {...attributes} {...listeners}>
          <DragIndicator sx={{ color: "dimgrey", touchAction: "none" }} />
        </div>
        <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
          <Tooltip title={order.description} placement="top">
            <ListItem key={order.id} sx={{ padding: 0 }}>
              <ListItemAvatar sx={{ minWidth: 0, mr: 1.5, display: "flex", alignItems: "center" }}>
                <OrderIcon order={order} size={40} />
              </ListItemAvatar>
              {/* Desktop Layout (sm and up) - Restored to exact original */}
              <ListItemText
                sx={{ display: { xs: "none", sm: "block" }, pr: 1, overflow: "hidden" }}
                primary={
                  <Stack
                    direction={"row"}
                    spacing={1}
                    sx={{ alignItems: "baseline", overflow: "hidden", width: "100%" }}
                  >
                    <Typography variant="body1" noWrap sx={{ flexShrink: 0, fontWeight: "bold" }}>
                      {order.name}
                    </Typography>
                    {(order.pic || order.sub) && (
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontSize: 10, color: "text.secondary", flexShrink: 1, minWidth: 0 }}
                      >
                        [{[order.pic, order.sub].filter(Boolean).join(" / ")}]
                      </Typography>
                    )}
                  </Stack>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.effect}
                  </Typography>
                }
              />

              {/* Mobile Layout (xs only) - Effect on top, PIC on bottom, perfectly left-aligned */}
              <Box
                sx={{
                  display: { xs: "flex", sm: "none" },
                  flexGrow: 1,
                  overflow: "hidden",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {order.effect}
                </Typography>

                {(order.pic || order.sub) && (
                  <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                    [{[order.pic, order.sub].filter(Boolean).join(" / ")}]
                  </Typography>
                )}
              </Box>
            </ListItem>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, pr: 1 }}>
          <IconButton
            size={"small"}
            aria-label="Edit"
            sx={{
              color: "text.secondary",
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
            onClick={handleClickOpen}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size={"small"}
            aria-label="Remove"
            sx={{
              color: "error.main",
              bgcolor: "rgba(255, 0, 0, 0.05)",
              "&:hover": { bgcolor: "rgba(255, 0, 0, 0.1)" },
            }}
            onClick={() => {
              // remove order from timeline
              setTimeline((prev) => {
                return prev.filter((o) => o.id !== order.id);
              });
            }}
          >
            <Remove fontSize="small" />
          </IconButton>
        </Box>
      </Stack>
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (event: SubmitEvent<HTMLDivElement>) => {
              event.preventDefault();
              const formData = new FormData(event.target);
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
          {memberNames.length > 0 ? (
            <Autocomplete
              key={`autocomplete-pic-${order.pic ?? "empty"}`}
              freeSolo
              options={memberNames}
              defaultValue={order.pic ?? null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  id={`pic-${uniqueId}`}
                  name="pic"
                  label="PIC"
                  fullWidth
                  variant="standard"
                />
              )}
            />
          ) : (
            <TextField
              key={`textfield-pic-${order.pic ?? "empty"}`}
              defaultValue={order.pic}
              margin="dense"
              id={`pic-${uniqueId}`}
              name="pic"
              label="PIC"
              fullWidth
              variant="standard"
            />
          )}
          {memberNames.length > 0 ? (
            <Autocomplete
              key={`autocomplete-sub-${order.sub ?? "empty"}`}
              freeSolo
              options={memberNames}
              defaultValue={order.sub ?? null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  id={`sub-${uniqueId}`}
                  name="sub"
                  label="Sub PIC"
                  fullWidth
                  variant="standard"
                />
              )}
            />
          ) : (
            <TextField
              key={`textfield-sub-${order.sub ?? "empty"}`}
              defaultValue={order.sub}
              margin="dense"
              id={`sub-${uniqueId}`}
              name="sub"
              label="Sub PIC"
              fullWidth
              variant="standard"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export function Timeline({ userData }: { userData?: UserData }) {
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
            <TimelineItem key={order.id} order={order} userData={userData} />
          ))}

          {/* 最後の終了時間表示 */}
          <Divider textAlign={"left"}>
            <Typography sx={{ fontSize: 12, fontWeight: "bold" }}>
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

export function Source() {
  const [orders] = useAtom(filteredOrderAtom);
  const [timeline, setTimeline] = useAtom(timelineAtom);
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddOrder = (index: number) => {
    if (timeline.some((order) => isSameLineage(orders[index], order))) {
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
                  zIndex: 5,
                }}
                onClick={() => handleAddOrder(index)}
              >
                <Add color={"warning"} />
              </IconButton>
              <OrderIcon order={orders[index]} size={100} preload={index < 8} />
              <Stack sx={{ ml: 2 }}>
                <Typography variant="body1">{orders[index].name}</Typography>
                <Divider />
                <Typography variant="body2">{orders[index].effect}</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 10, display: { xs: "none", md: "none", lg: "block" } }}
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

export function FilterMenu() {
  const [filter, setFilter] = useAtom(filterAtom);
  const [payed, setPayed] = useAtom(payedAtom);
  return (
    <PopupState
      variant="popover"
      popupId="demo-popup-menu"
      disableAutoFocus={false}
      parentPopupState={null}
    >
      {(popupState) => (
        <>
          <Button startIcon={<FilterList />} {...bindTrigger(popupState)}>
            {filter}
          </Button>
          <Menu {...bindMenu(popupState)}>
            {/* Paid / Free Toggle Item */}
            <MenuItem
              onClick={(e) => {
                // Prevent menu from closing when toggling switch
                e.stopPropagation();
                setPayed((prev) => !prev);
              }}
            >
              <ListItemText primary={payed ? "課金" : "無課金"} sx={{ mr: 2 }} />
              <Switch checked={payed} sx={{ pointerEvents: "none" }} size="small" />
            </MenuItem>
            <Divider />
            {/* Order Kind Filters */}
            {orderKinds.map((kind) => {
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

export function ShareButton() {
  const [title] = useAtom(timelineTitleAtom);
  const [timeline] = useAtom(timelineAtom);
  const [modalOpen, setModalOpen] = useState<"short" | "full" | false>(false);
  const [openTip, setOpenTip] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("");
  const [toast, setToast] = useState<string | false>(false);
  const queryClient = useQueryClient();
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Mutations
  const mutation = useMutation({
    mutationFn: async (timelines: { timeline: OrderWithPic[]; short?: ULID }) =>
      saveTimelinesAction(timelines),
    onSuccess: async () => {
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });

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
  const handleCopyImage = async () => {
    const result = await copyNodeAsImage(shareCardRef, `${title || "timeline"}.png`);
    setToast(result === "copied" ? "Image copied." : "Image downloaded.");
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
          <Box sx={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none", zIndex: -1 }}>
            <div ref={shareCardRef}>
              <TimelineShareCard title={title} timeline={timeline} />
            </div>
          </Box>
          <Button {...bindTrigger(popupState)}>
            <Share />
          </Button>
          <Menu {...bindMenu(popupState)}>
            <MenuItem
              onClick={async () => {
                popupState.close();
                await handleCopyImage();
              }}
            >
              <ImageIcon fontSize="small" sx={{ mr: 1 }} />
              {"copy image"}
            </MenuItem>
            <MenuItem
              onClick={async () => {
                popupState.close();
                handleClick("short");
                const short = ulid();
                setUrl(
                  `https://operations.mitama.io/timeline-builder?timeline=${short}&title=${encodeURI(title)}`,
                );
                mutation.mutate({ timeline, short });
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
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            autoHideDuration={2500}
            open={toast !== false}
            onClose={() => setToast(false)}
            message={toast || ""}
          />
        </>
      )}
    </PopupState>
  );
}

import { UserData } from "@/types/user";
import { MobileTimelineBuilderPage } from "./_mobile-builder";

export function DesktopTimelineBuilderPage({ userData }: { userData?: UserData }) {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up("lg"));
  const [replayKey, setReplayKey] = useState(0);

  return (
    <Grid
      container
      spacing={2}
      size={{ xs: 12 }}
      direction={"row"}
      sx={{ alignItems: "flex-start", m: 2 }}
    >
      <TimelineBuilderTour replayKey={replayKey} />
      <Grid size={{ xs: 12, md: 8, lg: 8 }} sx={{ alignItems: "center", mt: 5 }}>
        <Container
          data-tour="timeline-canvas"
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
            <Timeline userData={userData} />
          </Suspense>
        </Container>
      </Grid>
      <Grid size={{ xs: 12, md: 4, lg: 4 }}>
        <Box
          data-tour="timeline-controls"
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            pr: 20,
          }}
        >
          <AutoAssignButton userData={userData} />
          <ShareButton />
          <FilterMenu />
          <Divider orientation="vertical" flexItem sx={{ margin: 1 }} />
          <Tooltip title="Tour">
            <IconButton onClick={() => setReplayKey((prev) => prev + 1)}>
              <HelpOutlined />
            </IconButton>
          </Tooltip>
        </Box>
        <Container
          data-tour="timeline-source"
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

export function TimelineBuilderPage({ userData }: { userData?: UserData }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  if (isMobile) {
    return <MobileTimelineBuilderPage userData={userData} />;
  }
  return <DesktopTimelineBuilderPage userData={userData} />;
}
