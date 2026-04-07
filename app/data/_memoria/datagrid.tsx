import { useMemo } from "react";
import { Tooltip, Typography } from "@mui/material";
import { type GridColDef, type GridColumnVisibilityModel } from "@mui/x-data-grid";
import { decodeTime } from "ulid";
import Link from "@/components/link";
import { DataGrid } from "@/data/_common/DataGrid";
import { Lenz } from "@/domain/lenz";
import {
  MemoriaQueryHelp,
  memoriaQueryCompletion,
  memoriaQueryResolver,
  memoriaQuerySchema,
} from "@/domain/memoria/query";
import { formatCardType, type Memoria, memoriaList as dataSource } from "@/domain/memoria/memoria";
import { MemoriaIcon } from "@/components/image/MemoriaIcon";
import { match } from "ts-pattern";
import type { Attribute } from "@/parser/skill";

const columns: GridColDef<Memoria>[] = [
  {
    field: "image",
    headerName: "Image",
    width: 100,
    valueGetter: (_, memoria) => ({
      id: Lenz.memoria.general.id.get(memoria),
      name: Lenz.memoria.general.shortName.get(memoria),
    }),
    renderCell: (params) => (
      <Link href={`/data/memoria/${encodeURI(params.row.name.full)}?type=${params.row.cardType}`}>
        <MemoriaIcon memoria={params.row} size={80} />
      </Link>
    ),
    sortComparator: (a, b) => a.id - b.id,
  },
  {
    field: "name",
    headerName: "Name",
    width: 300,
    valueGetter: (_, memoria) => Lenz.memoria.general.fullName.get(memoria),
  },
  {
    field: "type",
    headerName: "Type",
    width: 100,
    valueGetter: (_, memoria) => formatCardType(Lenz.memoria.general.cardType.get(memoria)),
  },
  {
    field: "attribute",
    headerName: "Attribute",
    description: "Attribute",
    width: 50,
    valueGetter: (value: Attribute) =>
      match(value)
        .with("Fire", () => "火")
        .with("Water", () => "水")
        .with("Wind", () => "風")
        .with("Light", () => "光")
        .with("Dark", () => "闇")
        .exhaustive(),
  },
  {
    field: "cost",
    headerName: "Cost",
    width: 50,
    type: "number",
  },
  {
    field: "atk",
    headerName: "ATK",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.atk.get(memoria),
  },
  {
    field: "spatk",
    headerName: "Sp.ATK",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.spatk.get(memoria),
  },
  {
    field: "def",
    headerName: "DEF",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.def.get(memoria),
  },
  {
    field: "spdef",
    headerName: "Sp.DEF",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.spdef.get(memoria),
  },
  {
    field: "released_at",
    headerName: "Released",
    width: 180,
    type: "dateTime",
    valueGetter: (_, memoria: Memoria) => new Date(decodeTime(memoria.id)),
  },
  {
    field: "questSkill",
    headerName: "Quest Skill",
    width: 300,
    valueGetter: (_, memoria) => Lenz.memoria.general.questSkill.get(memoria).raw,
    renderCell: (params) => (
      <Tooltip title={Lenz.memoria.general.questSkill.get(params.row).raw.description}>
        <Typography variant={"caption"}>
          {Lenz.memoria.general.questSkill.get(params.row).raw.name}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "gvgSkill",
    headerName: "GVG Skill",
    width: 300,
    valueGetter: (_, memoria) => Lenz.memoria.general.gvgSkill.get(memoria).raw,
    renderCell: (params) => (
      <Tooltip title={Lenz.memoria.general.gvgSkill.get(params.row).raw.description}>
        <Typography variant={"caption"}>
          {Lenz.memoria.general.gvgSkill.get(params.row).raw.name}
        </Typography>
      </Tooltip>
    ),
  },
  {
    field: "autoSkill",
    headerName: "Auto Skill",
    width: 300,
    valueGetter: (_, memoria) => Lenz.memoria.general.autoSkill.get(memoria).raw,
    renderCell: (params) => (
      <Tooltip title={Lenz.memoria.general.autoSkill.get(params.row).raw.description}>
        <Typography variant={"caption"}>
          {Lenz.memoria.general.autoSkill.get(params.row).raw.name}
        </Typography>
      </Tooltip>
    ),
  },
];

const visibilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

export function Datagrid({ initialQuery }: { initialQuery?: string }) {
  const original = useMemo(() => dataSource.toReversed(), []);

  return (
    <DataGrid
      table={"memoria"}
      origin={original}
      resolver={memoriaQueryResolver}
      initialQuery={initialQuery}
      schema={memoriaQuerySchema}
      completion={memoriaQueryCompletion}
      help={<MemoriaQueryHelp />}
      columns={columns}
      visibilityAll={visibilityAll}
    />
  );
}
