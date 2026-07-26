"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Link from "@/components/link";
import { orderList } from "@/domain/order/order";

export default function OrderDetail({ id }: { id: string }) {
  const order = orderList.find((item) => item.id === id);
  if (!order) notFound();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Link href="/data/order">← Order data</Link>
      <Card sx={{ mt: 2, maxWidth: 900 }}>
        <CardContent sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          <Image src={`/order/${order.id}.png`} alt={order.name} width={160} height={160} />
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography variant="h4" gutterBottom>
              {order.name}
            </Typography>
            <Typography variant="h6" gutterBottom>
              {order.effect}
            </Typography>
            <Typography color="text.secondary">{order.description}</Typography>
            <Typography sx={{ mt: 2 }}>Prepare: {order.prepare_time}</Typography>
            <Typography>Active: {order.active_time}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
