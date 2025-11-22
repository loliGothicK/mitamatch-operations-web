import Paper from "@mui/material/Paper";
import {
  type Costume,
  costumeList as dataSource,
} from "@/domain/costume/costume";

import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { Lenz } from "@/domain/lenz";
import Image from "next/image";
import { useState } from "react";
import Link from "@/components/link";
import { QueryConsle } from "@/data/_common/QueryConsle";
import { SchemaResolver } from "@/parser/query/filter";
import { useVisivility } from "@/data/_common/useVisivility";
import { Tooltip, Typography } from "@mui/material";

const columns: GridColDef<Costume>[] = [
  {
    field: "image",
    headerName: "Image",
    width: 100,
    valueGetter: (_, costume) => ({
      id: Lenz.costume.general.id.get(costume),
      name: Lenz.costume.general.name.full.get(costume),
    }),
    renderCell: (params) => (
      <Link
        href={`/data/costume/${encodeURI(Lenz.costume.general.name.lily.get(params.row))}/${encodeURI(Lenz.costume.general.name.job.get(params.row))}`}
      >
        <Image
          src={`/costume/icon/${Lenz.costume.general.name.lily.get(params.row)}/${Lenz.costume.general.name.job.get(params.row)}.jpg`}
          alt={params.value.name}
          width={80}
          height={80}
        />
      </Link>
    ),
    sortComparator: (a, b) => a.id - b.id,
  },
  {
    field: "name",
    headerName: "Name",
    width: 200,
    valueGetter: (_, costume) => Lenz.costume.general.name.full.get(costume),
  },
  {
    field: "type",
    headerName: "Type",
    width: 100,
    valueGetter: (_, costume) => Lenz.costume.general.cardType.get(costume),
  },
  {
    field: "atk",
    headerName: "ATK",
    type: "number",
    width: 80,
    valueGetter: (_, costume) => Lenz.costume.general.atk.get(costume),
  },
  {
    field: "spatk",
    headerName: "Sp.ATK",
    type: "number",
    width: 80,
    valueGetter: (_, costume) => Lenz.costume.general.spatk.get(costume),
  },
  {
    field: "def",
    headerName: "DEF",
    type: "number",
    width: 80,
    valueGetter: (_, costume) => Lenz.costume.general.def.get(costume),
  },
  {
    field: "spdef",
    headerName: "Sp.DEF",
    type: "number",
    width: 80,
    valueGetter: (_, costume) => Lenz.costume.general.spdef.get(costume),
  },
  {
    field: "rareSkill",
    headerName: "Rare Skill",
    width: 200,
    valueGetter: (_, costume) => costume.rareSkill,
    renderCell: (params) => (
      <Tooltip
        title={params.row.rareSkill.description}
        placement="top"
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography>{params.row.rareSkill.name}</Typography>
      </Tooltip>
    ),
  },
];

const paginationModel = { page: 0, pageSize: 10 };

const schema = {
  costume: [
    "name",
    "type",
    "atk",
    "spatk",
    "def",
    "spdef",
    "rareSkill.name",
    "rareSkill.desc",
  ],
};

const resolver: SchemaResolver<Costume> = {
  name: {
    type: "string",
    accessor: (costume: Costume) => Lenz.costume.general.name.full.get(costume),
  },
  type: {
    type: "string",
    accessor: (costume: Costume) => Lenz.costume.general.cardType.get(costume),
  },
  atk: {
    type: "number",
    accessor: (costume: Costume) => Lenz.costume.general.atk.get(costume),
  },
  spatk: {
    type: "number",
    accessor: (costume: Costume) => Lenz.costume.general.spatk.get(costume),
  },
  def: {
    type: "number",
    accessor: (costume: Costume) => Lenz.costume.general.def.get(costume),
  },
  spdef: {
    type: "number",
    accessor: (costume: Costume) => Lenz.costume.general.spdef.get(costume),
  },
  "rareSkill.name": {
    type: "string",
    accessor: (costume: Costume) => costume.rareSkill.name,
  },
  "rareSkill.desc": {
    type: "string",
    accessor: (costume: Costume) => costume.rareSkill.description,
  },
};

const visivilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

export function Datagrid({ initialQuery }: { initialQuery?: string }) {
  const [visivility, setVisivility, visivilityChanged] =
    useVisivility(visivilityAll);
  const [rows, setRows] = useState<Costume[]>(dataSource.toReversed());

  return (
    <Paper style={{ display: "flex", width: "100%", flexDirection: "column" }}>
      <QueryConsle
        type={"costume"}
        origin={dataSource.toReversed()}
        resolver={resolver}
        initial={
          initialQuery || "select * from costume where `type` = '特殊範囲';"
        }
        schema={schema}
        updateVisivilityAction={visivilityChanged}
        updateDataAction={setRows}
      />
      <DataGrid
        rows={rows}
        rowHeight={80}
        columns={columns}
        columnVisibilityModel={visivility}
        onColumnVisibilityModelChange={setVisivility}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10, 50, 100]}
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
