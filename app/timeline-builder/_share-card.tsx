"use client";

import type { OrderWithPic } from "@/jotai/orderAtoms";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatTime, useComputedTimeline } from "@/timeline-builder/_hook";

function PicPanel({
  pic,
  sub,
}: {
  pic?: string;
  sub?: string;
}) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        minHeight: 72,
        minWidth: 240,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)}, ${alpha(
          theme.palette.primary.main,
          0.08,
        )})`,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.16)}`,
      }}
    >
      {pic ? (
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 0.3,
            color: theme.palette.secondary.dark,
          }}
        >
          {pic}
        </Typography>
      ) : (
        <Typography fontSize={13} color="text.disabled" fontWeight={700}>
          PIC unset
        </Typography>
      )}
      {sub && (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.palette.primary.dark,
          }}
        >
          {sub}
        </Typography>
      )}
    </Stack>
  );
}

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
        width: 1220,
        p: 4,
        color: theme.palette.text.primary,
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(
          theme.palette.background.default,
          0.98,
        )} 18%)`,
      }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.94),
            boxShadow: `0 14px 30px ${alpha(theme.palette.common.black, 0.12)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={900}>
                {title || "No Title"}
              </Typography>
              <Typography color="text.secondary">Timeline Builder</Typography>
            </Box>
            <Chip
              label={`${computed.length} Orders`}
              sx={{
                height: 38,
                fontSize: 16,
                fontWeight: 800,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.92),
            boxShadow: `0 18px 36px ${alpha(theme.palette.common.black, 0.12)}`,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              px: 1,
              pb: 1.5,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 240px 220px",
              columnGap: 10,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={12} fontWeight={800} color="text.secondary">
                Order
              </Typography>
            </Box>
            <Box sx={{ minWidth: 240 }}>
              <Typography fontSize={12} fontWeight={800} color="text.secondary">
                PIC / SUB
              </Typography>
            </Box>
            <Box sx={{ ml: "auto", minWidth: 220 }}>
              <Typography fontSize={12} fontWeight={800} color="text.secondary">
                Start / End
              </Typography>
            </Box>
          </Stack>
          <Divider />
          {computed.map((order, index) => (
            <Box key={order.id}>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  py: 1.4,
                  px: 1,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 240px 220px",
                  columnGap: 10,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <Chip
                    label={`${index + 1}`}
                    size="small"
                    sx={{
                      minWidth: 42,
                      fontWeight: 800,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    }}
                  />
                  <Box
                    component="img"
                    src={`/order/${order.name}.png`}
                    alt={order.name}
                    sx={{
                      width: 64,
                      height: 64,
                      display: "block",
                      borderRadius: 2,
                      boxShadow: `0 6px 16px ${alpha(theme.palette.common.black, 0.18)}`,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography fontWeight={800} fontSize={17}>
                      {order.name}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      {order.effect}
                    </Typography>
                  </Box>
                </Stack>

                <PicPanel pic={order.pic} sub={order.sub} />

                <Box
                  sx={{
                    minWidth: 220,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between">
                    <Typography fontSize={18} fontWeight={900}>
                      {formatTime(order.prepareStartTime)}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      →
                    </Typography>
                    <Typography fontSize={18} fontWeight={900}>
                      {formatTime(order.endTime)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              {index < computed.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
