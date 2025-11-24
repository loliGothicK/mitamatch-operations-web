import Paper from "@mui/material/Paper";
import {
  type Memoria,
  memoriaList as dataSource,
} from "@/domain/memoria/memoria";

import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { Lenz } from "@/domain/lenz";
import type { Attribute } from "@/parser/skill";
import { match } from "ts-pattern";
import Image from "next/image";
import { useState } from "react";
import Link from "@/components/link";
import { QueryConsle } from "@/data/_common/QueryConsle";
import { SchemaResolver } from "@/parser/query/filter";
import { useVisivility } from "@/data/_common/useVisivility";
import { ComleteCandidate } from "@/data/_common/autocomplete";

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
      <Link
        href={`/data/memoria/${encodeURI(params.row.name.full)}?type=${
          match(params.row.cardType)
            .with('通常単体', () => 1)
            .with('通常範囲', () => 2)
            .with('特殊単体', () => 3)
            .with('特殊範囲', () => 4)
            .with('支援', () => 5)
            .with('妨害', () => 6)
            .with('回復', () => 7)
            .exhaustive()
        }`}
      >
        <Image
          src={`/memoria/${params.value.name}.png`}
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
    valueGetter: (_, memoria) => Lenz.memoria.general.fullName.get(memoria),
  },
  {
    field: "type",
    headerName: "Type",
    width: 100,
    valueGetter: (_, memoria) => Lenz.memoria.general.cardType.get(memoria),
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
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.general.spatk.get(memoria),
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
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.general.spdef.get(memoria),
  },
  {
    field: "questSkill",
    headerName: "Quest Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.general.questSkill.get(memoria).raw.name,
  },
  {
    field: "gvgSkill",
    headerName: "GVG Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.general.gvgSkill.get(memoria).raw.name,
  },
  {
    field: "autoSkill",
    headerName: "Auto Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.general.autoSkill.get(memoria).raw.name,
  },
];

const paginationModel = { page: 0, pageSize: 10 };

export const schema = {
  memoria: [
    "name",
    "type",
    "attribute",
    "cost",
    "atk",
    "spatk",
    "def",
    "spdef",
    "questSkill.name",
    "questSkill.desc",
    "gvgSkill.name",
    "gvgSkill.desc",
    "autoSkill.name",
    "autoSkill.desc",
  ],
};

const resolver: SchemaResolver<Memoria> = {
  name: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.fullName.get(memoria),
  },
  type: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.cardType.get(memoria),
  },
  attribute: {
    type: "string",
    accessor: (memoria: Memoria) =>
      match(Lenz.memoria.general.attribute.get(memoria))
        .with("Fire", () => "火")
        .with("Water", () => "水")
        .with("Wind", () => "風")
        .with("Light", () => "光")
        .with("Dark", () => "闇")
        .exhaustive(),
  },
  cost: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.cost.get(memoria),
  },
  atk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.atk.get(memoria),
  },
  spatk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.spatk.get(memoria),
  },
  def: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.def.get(memoria),
  },
  spdef: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.general.spdef.get(memoria),
  },
  "questSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.questSkill.get(memoria).raw.name,
  },
  "questSkill.desc": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.questSkill.get(memoria).raw.description,
  },
  "gvgSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.gvgSkill.get(memoria).raw.name,
  },
  "gvgSkill.desc": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.gvgSkill.get(memoria).raw.description,
  },
  "autoSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.autoSkill.get(memoria).raw.name,
  },
  "autoSkill.desc": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.general.autoSkill.get(memoria).raw.description,
  },
};

const visivilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

const enumMap: Record<string, ComleteCandidate> = {
  type: {
    equals: [
      "'通常単体'",
      "'通常範囲'",
      "'特殊単体'",
      "'特殊範囲'",
      "'支援'",
      "'妨害'",
      "'回復'",
    ],
    like: {
      pattern: ["前衛", "後衛", "通常", "特殊"],
      operator: (item: string, pattern: string): boolean => {
        return match(pattern)
          .with("前衛", () =>
            ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(item),
          )
          .with("後衛", () => ["支援", "妨害", "回復"].includes(item))
          .with("通常", () => ["通常単体", "通常範囲"].includes(item))
          .with("特殊", () => ["特殊単体", "特殊範囲"].includes(item))
          .run();
      },
    },
  },
  attribute: {
    equals: ["'火'", "'水'", "'風'", "'光'", "'闇'"],
  },
};

export function Datagrid({ initialQuery }: { initialQuery?: string }) {
  const [visivility, setVisivility, visivilityChanged] =
    useVisivility(visivilityAll);
  const [rows, setRows] = useState<Memoria[]>(dataSource.toReversed());

  return (
    <Paper style={{ display: "flex", width: "100%", flexDirection: "column" }}>
      <QueryConsle
        type={"memoria"}
        origin={dataSource.toReversed()}
        resolver={resolver}
        initial={initialQuery || "select * from memoria where `cost` > 18;"}
        schema={schema}
        updateVisivilityAction={visivilityChanged}
        updateDataAction={setRows}
        completion={enumMap}
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
