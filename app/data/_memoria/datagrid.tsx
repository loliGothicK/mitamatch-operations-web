import { formatCardType, type Memoria, memoriaList as dataSource } from "@/domain/memoria/memoria";

import { type GridColDef, type GridColumnVisibilityModel } from "@mui/x-data-grid";
import { Lenz } from "@/domain/lenz";
import type { Attribute } from "@/parser/skill";
import { match } from "ts-pattern";
import { JSX, useMemo } from "react";
import Link from "@/components/link";
import { SchemaResolver } from "@/parser/query/filter";
import { ComleteCandidate } from "@/data/_common/autocomplete";
import { Box, List, ListItem, ListItemText, ListSubheader, Typography } from "@mui/material";
import { MemoriaIcon } from "@/components/image/MemoriaIcon";
import { DataGrid } from "@/data/_common/DataGrid";

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
    width: 200,
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
    field: "questSkill",
    headerName: "Quest Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.questSkill.get(memoria).raw.name,
  },
  {
    field: "gvgSkill",
    headerName: "GVG Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.gvgSkill.get(memoria).raw.name,
  },
  {
    field: "autoSkill",
    headerName: "Auto Skill",
    width: 300,
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.general.autoSkill.get(memoria).raw.name,
  },
];

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
    "questSkill",
    "gvgSkill",
    "autoSkill",
    "label",
  ],
};

const resolver: SchemaResolver<Memoria> = {
  name: {
    type: "string",
    accessor: (memoria: Memoria) => Lenz.memoria.general.fullName.get(memoria),
  },
  type: {
    type: "string",
    accessor: (memoria: Memoria) => formatCardType(Lenz.memoria.general.cardType.get(memoria)),
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
  questSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.questSkill.get(memoria).raw,
    }),
  },
  gvgSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.gvgSkill.get(memoria).raw,
    }),
  },
  autoSkill: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "memoriaSkill",
      data: Lenz.memoria.general.gvgSkill.get(memoria).raw,
    }),
  },
  label: {
    type: "clazz",
    accessor: (memoria: Memoria) => ({
      type: "labels",
      data: Lenz.memoria.general.labels.get(memoria),
    }),
  },
};

const visibilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

const completeCandidates: Record<string, ComleteCandidate> = {
  type: {
    equals: ["通常単体", "通常範囲", "特殊単体", "特殊範囲", "支援", "妨害", "回復"],
    like: {
      pattern: ["前衛", "後衛", "通常", "特殊"],
      item: "string",
      operator: (item: string, pattern: string): boolean => {
        return match(pattern)
          .with("前衛", () => ["通常単体", "通常範囲", "特殊単体", "特殊範囲"].includes(item))
          .with("後衛", () => ["支援", "妨害", "回復"].includes(item))
          .with("通常", () => ["通常単体", "通常範囲"].includes(item))
          .with("特殊", () => ["特殊単体", "特殊範囲"].includes(item))
          .run();
      },
    },
  },
  attribute: {
    equals: ["火", "水", "風", "光", "闇"],
  },
  label: {
    equals: ["legendary", "ultimate"],
  },
};

/**
 * A functional React component that provides help-related content.
 *
 * @return {JSX.Element} The rendered JSX element representing the help section.
 */
function Help(): JSX.Element {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        クエリ構文ヘルプ
      </Typography>
      <Typography variant="body1" component={"p"}>
        MySQLライクなクエリを使用してデータをフィルタリング、ソートできます。
      </Typography>
      <List dense>
        <ListSubheader>サポートされているキーワード</ListSubheader>
        <ListItem>
          <ListItemText
            primary="SELECT"
            secondary="表示するカラムを選択します。例: SELECT `name`, `atk`"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="WHERE"
            secondary="データをフィルタリングします。例: WHERE `cost` > 18 AND `type` = '支援'"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="ORDER BY"
            secondary="データをソートします。例: ORDER BY `atk` DESC"
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="LIMIT" secondary="表示する行数を制限します。例: LIMIT 10" />
        </ListItem>
      </List>
      <List dense>
        <ListSubheader>利用可能なカラム</ListSubheader>
        {schema.memoria.map((col) => (
          <ListItem key={col} sx={{ py: 0 }}>
            <ListItemText primary={`\`${col}\``} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export function Datagrid({ initialQuery }: { initialQuery?: string }) {
  const original = useMemo(() => dataSource.toReversed(), []);

  return (
    <DataGrid
      table={"memoria"}
      origin={original}
      resolver={resolver}
      initialQuery={initialQuery}
      schema={schema}
      completion={completeCandidates}
      help={<Help />}
      columns={columns}
      visibilityAll={visibilityAll}
      hidden={["questSkill"]}
    />
  );
}
