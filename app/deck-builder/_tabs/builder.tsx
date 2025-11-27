"use client";

import { useAtom } from "jotai";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {Dispatch, type MouseEvent, SetStateAction, Suspense, useCallback, useEffect, useId, useState} from "react";
import DifferenceIcon from "@mui/icons-material/Difference";
import type { Unit } from "@/domain/types";
import { generateShortLink, saveShortLink } from "@/actions/permlink";
import { restore } from "@/actions/restore";

import {
  Add,
  ArrowRightAlt,
  Assignment,
  ClearAll,
  FilterAlt,
  Layers,
  LayersOutlined,
  Remove,
  Reply,
  ReplyOutlined,
  SearchOutlined,
  Share,
  Close,
  Settings,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  Grid,
  IconButton,
  ImageListItem,
  ImageListItemBar,
  InputLabel,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
  Card,
  CardMedia,
  CardContent,
  TextField,
  InputAdornment,
} from "@mui/material";
import type { SelectChangeEvent, Theme } from "@mui/material";
import { blue, green, purple, red, yellow } from "@mui/material/colors";

import { decodeDeck, encodeDeck } from "@/endec/serde";
import Details from "@/components/deck-builder/Details";
import Filter from "@/components/deck-builder/Filter";
import Search from "@/components/deck-builder/Search";
import Sortable from "@/components/sortable/Sortable";
import type { Memoria } from "@/domain/memoria/memoria";
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
  type Concentration,
  unitTitleAtom,
} from "@/jotai/memoriaAtoms";

import { calcDiff } from "@/evaluate/calc";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Toolbar from "@mui/material/Toolbar";
import { useTheme } from "@mui/material/styles";
import Cookies from "js-cookie";
import PopupState, { bindMenu, bindTrigger } from "material-ui-popup-state";
import { Virtuoso } from "react-virtuoso";
import { match } from "ts-pattern";
import { Lenz } from "@/domain/lenz";
import { isStackEffect } from "@/parser/skill";
import { Calculator } from "@/deck-builder/_tabs/calculator";
import type { ImageProps } from "next/dist/shared/lib/get-img-props";
import type { StrictOmit } from "ts-essentials";
import { isLeft } from "fp-ts/Either";

const COMMING_SOON = "/memoria/CommingSoon.jpeg";

function Icon({
  cardType,
  attribute,
  position,
}: {
  cardType: Memoria["cardType"];
  attribute: Memoria["attribute"];
  position?: number;
}) {
  const kindImage = match(cardType)
    .with("通常単体", () => <Image src={"/NormalSingle.png"} alt={"kind"} width={25} height={25} />)
    .with("通常範囲", () => <Image src={"/NormalRange.png"} alt={"kind"} width={25} height={25} />)
    .with("特殊単体", () => (
      <Image src={"/SpecialSingle.png"} alt={"kind"} width={25} height={25} />
    ))
    .with("特殊範囲", () => <Image src={"/SpecialRange.png"} alt={"kind"} width={25} height={25} />)
    .with("支援", () => <Image src={"/Assist.png"} alt={"kind"} width={25} height={25} />)
    .with("妨害", () => <Image src={"/Interference.png"} alt={"kind"} width={25} height={25} />)
    .with("回復", () => <Image src={"/Recovery.png"} alt={"kind"} width={25} height={25} />)
    .exhaustive();

  const avatar = (color: string) => (
    <Avatar
      sx={{
        width: 30,
        height: 30,
        left: position,
        position: "absolute",
        bgcolor: color,
      }}
    >
      {kindImage}
    </Avatar>
  );

  return match(attribute)
    .with("Fire", () => avatar(red[500]))
    .with("Water", () => avatar(blue[500]))
    .with("Wind", () => avatar(green[500]))
    .with("Light", () => avatar(yellow[500]))
    .with("Dark", () => avatar(purple[500]))
    .exhaustive();
}

function ConcentrationIcon({
  concentration,
  handleConcentration,
}: {
  concentration: number;
  handleConcentration: (() => void) | true;
}) {
  return (
    <IconButton
      disabled={handleConcentration === true}
      onClick={handleConcentration === true ? undefined : handleConcentration}
      sx={{
        top: 25,
        left: 60,
        position: "absolute",
      }}
    >
      {concentration === 4 ? (
        <Typography
          variant="body2"
          color="white"
          sx={{
            position: "absolute",
          }}
        >
          MAX
        </Typography>
      ) : (
        <Typography
          variant="body2"
          color="white"
          sx={{
            position: "absolute",
          }}
        >
          {concentration}
        </Typography>
      )}
      <Image src={"/Concentration.png"} alt={"concentration"} width={30} height={30} />
    </IconButton>
  );
}

