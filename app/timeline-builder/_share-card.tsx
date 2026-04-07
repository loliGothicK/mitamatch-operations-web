"use client";

import type { OrderWithPic } from "@/jotai/orderAtoms";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatTime, useComputedTimeline } from "@/timeline-builder/_hook";

export function TimelineShareCard({
  title,
  timeline,
}: {
  title: string;
  timeline: OrderWithPic[];
}) {
  const theme = useTheme();
  const computed = useComputedTimeline(timeline);

  return (
    <Box
      sx={{
        width: 1080,
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
            <Typography color="text.secondary">Timeline Builder</Typography>
          </Box>
          <Chip label={`${computed.length} Orders`} color="primary" />
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          }}
        >
          {computed.map((order, index) => (
            <Box key={order.id}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.2 }}>
                <Chip
                  label={`${index + 1}`}
                  size="small"
                  sx={{
                    minWidth: 40,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                  }}
                />
                <img
                  src={`/order/${order.name}.png`}
                  alt={order.name}
                  width={56}
                  height={56}
                  style={{ display: "block", borderRadius: 8 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={700}>{order.name}</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {order.effect}
                  </Typography>
                  {(order.pic || order.sub) && (
                    <Typography fontSize={12} color="text.secondary">
                      {[order.pic ? `PIC: ${order.pic}` : undefined, order.sub ? `Sub: ${order.sub}` : undefined]
                        .filter(Boolean)
                        .join(" / ")}
                    </Typography>
                  )}
                </Box>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography fontSize={12} color="text.secondary">
                    Start {formatTime(order.prepareStartTime)}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    End {formatTime(order.endTime)}
                  </Typography>
                </Stack>
              </Stack>
              {index < computed.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
