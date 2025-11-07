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
import { Lenz } from "@/domain/memoria/lens";
import type { Attribute } from "@/parser/skill";
import { match, P } from "ts-pattern";
import Image from "next/image";
import { useCallback, useState } from "react";
import Link from "@/components/link";
import { QueryConsle } from "@/data/_common/QueryConsle";
import { SchemaResolver } from "@/parser/query/filter";

const columns: GridColDef<Memoria>[] = [
  {
    field: "image",
    headerName: "Image",
    width: 100,
    valueGetter: (_, memoria) => ({
      id: Lenz.memoria.id.get(memoria),
      name: Lenz.memoria.shortName.get(memoria),
    }),
    renderCell: (params) => (
      <Link
        href={`/data/memoria/${encodeURI(params.row.name.full)}?type=${encodeURI(params.row.cardType)}`}
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
    valueGetter: (_, memoria) => Lenz.memoria.fullName.get(memoria),
  },
  {
    field: "type",
    headerName: "Type",
    width: 100,
    valueGetter: (_, memoria) => Lenz.memoria.cardType.get(memoria),
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
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.atk.get(memoria),
  },
  {
    field: "spatk",
    headerName: "Sp.ATK",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.spatk.get(memoria),
  },
  {
    field: "def",
    headerName: "DEF",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.def.get(memoria),
  },
  {
    field: "spdef",
    headerName: "Sp.DEF",
    type: "number",
    width: 80,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.spdef.get(memoria),
  },
  {
    field: "questSkill",
    headerName: "Quest Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.questSkill.get(memoria).raw.name,
  },
  {
    field: "gvgSkill",
    headerName: "GVG Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.gvgSkill.get(memoria).raw.name,
  },
  {
    field: "autoSkill",
    headerName: "Auto Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) =>
      Lenz.memoria.autoSkill.get(memoria).raw.name,
  },
];

const paginationModel = { page: 0, pageSize: 10 };

const schema = {
  memoria: [
    "name",
    "type",
    "attribute",
    "cost",
    "atk",
    "spatk",
    "def",
    "spdef",
    "questSkill",
    "gvgSkill",
    "autoSkill",
  ],
};

const resolver: SchemaResolver<Memoria> = {
  name: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.fullName.get(memoria),
  },
  type: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.cardType.get(memoria),
  },
  attribute: {
    type: "string",
    accessor: (memoria: Memoria) =>
      match(Lenz.memoria.attribute.get(memoria))
        .with("Fire", () => "火")
        .with("Water", () => "水")
        .with("Wind", () => "風")
        .with("Light", () => "光")
        .with("Dark", () => "闇")
        .exhaustive(),
  },
  cost: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.cost.get(memoria),
  },
  atk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.atk.get(memoria),
  },
  spatk: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.spatk.get(memoria),
  },
  def: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.def.get(memoria),
  },
  spdef: {
    type: "number",
    accessor: (memoria: Memoria) => Lenz.memoria.spdef.get(memoria),
  },
  "questSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.questSkill.get(memoria).raw.name,
  },
  "questSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.questSkill.get(memoria).raw.description,
  },
  "gvgSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.gvgSkill.get(memoria).raw.name,
  },
  "gvgSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.gvgSkill.get(memoria).raw.description,
  },
  "autoSkill.name": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.autoSkill.get(memoria).raw.name,
  },
  "autoSkill.description": {
    type: "string",
    accessor: (memoria: Memoria) =>
      Lenz.memoria.autoSkill.get(memoria).raw.description,
  },
};

const visivilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

export function MemoriaList({ initialQuery }: { initialQuery?: string }) {
  const [visivility, setVisivility] = useState(visivilityAll);
  const [rows, setRows] = useState<Memoria[]>(dataSource.toReversed());

  const visivilityChanged = useCallback(
    (whiteList: Set<GridColDef["field"]>) => {
      setVisivility(
        (prev): GridColumnVisibilityModel =>
          match(whiteList)
            .with(P.set("*"), () => visivilityAll)
            .otherwise(() =>
              Object.fromEntries(
                Object.entries(prev).map(([field]) => [
                  field as GridColDef["field"],
                  whiteList.has(field),
                ]),
              ),
            ),
      );
    },
    [setVisivility],
  );

  return (
    <Paper style={{ display: "flex", width: "100%", flexDirection: "column" }}>
      <QueryConsle
        origin={dataSource.toReversed()}
        resolver={resolver}
        initial={initialQuery}
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