function MemoriaImage({
  name,
  ...option
}: { name: string } & StrictOmit<ImageProps, "src" | "alt" | "width" | "height" | "onError">) {
  const [imageSource, setImageSource] = useState(`/memoria/${name}.png`);

  return (
    <Image
      src={imageSource}
      alt={name}
      width={100}
      height={100}
      onError={() => {
        if (imageSource !== COMMING_SOON) {
          setImageSource(COMMING_SOON);
        }
      }}
      {...option}
    />
  );
}

function MemoriaItem({
  memoria,
  remove,
  onConcentrationChange,
  onContextMenu,
  disable,
  preload,
}: {
  readonly memoria: MemoriaWithConcentration;
  readonly remove?: false;
  readonly onConcentrationChange?: Dispatch<SetStateAction<Concentration | undefined>> | false;
  readonly onContextMenu?: false;
  readonly disable?: true;
  readonly preload?: boolean;
}) {
  const { name, id, concentration } = memoria;
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [concentrationValue, setConcentration] = useState(concentration);
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
        : null,
    );
  };

  const { isDragging, setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id,
  });

  const changeValue = (prev: MemoriaWithConcentration[]) => {
    return prev.map((memoria) => {
      if (memoria.name.short === name.short) {
        return {
          ...memoria,
          concentration: (concentrationValue > 0 ? concentrationValue - 1 : 4) as Concentration,
        };
      }
      return memoria;
    });
  };

  const handleConcentration = () => {
    if (concentrationValue > 0) {
      setConcentration((concentrationValue - 1) as Concentration);
    } else {
      setConcentration(4);
    }
    if (onConcentrationChange) {
      onConcentrationChange(concentrationValue > 0 ? (concentrationValue - 1) as Concentration : 4);
    } else {
      setDeck(changeValue);
      setLegendaryDeck(changeValue);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Number.POSITIVE_INFINITY : "auto",
  };

  const skeleton = (w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="${w}" height="${h}">
      <defs>
        <linearGradient id="shimmer" x1="0" x2="${w}" y1="0" y2="0">
          <stop offset="0%" stop-color="#f5f5f5">
            <animate attributeName="offset" values="-2; 1" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stop-color="#eeeeee">
            <animate attributeName="offset" values="-1.5; 1.5" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stop-color="#f5f5f5">
            <animate attributeName="offset" values="-1; 2" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#shimmer)" />
      <path d="M160 110 Q200 60 240 110 L240 200 L160 200 Z" fill="#e0e0e0" opacity="0.7" />
      <circle cx="190" cy="90" r="15" fill="#e0e0e0" opacity="0.7" />
    </svg>`;

  const toBase64 = (str: string) => {
    if (typeof window === "undefined") {
      return Buffer.from(str).toString("base64");
    }
    return window.btoa(str);
  };

  return (
    <Grid key={id} ref={setNodeRef} style={style}>
      <Box
        sx={
          compare && compare.id === memoria.id
            ? {
                filter: "grayscale(80%)",
              }
            : {}
        }
      >
        <ImageListItem>
          <Box>
            <Icon cardType={memoria.cardType} attribute={memoria.attribute} position={70} />
            <ConcentrationIcon
              concentration={concentrationValue}
              handleConcentration={disable || handleConcentration}
            />
          </Box>
          <div {...attributes} {...listeners} style={{ touchAction: "none" }}>
            <Tooltip
              title={
                <Stack>
                  <Typography variant="h6">{name.short}</Typography>
                  <Typography variant="body2">{Lenz.memoria.gvgSkill.name.get(memoria)}</Typography>
                  <Typography variant="body2">
                    {Lenz.memoria.autoSkill.name.get(memoria)}
                  </Typography>
                </Stack>
              }
              placement={"top"}
              arrow
            >
              <MemoriaImage
                name={memoria.name.short}
                placeholder={"blur"}
                blurDataURL={toBase64(skeleton(100, 100))}
                onContextMenu={onContextMenu ? undefined : handleContextMenu}
                preload={preload}
              />
            </Tooltip>
          </div>
          <ImageListItemBar
            sx={{ bgcolor: "rgba(0, 0, 0, 0)" }}
            position={"top"}
            actionPosition={"right"}
          />
          <Box>
            {!disable && (
              <ImageListItemBar
                sx={{ bgcolor: "rgba(0, 0, 0, 0)" }}
                position={"top"}
                actionPosition={"left"}
                actionIcon={
                  remove === undefined && (
                    <IconButton
                      sx={{
                        color: "rgba(255, 50, 50, 0.9)",
                        bgcolor: "rgba(0, 0, 0, 0.2)",
                        zIndex: Number.POSITIVE_INFINITY,
                      }}
                      aria-label={"remove"}
                      onClick={() => {
                        setDeck((prev) =>
                          prev.filter((memoria) => memoria.name.short !== name.short),
                        );
                        setLegendaryDeck((prev) =>
                          prev.filter((memoria) => memoria.name.short !== name.short),
                        );
                      }}
                    >
                      <Remove />
                    </IconButton>
                  )
                }
              />
            )}
          </Box>
        </ImageListItem>
      </Box>
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
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
        direction={"row"}
        alignItems={"left"}
        spacing={2}
        sx={{ maxWidth: 600, minHeight: 100 }}
      >
        {deck.map((memoria) => {
          return <MemoriaItem memoria={memoria} key={memoria.id} preload={true} />;
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
        direction={"row"}
        alignItems={"left"}
        spacing={2}
        sx={{ maxWidth: 600, minHeight: 100 }}
      >
        {deck.map((memoria) => {
          return <MemoriaItem memoria={memoria} key={memoria.id} preload={true} />;
        })}
      </Grid>
    </Sortable>
  );
}

function UnitComponent({ index }: { index: number }) {
  const params = useSearchParams();
  const theme = useTheme();
  const [, setTitle] = useAtom(unitTitleAtom);
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setSw] = useAtom(swAtom);
  const [, setRoleFilter] = useAtom(roleFilterAtom);
  const [, setCompare] = useAtom(compareModeAtom);

  useEffect(() => {
    (async () => {
      const value = params.get("deck");
      const title = params.get("title");
      setTitle(title ? decodeURI(title) : "No Title");
      const cookie = Cookies.get(`deck-${index}`);
      if (value) {
        const { sw, deck, legendaryDeck } = await restore({
          target: "deck",
          param: value,
        });
        setSw(sw);
        setRoleFilter(
          sw === "shield"
            ? ["support", "interference", "recovery"]
            : ["normal_single", "normal_range", "special_single", "special_range"],
        );
        setDeck(deck);
        setLegendaryDeck(legendaryDeck);
        setCompare(undefined);
      } else if (cookie) {
        const decodeResult = decodeDeck(cookie);
        if (decodeResult.isOk()) {
          const { sw, deck, legendaryDeck } = decodeResult.value;
          setSw(sw);
          setRoleFilter(
            sw === "shield"
              ? ["support", "interference", "recovery"]
              : ["normal_single", "normal_range", "special_single", "special_range"],
          );
          setDeck(deck);
          setLegendaryDeck(legendaryDeck);
          setCompare(undefined);
        } else {
          throw new Error(`Failed to restore deck: \n${decodeResult.error}`);
        }
      }
    })();
  }, [setTitle, setDeck, setLegendaryDeck, setRoleFilter, setSw, params, setCompare, index]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        minHeight: "60vh",
        maxWidth: "600px",
        padding: 2,
      }}
    >
      <LegendaryDeck />
      <Divider sx={{ margin: 2 }} />
      <Deck />
    </Box>
  );
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
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
  kind: "before" | "after";
  times: number;
  targets: MemoriaWithConcentration[];
}) {
  const theme = useTheme();
  const [personName, setPersonName] = useState<string[]>([]);
  const [, setStackBeforeTargets] = useAtom(targetBeforeAtom);
  const [, setStackAfterTargets] = useAtom(targetAfterAtom);
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const uniqueId = useId();
  const unit = legendaryDeck.concat(deck);

  const handleChange = (event: SelectChangeEvent<typeof personName>) => {
    const {
      target: { value },
    } = event;
    (kind === "before" ? setStackBeforeTargets : setStackAfterTargets)(
      typeof value === "string"
        ? value.split(",").map((name) => unit.find((memoria) => memoria.name.short === name)!.id)
        : value.map((name) => unit.find((memoria) => memoria.name.short === name)!.id),
    );
    setPersonName(
      // On autofill, we get a stringified value.
      typeof value === "string" ? value.split(",") : value,
    );
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id={`targets-${uniqueId}`}>スタック適用対象</InputLabel>
        <Select
          multiple
          value={personName}
          onChange={handleChange}
          input={<OutlinedInput label="Target" />}
          MenuProps={MenuProps}
          variant={"outlined"}
        >
          {targets.map((memoria) => (
            <MenuItem
              key={memoria.name.short}
              value={memoria.name.short}
              disabled={!(personName.length < times || personName.includes(memoria.name.short))}
              style={getStyles(memoria.name.short, personName, theme)}
            >
              {memoria.name.short}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

function Compare({ counter, stack, setAction }: { counter?: boolean; stack?: boolean; setAction: Dispatch<SetStateAction<Concentration | undefined>>; }) {
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
    return <Typography>Something went wrong!</Typography>;
  }

  const [stackRateBefore, stackTimesBefore] = match(sw)
    .with("sword", () => {
      const stack = Lenz.memoria.gvgSkill.effects.get(compare).find(isStackEffect("meteor"));
      return [stack?.rate, stack?.times];
    })
    .with("shield", () => {
      const stack = Lenz.memoria.gvgSkill.effects
        .get(compare)
        .find((eff) => isStackEffect("eden")(eff) || isStackEffect("anima")(eff));

      return [stack?.rate, stack?.times];
    })
    .exhaustive();
  const [stackRateAfter, stackTimesAfter] = match(sw)
    .with("sword", () => {
      const stack = Lenz.memoria.gvgSkill.effects.get(compare).find(isStackEffect("meteor"));
      return [stack?.rate, stack?.times];
    })
    .with("shield", () => {
      const stack = Lenz.memoria.gvgSkill.effects
        .get(compare)
        .find((eff) => isStackEffect("eden")(eff) || isStackEffect("anima")(eff));

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
    { limitBraek: adLevel, isAwakened: true },
    {
      counter,
      stack: stack
        ? {
            before: {
              rate: stackRateBefore!,
              targets: targetBefore,
            },
            after: {
              rate: stackRateAfter!,
              targets: targetAfter,
            },
          }
        : undefined,
    },
  );

  if (isLeft(diff)) {
    return <Typography>{JSON.stringify(diff.left)}</Typography>;
  }

  const intoRow = ([type, [before, after]]: [string, [number, number]]) => {
    const sign = after - before > 0;
    const color = theme.palette[sign ? "success" : "error"][theme.palette.mode];
    return (
      <Grid key={type} size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h5" component="div" color={color}>
              {`${type}: ${sign ? "+" : ""}${after - before}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`(${before} => ${after})`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Grid container direction={"column"} alignItems="center" justifyContent="space-between">
      <Grid container>
        <Grid size={{ xs: 5 }}>
          <Stack direction={"column"}>
            <Stack direction={"row"}>
              <Grid>
                <MemoriaItem
                  memoria={compare}
                  onConcentrationChange={false}
                  onContextMenu={false}
                />
              </Grid>
              <Stack direction={"column"} paddingLeft={5}>
                <Typography variant="body2">{`${Lenz.memoria.general.shortName.get(compare)}`}</Typography>
                <Typography variant="body2">{`${Lenz.memoria.gvgSkill.name.get(compare)}`}</Typography>
                <Typography variant="body2">{`${Lenz.memoria.autoSkill.name.get(compare)}`}</Typography>
              </Stack>
            </Stack>
            {Lenz.memoria.gvgSkill.description.get(compare).includes("スタック") && (
              <MultipleSelect
                times={stackTimesBefore!}
                kind={"before"}
                targets={legendaryDeck
                  .concat(deck)
                  .filter((m) => ![compare.id, candidate.id].includes(m.id))}
              />
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 2 }} paddingTop={4}>
          <ArrowRightAlt fontSize={"large"} />
        </Grid>
        <Grid size={{ xs: 5 }}>
          <Stack direction={"column"}>
            <Stack direction={"row"}>
              <Grid>
                <MemoriaItem
                  memoria={candidate}
                  onConcentrationChange={setAction}
                  onContextMenu={false}
                />
              </Grid>
              <Stack direction={"column"} paddingLeft={5}>
                <Typography variant="body2">{`${Lenz.memoria.general.shortName.get(candidate)}`}</Typography>
                <Typography variant="body2">{`${Lenz.memoria.gvgSkill.name.get(candidate)}`}</Typography>
                <Typography variant="body2">{`${Lenz.memoria.autoSkill.name.get(candidate)}`}</Typography>
              </Stack>
            </Stack>
            {Lenz.memoria.gvgSkill.description.get(candidate).includes("スタック") && (
              <MultipleSelect
                times={stackTimesAfter!}
                kind={"after"}
                targets={legendaryDeck
                  .concat(deck)
                  .filter((m) => ![compare.id, candidate.id].includes(m.id))}
              />
            )}
          </Stack>
        </Grid>
      </Grid>
      <Divider textAlign={"left"} sx={{ margin: 2, width: "100%" }}>
        ステータス
      </Divider>
      <Grid container={true} width={"100%"}>
        {intoRow([
          "ATK",
          [compare.status[compare.concentration][0], candidate.status[compare.concentration][0]],
        ])}
        {intoRow([
          "Sp.ATK",
          [compare.status[compare.concentration][1], candidate.status[compare.concentration][1]],
        ])}
        {intoRow([
          "DEF",
          [compare.status[compare.concentration][2], candidate.status[compare.concentration][2]],
        ])}
        {intoRow([
          "Sp.DEF",
          [compare.status[compare.concentration][3], candidate.status[compare.concentration][3]],
        ])}
      </Grid>
      <Divider textAlign={"left"} sx={{ margin: 2, width: "100%" }}>
        {diff.right.expectedToalDamage[1] - diff.right.expectedToalDamage[0] !== 0
          ? "ダメージ"
          : "回復"}
      </Divider>
      <Grid container={true} width={"100%"}>
          {/* damage */}
          {diff.right.expectedToalDamage[1] - diff.right.expectedToalDamage[0] !== 0 &&
            intoRow(["ダメージ", diff.right.expectedToalDamage])}
          {/* recovery */}
          {diff.right.expectedTotalRecovery[1] - diff.right.expectedTotalRecovery[0] !== 0 &&
            intoRow(["回復", diff.right.expectedTotalRecovery])}
      </Grid>
      <Divider textAlign={"left"} sx={{ margin: 2, width: "100%" }}>
        {"バフ"}
      </Divider>
      <Grid container={true} width={"100%"}>
          {[...diff.right.expectedTotalBuff.entries()]
            .filter(([_, value]) => value[0] > 0 && value[0] !== value[1])
            .map(([type, value]) => intoRow([type, value]))}
      </Grid>
      <Divider textAlign={"left"} sx={{ margin: 2, width: "100%" }}>
        {"デバフ"}
      </Divider>
      <Grid container={true} width={"100%"}>
          {[...diff.right.expectedTotalDebuff.entries()]
            .filter(([_, value]) => value[0] > 0 && value[0] !== value[1])
            .map(([type, value]) => intoRow([type, value]))}
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
  const uniqueId = useId();
  const [condidateConcentration, setCondidateConcentration] = useState<Concentration | undefined>(undefined);

  const addMemoria = (prev: MemoriaWithConcentration[], newMemoria: Memoria, concentration: Concentration | undefined = condidateConcentration) => {
    return [...prev, { ...newMemoria, concentration: concentration ?? 4 }];
  };

  const onDialogClose = useCallback(() => {
    setTargetBefore([]);
    setTargetAfter([]);
    setOpen(false);
    setCondidateConcentration(undefined);
  }, [setTargetBefore, setTargetAfter, setOpen, setCondidateConcentration]);

  return (
    <>
      <Virtuoso
        style={{ height: "60vh" }}
        totalCount={memoria.length}
        computeItemKey={(index) => memoria[index].id}
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
                aria-label="add"
                onClick={() => {
                  if (compare !== undefined) {
                    setOpen(true);
                    setCandidate({
                      ...memoria[index],
                      concentration: condidateConcentration ?? 4,
                    });
                    return;
                  }
                  if (memoria[index].labels.includes("Legendary")) {
                    setLegendaryDeck((prev) => addMemoria(prev, memoria[index]));
                  } else {
                    setDeck((prev) => addMemoria(prev, memoria[index]));
                  }
                }}
              >
                <Add color={"warning"} />
              </IconButton>
              <Icon
                cardType={memoria[index].cardType}
                attribute={memoria[index].attribute}
                position={70}
              />
              <Tooltip title={memoria[index].name.short} placement={"top"}>
                <CardMedia sx={{ width: 100, height: 100 }}>
                  <MemoriaImage name={memoria[index].name.short} />
                </CardMedia>
              </Tooltip>
              <CardContent>
                <Stack direction={"column"} sx={{ paddingLeft: 2 }}>
                  <Typography
                    component="span"
                    fontWeight="bold"
                    fontSize={12}
                    sx={{ display: "block" }}
                    color="text.primary"
                  >
                    {Lenz.memoria.gvgSkill.name.get(memoria[index])}
                  </Typography>
                  <Divider sx={{ margin: 1 }} />
                  <Typography
                    component="span"
                    fontWeight="bold"
                    fontSize={12}
                    sx={{ display: "block" }}
                    color="text.primary"
                  >
                    {Lenz.memoria.autoSkill.name.get(memoria[index])}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          );
        }}
      />
      <Dialog fullScreen open={open} onClose={onDialogClose}>
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onDialogClose} aria-label="close">
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              期待値比較
            </Typography>
            <Tooltip title="カウンター" placement="left">
              <Checkbox
                disabled={
                  ![compare, candidate].some((m) =>
                    m?.skills.gvgSkill.raw.description.includes("スタック"),
                  )
                }
                icon={<ReplyOutlined style={{ transform: "rotate(90deg)" }} />}
                checkedIcon={<Reply style={{ transform: "rotate(90deg)" }} />}
                onChange={(_, checked) => setCounter(() => checked)}
              />
            </Tooltip>
            <Tooltip title="スタック" placement="left">
              <Checkbox
                disabled={
                  ![compare, candidate].some((m) =>
                    m?.skills.gvgSkill.raw.description.includes("スタック"),
                  )
                }
                icon={<LayersOutlined />}
                checkedIcon={<Layers />}
                onChange={(_, checked) => setStack(() => checked)}
              />
            </Tooltip>
            <Button
              color="inherit"
              onClick={() => {
                if (candidate?.labels.includes("Legendary")) {
                  setLegendaryDeck((prev) =>
                    [...prev].map((memoria) => (memoria.id === compare?.id ? candidate : memoria)),
                  );
                } else {
                  setDeck((prev) =>
                    [...prev].map((memoria) => (memoria.id === compare?.id ? candidate! : memoria)),
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
            paddingLeft: { xs: "5%", md: "10%", lg: "20%" },
            paddingRight: { xs: "5%", md: "10%", lg: "20%" },
          }}
        >
          {compare?.labels.includes("Legendary") === candidate?.labels.includes("Legendary") ? (
            <DialogContent>
              <Compare counter={counter} stack={stack} setAction={setCondidateConcentration} />
            </DialogContent>
          ) : (
            <DialogContent>
              <Typography id={`modal-title-${uniqueId}`} variant="h6" component="h2">
                Error
              </Typography>
              <Typography variant="body2">
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
    <Grid container direction={"column"} alignItems={"center"} minHeight={"70vh"}>
      <Grid minHeight={"60vh"} minWidth={"100%"}>
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
    <Button
      onClick={() => {
        if (sw === "shield") {
          setSw("sword");
          setRoleFilter(["normal_single", "normal_range", "special_single", "special_range"]);
        } else {
          setSw("shield");
          setRoleFilter(["support", "interference", "recovery"]);
        }
        setDeck([]);
        setLegendaryDeck([]);
        setCompare(undefined);
      }}
    >
      {sw === "shield" ? "後衛" : "前衛"}
    </Button>
  );
}

function FilterModal() {
  const [open, setOpen] = useState(false);
  const uniqueId = useId();
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={"filter"} placement={"top"}>
        <Button onClick={handleOpen}>
          <FilterAlt />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id={`modal-title-${uniqueId}`} variant="h6" component="h2">
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
  const uniqueId = useId();
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={"search"} placement={"top"}>
        <Button onClick={handleOpen}>
          <SearchOutlined />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id={`modal-title-${uniqueId}`} variant="h6" component="h2">
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

function Diff(props: { origin: Unit; current: Unit }) {
  const { origin, current } = props;
  const originUnit = origin.deck.concat(origin.legendaryDeck);
  const currentUnit = current.deck.concat(current.legendaryDeck);

  const incoming = currentUnit.filter(
    (memoria) => !originUnit.map((memoria) => memoria.id).includes(memoria.id),
  );
  const outgoing = originUnit.filter(
    (memoria) => !currentUnit.map((memoria) => memoria.id).includes(memoria.id),
  );

  if (incoming.length > 0 || outgoing.length > 0) {
    return (
      <>
        <Typography>追加</Typography>
        <Grid
          container
          direction={"row"}
          alignItems={"left"}
          spacing={2}
          sx={{ maxWidth: 600, minHeight: 100 }}
        >
          {incoming.map((memoria) => {
            return <MemoriaItem memoria={memoria} key={memoria.id} disable={true} />;
          })}
        </Grid>
        <Typography>削除</Typography>
        <Grid
          container
          direction={"row"}
          alignItems={"left"}
          spacing={2}
          sx={{ maxWidth: 600, minHeight: 100 }}
        >
          {outgoing.map((memoria) => {
            return <MemoriaItem memoria={memoria} key={memoria.id} disable={true} />;
          })}
        </Grid>
      </>
    );
  }
  return <Typography>変更はありません</Typography>;
}

function DiffModal() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Unit | undefined>(undefined);
  const [sw] = useAtom(swAtom);
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const uniqueId = useId();
  const current = {
    sw,
    deck,
    legendaryDeck,
  };

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={"diff"} placement={"top"}>
        <Button onClick={handleOpen}>
          <DifferenceIcon />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography id={`modal-title-${uniqueId}`} variant="h6" component="h2">
            Diff
          </Typography>
          <Divider />
          <TextField
            label="original"
            id={`original-url-${uniqueId}`}
            sx={{ m: 1, width: "50ch" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    https://operations.mitama.io/deck-builder?deck=
                  </InputAdornment>
                ),
              },
            }}
            onChange={(event) => {
              const decodeResult = decodeDeck(event.target.value);
              if (decodeResult.isOk()) {
                setSource(decodeResult.value);
              }
            }}
            variant="standard"
          />
          <Divider />
          {source &&
            (source.sw !== current.sw ? (
              <Typography>前衛と後衛を比較することはできません</Typography>
            ) : (
              <Diff origin={source} current={current} />
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ShareButton() {
  const [title] = useAtom(unitTitleAtom);
  const [sw] = useAtom(swAtom);
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
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

  const full = encodeDeck(sw, deck, legendaryDeck);

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
            <Tooltip title={"share"} placement={"top"}>
              <Share />
            </Tooltip>
          </Button>
          <Menu {...bindMenu(popupState)}>
            <MenuItem
              onClick={async () => {
                popupState.close();
                handleClick("short");
                const short = await generateShortLink({ full });
                setUrl(
                  `https://operations.mitama.io/deck-builder?deck=${short}&title=${encodeURI(title)}`,
                );
                await saveShortLink({ target: "deck", full, short });
              }}
            >
              {"short link"}
            </MenuItem>
            <MenuItem
              onClick={() => {
                popupState.close();
                handleClick("full");
                setUrl(`https://operations.mitama.io/deck-builder?deck=${full}`);
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

function CalcSettings() {
  const [open, setOpen] = useState(false);
  const uniqueId = useId();
  return (
    <>
      <Tooltip title={"calc settings"} placement={"top"}>
        <IconButton onClick={() => setOpen(true)}>
          <Settings />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogContent>
          <Typography id={`modal-title-${uniqueId}`} variant="h6" component="h2">
            Calc Settings
          </Typography>
          <Stack direction={"column"}>
            <Stack direction={"row"}>
              <Calculator />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function DeckBuilder({ index }: { index: number }) {
  const [, setDeck] = useAtom(rwDeckAtom);
  const [, setLegendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [, setCompare] = useAtom(compareModeAtom);

  return (
    <Grid
      container
      direction={"row"}
      sx={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Grid
        size={{ xs: 12, md: 4, lg: 3 }}
        direction={"column"}
        alignItems={"center"}
        sx={{
          padding: 2,
        }}
      >
        <Details />
      </Grid>
      <Grid size={{ xs: 12, md: 8, lg: 5 }} alignItems={"center"}>
        <Tooltip title="clear all" placement={"top"}>
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
        <DiffModal />
        <ShareButton />
        <CalcSettings />
        <Suspense>
          <UnitComponent index={index} />
        </Suspense>
      </Grid>
      <Grid size={{ xs: 12, md: 12, lg: 4 }} py={2}>
        <Source />
      </Grid>
    </Grid>
  );
}
