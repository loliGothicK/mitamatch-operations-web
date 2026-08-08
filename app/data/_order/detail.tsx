"use client";

import { notFound } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Breadcrumbs,
  Paper,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import Link from "@/components/link";
import { orderList } from "@/domain/order/order";
import { OrderIcon } from "@/components/image/OrderIcon";

export default function OrderDetail({ id }: { id: string }) {
  const order = orderList.find((item) => item.id === id);
  if (!order) notFound();

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "80%" },
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, md: 3 },
        mt: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          sx={{ justifyContent: "flex-start", alignItems: { xs: "center", sm: "flex-start" } }}
        >
          <OrderIcon order={order} size={120} />
          <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
            <Breadcrumbs
              separator="›"
              aria-label="breadcrumb"
              sx={{ justifyContent: { xs: "center", sm: "flex-start" }, display: "flex", mb: 1 }}
            >
              <Link underline="hover" color="inherit" href="/data">
                data
              </Link>
              <Link underline="hover" color="inherit" href="/data/order">
                order
              </Link>
              <Typography sx={{ color: "text.primary" }}>{order.name}</Typography>
            </Breadcrumbs>
            <Typography variant="h4" sx={{ fontWeight: "bold" }} gutterBottom>
              {order.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
                mt: 1,
              }}
            >
              <Chip label={`準備時間: ${order.prepare_time}`} size="small" variant="outlined" />
              <Chip
                label={`効果時間: ${order.active_time}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ width: "100%" }}>
        <Divider textAlign="left" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
            オーダー効果
          </Typography>
        </Divider>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main", mb: 1.5 }}>
              {order.effect}
            </Typography>
            <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
              {order.description}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
