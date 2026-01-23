"use client";

import Box from "@mui/material/Box";
import { User } from "@/types/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListAction, updateMemoriaAction } from "@/_actions/memoria";
import { Alert, Button, Divider, Grid, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { ImageWithFallback } from "@/components/image/ImageWithFallback";
import { useMemo, useState, type MouseEvent } from "react";
import { formatCardType, UniqueMemoria, uniqueMemoriaList } from "@/domain/memoria/memoria";
import { projector } from "@/functional/proj";
import Ribbon, { RibbonGroup } from "@/components/toolbar/Toolbar";
import { FilterAlt, Redo, Save, Undo } from "@mui/icons-material";
import { pipe } from "fp-ts/function";
import { filterWithIndex } from "fp-ts/lib/Map";
import { ConcentrationIcon } from "@/deck-builder/_tabs/builder";

type Props = {
  user: User;
};

const toShort = (name: string) =>
  name.replace(/(?:クリエイターズコラボ|Ultimate Memoria|Emotional Memoria)\s*-(.*)-/g, "$1");

function MemoriaCard({
  memoria,
  onConcentrationChange,
  onClick,
  onContextMenu,
}: {
  memoria: {
    id: string;
    name: string;
    limitBreak: number;
  };
  onConcentrationChange: (concentration: number) => void;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  const [concentration, setConcentration] = useState(memoria.limitBreak);
  return (
    <Box
      position={"relative"}
      sx={{ width: 100, height: 100, cursor: "pointer" }}
      onClick={onClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
    >
      <ConcentrationIcon
        key={memoria.id}
        concentration={concentration}
        handleConcentration={() => {
          const next = concentration === 4 ? 0 : concentration + 1;
          onConcentrationChange(next);
          setConcentration(next);
        }}
      />
      <ImageWithFallback
        src={`/memoria/${toShort(memoria.name)}.png`}
        alt={memoria.name}
        width={100}
        height={100}
        fallback={"/memoria/CommingSoon.jpeg"}
      />
    </Box>
  );
}

export function Memoria({}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<UniqueMemoria | undefined>(undefined);

  const { data: registered } = useQuery({
    queryKey: ["memoria"],
    queryFn: getListAction,
  });

  const [edit, setEdit] = useState(registered || []);

  const NotYetRegistered = useMemo(
    () => [
      ...pipe(
        uniqueMemoriaList,
        filterWithIndex((id, _) => !edit.map(projector("id")).includes(id)),
      ).values(),
    ],
    [edit],
  );

  const mutation = useMutation({
    mutationFn: updateMemoriaAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memoria"] }),
  });

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={2000}
        open={open}
        onClose={() => setOpen(false)}
      >
        <Alert severity={"info"}>{"Saved!"}</Alert>
      </Snackbar>
      <Ribbon>
        <RibbonGroup label={"owned"}>
          <Button
            onClick={() => {
              mutation.mutate({
                update: edit,
                remove:
                  registered?.filter(({ id }) => !edit.map(projector("id")).includes(id)) || [],
              });
              setOpen(true);
            }}
          >
            <Save />
          </Button>
          <Button>
            <FilterAlt />
          </Button>
        </RibbonGroup>
        <RibbonGroup label={"edit"}>
          <Button>
            <Undo />
          </Button>
          <Button>
            <Redo />
          </Button>
        </RibbonGroup>
        <RibbonGroup label={"source"}>
          <Button>
            <FilterAlt />
          </Button>
        </RibbonGroup>
      </Ribbon>
      <Grid container spacing={3} sx={{ mt: 2, width: "100%" }}>
        <Grid size={2.4} sx={{ display: "flex", flexWrap: "wrap" }}>
          <Paper sx={{ minHeight: "80vh", width: "100%", display: "flex", flexWrap: "wrap" }}>
            {info && (
              <Stack direction={"column"} sx={{ p: 2 }}>
                <Typography variant={"subtitle1"} sx={{ whiteSpace: "pre-line" }}>
                  {info.name.full.replace(/-(.+)-/g, "\n-$1-")}
                </Typography>
                <ImageWithFallback
                  key={info.id}
                  src={`/memoria/${info.name.short}.png`}
                  alt={info.name.full}
                  width={100}
                  height={100}
                  fallback={"/memoria/CommingSoon.jpeg"}
                />
                {info.cards.map((card) => (
                  <Box key={card.cardType}>
                    <Divider flexItem={true} sx={{ my: 1, width: "100%" }}>
                      <Typography variant={"subtitle2"}>{formatCardType(card.cardType)}</Typography>
                    </Divider>
                    <Paper elevation={2} sx={{ px: 1, pb: 1 }}>
                      <Divider flexItem={true} sx={{ my: 1, width: "80%" }}>
                        <Typography variant={"caption"}>{"レギオンマッチスキル"}</Typography>
                      </Divider>
                      <Typography variant={"body2"}>{card.skills.gvgSkill.raw.name}</Typography>
                      <Divider flexItem={true} sx={{ my: 1, width: "80%" }}>
                        <Typography variant={"caption"}>{"レギオンマッチ補助スキル"}</Typography>
                      </Divider>
                      <Typography variant={"body2"}>{card.skills.autoSkill.raw.name}</Typography>
                      {card.skills.legendary && (
                        <>
                          <Divider flexItem={true} sx={{ my: 1, width: "80%" }}>
                            <Typography variant={"caption"}>{"レジェンダリースキル"}</Typography>
                          </Divider>
                          <Typography variant={"body2"}>
                            {card.skills.legendary.raw[4].name}
                          </Typography>
                        </>
                      )}
                    </Paper>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid size={4.8} sx={{ display: "flex", flexWrap: "wrap" }}>
          <Paper
            sx={{
              height: "80vh",
              width: "100%",
              maxWidth: 700,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              overflowY: "auto",
            }}
          >
            {edit.map((memoria) => (
              <MemoriaCard
                key={memoria.id}
                memoria={memoria}
                onConcentrationChange={(value: number) => {
                  setEdit((prev) =>
                    prev.map((m) => (m.id === memoria.id ? { ...m, limitBreak: value } : m)),
                  );
                }}
                onClick={() => setInfo(() => uniqueMemoriaList.get(memoria.id))}
                onContextMenu={() => setEdit((prev) => prev.filter((m) => m.id !== memoria.id))}
              />
            ))}
          </Paper>
        </Grid>
        <Grid size={4.8}>
          <Paper
            sx={{
              height: "80vh",
              width: "100%",
              maxWidth: 700,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              overflowY: "auto",
            }}
          >
            {NotYetRegistered.map((memoria) => {
              return (
                <ImageWithFallback
                  src={`/memoria/${memoria.name.short}.png`}
                  alt={memoria.name.full}
                  fallback={"/memoria/CommingSoon.jpeg"}
                  width={100}
                  height={100}
                  key={memoria.id}
                  onClick={() => setInfo(() => uniqueMemoriaList.get(memoria.id))}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setEdit((prev) => {
                      const add = {
                        id: memoria.id,
                        name: memoria.name.full,
                        limitBreak: 0,
                      };
                      return [...prev, add];
                    });
                  }}
                />
              );
            })}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
