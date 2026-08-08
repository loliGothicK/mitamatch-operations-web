"use client";

import Box from "@mui/material/Box";
import { User } from "@/types/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderListAction, updateOrderAction } from "@/_actions/order";
import { Alert, Button, Divider, Grid, Paper, Snackbar, Stack, Typography } from "@mui/material";
import { useMemo, useState, useEffect, type MouseEvent } from "react";
import { type Order, orderList } from "@/domain/order/order";
import { OrderIcon } from "@/components/image/OrderIcon";
import Ribbon, { RibbonGroup } from "@/components/toolbar/Toolbar";
import { Save, Undo, Redo } from "@mui/icons-material";
import { Switch } from "@mui/material";

type Props = {
  user: User;
};

function OrderCard({
  order,
  onClick,
  onContextMenu,
}: {
  order: Order;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <Box
      sx={{ position: "relative", width: 100, height: 100, cursor: "pointer" }}
      onClick={onClick}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event);
      }}
    >
      <OrderIcon order={order} size={100} />
    </Box>
  );
}

export function OrderRegistration(_props: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<Order | undefined>(undefined);

  const [payed, setPayed] = useState(true);

  const { data: registered } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrderListAction(),
  });

  const [edit, setEdit] = useState<string[]>([]);

  useEffect(() => {
    if (registered) {
      setEdit(registered.map((r) => r.id));
    }
  }, [registered]);

  const currentOrderList = useMemo(() => {
    return orderList.filter((order) => order.payed === payed);
  }, [payed]);

  const NotYetRegistered = useMemo(() => {
    return currentOrderList.filter((order) => !edit.includes(order.id));
  }, [edit, currentOrderList]);

  const RegisteredOrders = useMemo(() => {
    return edit
      .map((id) => orderList.find((o) => o.id === id))
      .filter((o): o is Order => o !== undefined && o.payed === payed);
  }, [edit, payed]);

  const mutation = useMutation({
    mutationFn: updateOrderAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
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
              const originalIds = registered?.map((r) => r.id) || [];
              const remove = originalIds.filter((id) => !edit.includes(id));
              mutation.mutate({
                update: edit,
                remove,
              });
              setOpen(true);
            }}
          >
            <Save />
          </Button>
        </RibbonGroup>
        <RibbonGroup label={"edit"}>
          <Button onClick={() => setEdit(registered?.map((r) => r.id) || [])}>
            <Undo />
          </Button>
          <Button>
            <Redo />
          </Button>
        </RibbonGroup>
        <RibbonGroup label={"filter"}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2">無課金</Typography>
            <Switch
              checked={payed}
              onChange={() => setPayed((prev) => !prev)}
              aria-label="paid orders"
            />
            <Typography variant="body2">課金</Typography>
          </Box>
        </RibbonGroup>
      </Ribbon>
      <Grid container spacing={3} sx={{ mt: 2, width: "100%" }}>
        <Grid size={{ xs: 12, md: 2.4 }} sx={{ display: "flex", flexWrap: "wrap" }}>
          <Paper sx={{ minHeight: "80vh", width: "100%", display: "flex", flexWrap: "wrap" }}>
            {info && (
              <Stack direction={"column"} sx={{ p: 2 }}>
                <Typography variant={"subtitle1"}>{info.name}</Typography>
                <OrderIcon order={info} size={100} />
                <Box sx={{ mt: 2 }}>
                  <Divider flexItem={true} sx={{ my: 1, width: "100%" }}>
                    <Typography variant={"subtitle2"}>効果</Typography>
                  </Divider>
                  <Typography variant={"body2"}>{info.effect}</Typography>
                  <Divider flexItem={true} sx={{ my: 1, width: "100%" }}>
                    <Typography variant={"subtitle2"}>説明</Typography>
                  </Divider>
                  <Typography variant={"body2"}>{info.description}</Typography>
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4.8 }} sx={{ display: "flex", flexWrap: "wrap" }}>
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
            {RegisteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setInfo(order)}
                onContextMenu={() => setEdit((prev) => prev.filter((id) => id !== order.id))}
              />
            ))}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4.8 }}>
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
            {NotYetRegistered.map((order) => {
              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => setInfo(order)}
                  onContextMenu={() => {
                    setEdit((prev) => [...prev, order.id]);
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
