"use client";

import { Box, Paper, Typography } from "@mui/material";
import { DataGrid as MuiDataGrid, type GridColDef } from "@mui/x-data-grid";
import Link from "@/components/link";
import { OrderIcon } from "@/components/image/OrderIcon";
import { type Order, orderList } from "@/domain/order/order";
import { useMediaQuery, useTheme } from "@mui/material";

const OrderGridIcon = ({ row }: { row: Order }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Link href={`/data/order/${row.id}`}>
      <OrderIcon order={row} size={isMobile ? 60 : 86} />
    </Link>
  );
};

const columns: GridColDef<Order>[] = [
  {
    field: "image",
    headerName: "Image",
    width: 110,
    sortable: false,
    renderCell: ({ row }) => (
      <OrderGridIcon row={row} />
    ),
  },
  { field: "name", headerName: "Name", width: 240 },
  { field: "effect", headerName: "Effect", width: 260 },
  { field: "description", headerName: "Description", flex: 1, minWidth: 420 },
  { field: "prepare_time", headerName: "Prepare", width: 100, type: "number" },
  { field: "active_time", headerName: "Active", width: 100, type: "number" },
];

export function Datagrid() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Paper sx={{ width: "100%" }}>
      <Box sx={{ height: "calc(100vh - 220px)", minHeight: 560 }}>
        <MuiDataGrid
          rows={orderList.toReversed()}
          columns={columns}
          rowHeight={isMobile ? 60 : 90}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          sx={{ border: 0 }}
          slots={{ noRowsOverlay: () => <Typography sx={{ p: 2 }}>No orders found.</Typography> }}
        />
      </Box>
    </Paper>
  );
}
