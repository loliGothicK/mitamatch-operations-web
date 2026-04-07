"use client";

import type { Unit } from "@/domain/types";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { blue, green, purple, red, yellow } from "@mui/material/colors";
import { match } from "ts-pattern";

type ShareMemoria = Unit["deck"][number] | Unit["legendaryDeck"][number];
const DECK_WIDTH = 600;

const roleIconMap = {
  1: "/NormalSingle.png",
  2: "/NormalRange.png",
  3: "/SpecialSingle.png",
  4: "/SpecialRange.png",
  5: "/Assist.png",
  6: "/Interference.png",
  7: "/Recovery.png",
} as const;

function attributeColor(attribute: ShareMemoria["attribute"]) {
  return match(attribute)
    .with("Fire", () => red[500])
    .with("Water", () => blue[500])
    .with("Wind", () => green[500])
    .with("Light", () => yellow[500])
    .with("Dark", () => purple[500])
    .exhaustive();
}

function RoleIcon({
  cardType,
  attribute,
}: {
  cardType: ShareMemoria["cardType"];
  attribute: ShareMemoria["attribute"];
}) {
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        left: 67,
        top: -1,
        position: "absolute",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: attributeColor(attribute),
        zIndex: 2,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.32)",
      }}
    >
      <Box
        component="img"
        src={roleIconMap[cardType]}
        alt=""
        sx={{ width: 28, height: 28, display: "block" }}
      />
    </Box>
  );
}

function ConcentrationBadge({ concentration }: { concentration: number }) {
  return (
    <Box
      sx={{
        top: 31,
        left: 69,
        width: 30,
        height: 30,
        position: "absolute",
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "common.white",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)",
        }}
      >
        {concentration === 4 ? "MAX" : concentration}
      </Box>
      <Box
        component="img"
        src="/Concentration.png"
        alt=""
        sx={{ width: 30, height: 30, display: "block" }}
      />
    </Box>
  );
}

function MemoriaCard({ memoria }: { memoria: ShareMemoria }) {
  return (
    <Box sx={{ width: 100 }}>
      <Box sx={{ position: "relative", width: 100, height: 100 }}>
        <RoleIcon cardType={memoria.cardType} attribute={memoria.attribute} />
        <ConcentrationBadge concentration={memoria.concentration} />
        <Box
          component="img"
          src={`/memoria/${memoria.name.short}.png`}
          alt={memoria.name.full}
          sx={{
            width: 100,
            height: 100,
            display: "block",
            objectFit: "cover",
            borderRadius: 0.5,
          }}
        />
      </Box>
    </Box>
  );
}

function DeckRow({
  title,
  memories,
}: {
  title: string;
  memories: ShareMemoria[];
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        width: DECK_WIDTH,
        p: 2,
        borderRadius: 2,
        boxShadow: `0 16px 36px ${alpha(theme.palette.common.black, 0.18)}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 100px)",
          gap: 2,
          minHeight: 100,
        }}
      >
        {memories.map((memoria) => (
          <MemoriaCard key={memoria.id} memoria={memoria} />
        ))}
      </Box>
    </Box>
  );
}

export function DeckShareCard({
  title,
  deck,
  legendaryDeck,
}: Omit<Unit, 'sw'> & { title: string }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: DECK_WIDTH + 160,
        p: 4,
        color: theme.palette.text.primary,
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.14)} 0%, ${alpha(
          theme.palette.background.default,
          0.98,
        )} 22%)`,
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Box
          sx={{
            width: DECK_WIDTH,
            backgroundColor: alpha(theme.palette.background.paper, 0.92),
            borderRadius: 2,
            px: 2.5,
            py: 2,
            boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.12)}`,
          }}
        >
          <Typography variant="h5" fontWeight={800}>
            {title || "No Title"}
          </Typography>
        </Box>

        {legendaryDeck.length > 0 && <DeckRow title="Legendary Deck" memories={legendaryDeck} />}

        {legendaryDeck.length > 0 && <Divider />}

        <DeckRow title="Main Deck" memories={deck} />
      </Stack>
    </Box>
  );
}
