"use client";

import { Box, Paper } from "@mui/material";
import { DataGrid as MuiDataGrid, type GridColDef } from "@mui/x-data-grid";
import Link from "@/components/link";
import { WeaponIcon } from "@/components/image/WeaponIcon";
import { type Weapon, weaponList } from "@/domain/weapon/weapon";

const columns: GridColDef<Weapon>[] = [
  {
    field: "image",
    headerName: "Image",
    width: 110,
    sortable: false,
    renderCell: ({ row }) => (
      <Link href={`/data/weapon/${row.id}`}>
        <WeaponIcon weapon={row} size={80} />
      </Link>
    ),
  },
  { field: "name", headerName: "Name", width: 280 },
  {
    field: "effect",
    headerName: "Effect",
    flex: 1,
    minWidth: 500,
    valueGetter: (_, row) => row.effect.map(({ description }) => description).join(" / "),
  },
  {
    field: "status",
    headerName: "Status",
    width: 220,
    valueGetter: (_, row) => row.status.join(" / "),
  },
];

export function Datagrid() {
  return (
    <Paper sx={{ width: "100%" }}>
      <Box sx={{ height: "calc(100vh - 220px)", minHeight: 560 }}>
        <MuiDataGrid
          rows={weaponList.toReversed()}
          columns={columns}
          rowHeight={90}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          sx={{ border: 0 }}
        />
      </Box>
    </Paper>
  );
}
