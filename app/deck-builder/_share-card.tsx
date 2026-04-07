"use client";

import type { Unit } from "@/domain/types";
import { formatCardType } from "@/domain/memoria/memoria";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function MemoriaCard({
  memoria,
}: {
  memoria: Unit["deck"][number] | Unit["legendaryDeck"][number];
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 150,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <img
        src={`/memoria/${memoria.name.short}.png`}
        alt={memoria.name.full}
        width={150}
        height={150}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      <Box sx={{ p: 1 }}>
        <Typography fontSize={12} fontWeight={700} lineHeight={1.4}>
          {memoria.name.full}
        </Typography>
        <Typography fontSize={11} color="text.secondary">
          {formatCardType(memoria.cardType)}
        </Typography>
        <Chip size="small" label={`Concentration ${memoria.concentration}`} sx={{ mt: 1 }} />
      </Box>
    </Box>
  );
}

export function DeckShareCard({
  title,
  sw,
  deck,
  legendaryDeck,
}: Unit & { title: string }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 1280,
        p: 4,
        color: theme.palette.text.primary,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.24)}, ${alpha(
          theme.palette.secondary.light,
          0.28,
        )})`,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {title || "No Title"}
            </Typography>
            <Typography color="text.secondary">
              {sw === "sword" ? "前衛" : "後衛"} Deck Builder
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={`Main ${deck.length}`} color="primary" />
            <Chip label={`Legendary ${legendaryDeck.length}`} color="secondary" />
          </Stack>
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.88),
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Main Deck
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {deck.map((memoria) => (
              <MemoriaCard key={`${memoria.id}-${memoria.cardType}`} memoria={memoria} />
            ))}
          </Box>
        </Box>

        {legendaryDeck.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.background.paper, 0.88),
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Legendary Deck
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {legendaryDeck.map((memoria) => (
                <MemoriaCard key={`${memoria.id}-${memoria.cardType}`} memoria={memoria} />
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
