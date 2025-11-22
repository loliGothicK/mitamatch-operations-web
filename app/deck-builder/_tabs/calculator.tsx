"use client";

import NumberInput from "@/components/common/NumberInput";
import { charmList } from "@/domain/charm/charm";
import { costumeList } from "@/domain/costume/costume";
import { calcFinalStatus } from "@/evaluate/calc";
import { evaluate, type StackOption } from "@/evaluate/evaluate";
import {
  adLevelAtom,
  charmAtom,
  costumeAtom,
  defAtom,
  rwDeckAtom,
  rwLegendaryDeckAtom,
  spDefAtom,
  statusAtom,
  swAtom,
} from "@/jotai/memoriaAtoms";
import {
  Autocomplete,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  darken,
  lighten,
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material/styles";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Settings } from "@mui/icons-material";
import { useId, useState } from "react";
import { statusKind, type StatusKind } from "@/parser/common";
import { isLeft } from "fp-ts/lib/Either";
import { isNone, isSome } from "fp-ts/Option";
import { match } from "ts-pattern";
import { option } from "fp-ts";
const charmFilterAtom = atomWithStorage<("火" | "水" | "風")[]>(
  "charmFilter",
  [],
);
const costumeFilterOptions = [
  "AD",
  "火",
  "水",
  "風",
  "通単",
  "通範",
  "特単",
  "特範",
  "支援",
  "妨害",
  "回復",
  "通常衣装",
  "特殊衣装",
] as const;
const costumeFilterAtom = atomWithStorage<
  (typeof costumeFilterOptions)[number][]
>("costumeFilter", []);

type AdvancedSettings = {
  counter: boolean;
  stack?: StackOption;
};

const advancedSettings = atomWithStorage<AdvancedSettings>("advancedSettings", {
  counter: false,
  stack: undefined,
});

function AdvancedSettingsModal() {
  const [settings, setSettings] = useAtom(advancedSettings);
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
      <Tooltip title={"Advanced Settings"} placement={"top"}>
        <Button onClick={handleOpen}>
          <Settings />
        </Button>
      </Tooltip>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Typography
            id={`modal-title-${uniqueId}`}
            variant="h6"
            component="h2"
          >
            Experimental
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  defaultChecked={settings.counter}
                  onChange={(_, checked) =>
                    setSettings((set) => ({ ...set, counter: checked }))
                  }
                />
              }
              label="カウンターを適用する"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function Calculator() {
  const theme = useTheme();
  const [deck] = useAtom(rwDeckAtom);
  const [legendaryDeck] = useAtom(rwLegendaryDeckAtom);
  const [sw] = useAtom(swAtom);
  const [charm, setCharm] = useAtom(charmAtom);
  const [costume, setCostume] = useAtom(costumeAtom);
  const [def, setDef] = useAtom(defAtom);
  const [spDef, setSpDef] = useAtom(spDefAtom);
  const [selfStatus, setSelfStatus] = useAtom(statusAtom);
  const [charmFilter, setCharmFilter] = useAtom(charmFilterAtom);
  const [costumeFilter, setCostumeFilter] = useAtom(costumeFilterAtom);
  const [adLevel, setAdLevel] = useAtom(adLevelAtom);
  const [settings] = useAtom(advancedSettings);

  const finalStatus = calcFinalStatus(
    [...deck, ...legendaryDeck],
    selfStatus,
    charm,
    costume,
  );

  const evaluateResult = evaluate(
    [...deck, ...legendaryDeck],
    finalStatus,
    [def, spDef],
    charm,
    costume,
    { limitBraek: adLevel, isAwakened: true },
    settings,
  );

  if (isLeft(evaluateResult)) {
    return <>{evaluateResult.left.map((err) => err.msg).join("\n")}</>;
  }

  const { skill, supportBuff, supportDebuff } = evaluateResult.right;

  const expectedToalDamage = skill
    .map(({ expected }) => expected.damage)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);
  const expectedTotalBuff = skill
    .map(({ expected }) => expected.buff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());
  const expectedTotalDebuff = skill
    .map(({ expected }) => expected.debuff)
    .reduce((acc: Map<StatusKind, number>, cur) => {
      if (!cur) {
        return acc;
      }
      for (const elem of cur) {
        const { type, amount } = elem;
        if (type) {
          acc.set(type, (acc.get(type) || 0) + amount);
        }
      }
      return acc;
    }, new Map());
  const expectedTotalRecovery = skill
    .map(({ expected }) => expected.recovery)
    .reduce((acc: number, cur) => acc + (cur ? cur : 0), 0);

  for (const [type, amount] of Object.entries(supportBuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalBuff.set(
      type as StatusKind,
      (expectedTotalBuff.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  for (const [type, amount] of Object.entries(supportDebuff).filter(
    ([, amount]) => !!amount,
  )) {
    expectedTotalDebuff.set(
      type as StatusKind,
      (expectedTotalDebuff.get(type as StatusKind) || 0) +
        amount * [...deck, ...legendaryDeck].length,
    );
  }

  const display = ({
    upDown,
    type,
    amount,
  }: {
    upDown: "UP" | "DOWN";
    type: StatusKind;
    amount: number;
  }) => {
    return `${type}/${upDown}: ${amount}`;
  };
  const charmOptions = charmList
    .filter((charm) => {
      if (charmFilter.length === 0) {
        return true;
      }
      return charmFilter.every((elem) => charm.ability.includes(elem));
    })
    .map((charm) => ({
      title: charm.name,
      ability: charm.ability,
    }));
  const costumeOptions = costumeList
    .filter((costume) => {
      if (isNone(costume.specialSkill)) {
        return false;
      }
      if (costumeFilter.length === 0) {
        return true;
      }
      return costumeFilter.every((option) => {
        if (option === "AD") {
          return (
            isSome(costume.specialSkill) &&
            costume.specialSkill.value.type === "adx"
          );
        }
        if (option === "通常衣装") {
          return (
            costume.status.summary.particular[0] >
            costume.status.summary.particular[1]
          );
        }
        if (option === "特殊衣装") {
          return (
            costume.status.summary.particular[0] <
            costume.status.summary.particular[1]
          );
        }
        if (option === "火" || option === "水" || option === "風") {
          return (
            isSome(costume.specialSkill) &&
            match(costume.specialSkill.value)
              .with({ type: "ex" }, ({ name }) => name.includes(option))
              .with({ type: "adx" }, (adx) =>
                adx
                  .get({ limitBreak: 3, isAwakened: true })
                  .some(({ description }) =>
                    description.includes(`${option}属性効果増加`),
                  ),
              )
              .exhaustive()
          );
        }
        return costume.cardType.includes(option);
      });
    })
    .map((costume) => ({
      title: costume.name,
      desc: match(costume.specialSkill)
        .with(option.none, () => "")
        .with({ value: { type: "ex" } }, ({ value: { name } }) => name)
        .with({ value: { type: "adx" } }, ({ value: { get } }) =>
          get({ limitBreak: 3, isAwakened: true })
            .map(({ name }) => name)
            .join("/"),
        )
        .exhaustive(),
    }));

  return (
    <Grid>
      <Toolbar>
        <Divider sx={{ flexGrow: 1 }}>設定</Divider>
        <AdvancedSettingsModal />
      </Toolbar>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormGroup sx={{ flexDirection: "row", height: 56 }}>
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label="火"
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, "火"]);
                } else {
                  setCharmFilter(charmFilter.filter((elem) => elem !== "火"));
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label="水"
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, "水"]);
                } else {
                  setCharmFilter(charmFilter.filter((elem) => elem !== "水"));
                }
              }}
            />
            <FormControlLabel
              control={<Checkbox defaultChecked={false} />}
              label="風"
              onChange={(_, checked) => {
                if (checked) {
                  setCharmFilter([...charmFilter, "風"]);
                } else {
                  setCharmFilter(charmFilter.filter((elem) => elem !== "風"));
                }
              }}
            />
          </FormGroup>
          <Autocomplete
            disablePortal
            options={charmOptions.sort((a, b) =>
              a.ability.localeCompare(b.ability),
            )}
            groupBy={(option) => option.ability}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => <TextField {...params} label="charm" />}
            renderGroup={(params) => (
              <li key={params.key}>
                <GroupHeader>{params.group}</GroupHeader>
                <GroupItems>{params.children}</GroupItems>
              </li>
            )}
            onChange={(_, value) => {
              if (value) {
                setCharm(
                  charmList.find((charm) => charm.name === value.title)!,
                );
              }
            }}
            sx={{ marginTop: 2 }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            renderInput={(params) => <TextField {...params} label="衣装検索" />}
            options={costumeFilterOptions}
            multiple
            onChange={(_, value) => {
              setCostumeFilter(
                value as (typeof costumeFilterOptions)[number][],
              );
            }}
          />
          <Grid
            container
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Grid
              size={{
                xs:
                  isSome(costume.specialSkill) &&
                  costume.specialSkill.value.type === "adx"
                    ? 9
                    : 12,
              }}
            >
              <Autocomplete
                disablePortal
                options={costumeOptions.sort((a, b) =>
                  a.desc && b.desc
                    ? a.desc.localeCompare(b.desc)
                    : a.title.localeCompare(b.title),
                )}
                groupBy={(option) => option.desc || "その他"}
                getOptionLabel={(option) => option.title}
                renderInput={(params) => (
                  <TextField {...params} label="costume" />
                )}
                renderGroup={(params) => (
                  <li key={params.key}>
                    <GroupHeader>{params.group}</GroupHeader>
                    <GroupItems>{params.children}</GroupItems>
                  </li>
                )}
                onChange={(_, value) => {
                  if (value) {
                    setCostume(
                      costumeList.find(
                        (costume) => costume.name === value.title,
                      )!,
                    );
                  }
                }}
                sx={{ marginTop: 2 }}
              />
            </Grid>
            {isSome(costume.specialSkill) &&
              costume.specialSkill.value.type === "adx" && (
                <Grid size={{ xs: 3 }} sx={{ marginTop: 2 }}>
                  <NumberInput
                    defaultValue={adLevel}
                    min={0}
                    max={3}
                    onChange={(value, _) => setAdLevel(value || 0)}
                  />
                </Grid>
              )}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Stack direction={"row"} spacing={2}>
            <Stack>
              <TextField
                label="Your ATK"
                defaultValue={selfStatus[0]}
                variant="standard"
                onChange={(e) => {
                  setSelfStatus([
                    Number.parseInt(e.target.value, 10),
                    selfStatus[1],
                    selfStatus[2],
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[0]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label="Your Sp.ATK"
                defaultValue={selfStatus[1]}
                variant="standard"
                onChange={(e) => {
                  setSelfStatus([
                    selfStatus[0],
                    Number.parseInt(e.target.value, 10),
                    selfStatus[2],
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[1]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label="Your DEF"
                defaultValue={selfStatus[2]}
                variant="standard"
                onChange={(e) => {
                  setSelfStatus([
                    selfStatus[0],
                    selfStatus[1],
                    Number.parseInt(e.target.value, 10),
                    selfStatus[3],
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[2]}`}</Typography>
            </Stack>
            <Stack>
              <TextField
                label="Your Sp.DEF"
                defaultValue={selfStatus[3]}
                variant="standard"
                onChange={(e) => {
                  setSelfStatus([
                    selfStatus[0],
                    selfStatus[1],
                    selfStatus[2],
                    Number.parseInt(e.target.value, 10),
                  ]);
                }}
              />
              <Typography>{`=> ${finalStatus[3]}`}</Typography>
            </Stack>
          </Stack>
        </Grid>
        {sw === "sword" && (
          <Grid size={{ xs: 12 }}>
            <Stack direction={"row"} spacing={2}>
              <TextField
                label="Opponent's DEF"
                defaultValue={def}
                variant="standard"
                onChange={(e) => {
                  setDef(Number.parseInt(e.target.value, 10));
                }}
              />
              <TextField
                label="Opponent's Sp.DEF"
                defaultValue={spDef}
                variant="standard"
                onChange={(e) => {
                  setSpDef(Number.parseInt(e.target.value, 10));
                }}
              />
            </Stack>
          </Grid>
        )}
      </Grid>
      <Divider sx={{ margin: 2 }}>{"期待値"}</Divider>
      <Grid container spacing={2} direction={"row"}>
        {sw === "sword" ? (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1">{`ダメージ量: ${expectedToalDamage}`}</Typography>
          </Grid>
        ) : (
          <>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">{`総合回復量: ${expectedTotalRecovery}`}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">{`平均回復量: ${Math.floor(
                expectedTotalRecovery / [...deck, ...legendaryDeck].length,
              )}`}</Typography>
            </Grid>
          </>
        )}
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid key={"buff"}>
            <Typography>{"バフ量:"}</Typography>
          </Grid>
          {statusKind
            .filter((kind) => expectedTotalBuff.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid key={kind}>
                  <Typography
                    variant="body1"
                    color={theme.palette.mode === "light" ? "darkred" : "pink"}
                  >
                    {`${kind}/UP: ${expectedTotalBuff.get(kind)!}`}
                  </Typography>
                </Grid>
              );
            })}
        </Grid>
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid key={"debuff"}>
            <Typography>{"デバフ量:"}</Typography>
          </Grid>
          {statusKind
            .filter((kind) => expectedTotalDebuff.get(kind) !== undefined)
            .map((kind) => {
              return (
                <Grid key={kind}>
                  <Typography
                    variant="body1"
                    color={
                      theme.palette.mode === "light" ? "darkblue" : "turquoise"
                    }
                  >
                    {`${kind}/DOWN: ${expectedTotalDebuff.get(kind)!}`}
                  </Typography>
                </Grid>
              );
            })}
        </Grid>
      </Grid>
      <Divider sx={{ margin: 2 }}>{"詳細"}</Divider>
      <Grid container spacing={2}>
        {skill.map(({ memoria, expected }) => {
          return (
            <Grid key={memoria.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ display: "flex" }}>
                <CardMedia
                  component="img"
                  sx={{ width: 100, height: 100 }}
                  image={`/memoria/${memoria.name.short}.png`}
                  alt={memoria.name.short}
                />
                <CardContent
                  sx={{
                    flex: "1 0 auto",
                  }}
                >
                  {expected.damage && (
                    <Typography variant="body2">{`damage: ${expected.damage}`}</Typography>
                  )}
                  {expected.recovery && (
                    <Typography variant="body2">{`recovery: ${expected.recovery}`}</Typography>
                  )}
                  {expected.buff?.map((buff) => {
                    return (
                      <Typography
                        key={buff.type}
                        variant="body2"
                        color={
                          theme.palette.mode === "light" ? "darkred" : "pink"
                        }
                      >
                        {display({ ...buff, upDown: "UP" })}
                      </Typography>
                    );
                  })}
                  {expected.debuff?.map((debuff) => {
                    return (
                      <Typography
                        key={debuff.type}
                        variant="body2"
                        color={
                          theme.palette.mode === "light"
                            ? "darkblue"
                            : "turquoise"
                        }
                      >
                        {display({ ...debuff, upDown: "DOWN" })}
                      </Typography>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
}

const GroupHeader = styled("div")(({ theme }) => ({
  position: "sticky",
  top: "-8px",
  padding: "4px 10px",
  color: theme.palette.primary.main,
  backgroundColor:
    theme.palette.mode === "light"
      ? lighten(theme.palette.primary.light, 0.85)
      : darken(theme.palette.primary.main, 0.8),
}));

const GroupItems = styled("ul")({
  padding: 0,
});
