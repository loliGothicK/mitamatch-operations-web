import { type Costume, costumeList as dataSource } from "@/domain/costume/costume";

import { type GridColDef, type GridColumnVisibilityModel } from "@mui/x-data-grid";
import { Lenz } from "@/domain/lenz";
import Image from "next/image";
import { JSX, useMemo } from "react";
import Link from "@/components/link";
import { Clazz, SchemaResolver } from "@/parser/query/filter";
import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Tooltip,
  Typography,
} from "@mui/material";
import { match, P } from "ts-pattern";
import { option } from "fp-ts";
import { ComleteCandidate } from "@/data/_common/autocomplete";
import { isSome } from "fp-ts/lib/Option";
import { DataGrid } from "@/data/_common/DataGrid";

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
      <Link href={`/data/costume/${Lenz.costume.general.name.normalized.URI.get(params.row)}`}>
        <Image
          src={`/costume/icon/${Lenz.costume.general.name.normalized.full.get(params.row)}.jpg`}
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
    width: 80,
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
  {
    field: "specialSkill",
    headerName: "Special Skill",
    width: 1080,
    valueGetter: (_, costume) => costume.specialSkill,
    renderCell: (params) => (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        {match(params.row.specialSkill)
          .with(option.none, () => <></>)
          .with({ value: { type: "ex" } }, ({ value: { skills } }) => {
            return skills.map(({ name, description }) => (
              <Tooltip
                key={params.row.name + name}
                title={description}
                placement="top"
                sx={{
                  alignItems: "center",
                }}
              >
                <Chip label={name} />
              </Tooltip>
            ));
          })
          .with({ value: { type: "adx" } }, ({ value: { get } }) => {
            return (
              <>
                {get({ limitBreak: 3, isAwakened: true }).map(({ name, description }) => {
                  return (
                    <Tooltip
                      key={params.row.name + name}
                      title={description}
                      placement="top"
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Chip label={name} />
                    </Tooltip>
                  );
                })}
              </>
            );
          })
          .exhaustive()}
      </Box>
    ),
  },
  {
    field: "released_at",
    headerName: "Released Date",
    width: 100,
    valueGetter: (_, costume) => Lenz.costume.general.released_at.get(costume),
  },
];

export const schema = {
  costume: [
    "name",
    "type",
    "atk",
    "spatk",
    "def",
    "spdef",
    "rareSkill",
    "specialSkill",
    "released_at",
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
  rareSkill: {
    type: "clazz",
    accessor: (costume: Costume) => ({
      type: "rareSkill",
      data: costume.rareSkill,
    }),
  },
  specialSkill: {
    type: "clazz",
    accessor: (costume: Costume) => ({
      type: "specialSkill",
      data: costume.specialSkill,
    }),
  },
  released_at: {
    type: "string",
    accessor: (costume: Costume) => Lenz.costume.general.released_at.get(costume),
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
  specialSkill: {
    like: {
      pattern: [
        "EX",
        "ADX",
        "覚醒",
        "火",
        "水",
        "風",
        "光",
        "闇",
        "対火",
        "対水",
        "対風",
        "対光",
        "対闇",
      ],
      item: "clazz",
      operator: ({ type, data }: Clazz, pattern: string): boolean => {
        if (type !== "specialSkill") {
          return false;
        }
        return pattern
          .replaceAll(" ", "")
          .split(",")
          .every((query) =>
            match(query.trim())
              .with("EX", () => isSome(data) && data.value.type === "ex")
              .with("ADX", () => isSome(data) && data.value.type === "adx")
              .with("覚醒", () => isSome(data) && data.value.type === "adx" && data.value.awakable)
              .with(P.union("火", "水", "風", "光", "闇"), (attribute) =>
                match(data)
                  .with({ value: { type: "ex", skills: P._.select() } }, (skills) =>
                    skills.some(({ description }) =>
                      new RegExp(
                        String.raw`自身が使用する${attribute}属性メモリアのスキル効果([+-]?\d+(?:\.\d+)?)％UP`,
                        "g",
                      ).test(description),
                    ),
                  )
                  .with({ value: { type: "adx", get: P._.select() } }, (get) =>
                    get({ limitBreak: 3, isAwakened: true }).some(({ description }) =>
                      new RegExp(
                        String.raw`自身が使用する${attribute}属性メモリアのスキル効果([+-]?\d+(?:\.\d+)?)％UP`,
                        "g",
                      ).test(description),
                    ),
                  )
                  .otherwise(() => false),
              )
              .with(P.union("対火", "対水", "対風", "対光", "対闇"), ([, attribute]) =>
                match(data)
                  .with({ value: { type: "ex", skills: P._.select() } }, (skills) =>
                    skills.some(({ description }) =>
                      new RegExp(
                        String.raw`自身に対する${attribute}属性メモリアのダメージ/妨害スキル効果([+-]?\d+(?:\.\d+)?)％DOWN`,
                        "g",
                      ).test(description),
                    ),
                  )
                  .with({ value: { type: "adx", get: P._.select() } }, (get) =>
                    get({ limitBreak: 3, isAwakened: true }).some(({ description }) =>
                      new RegExp(
                        String.raw`自身に対する${attribute}属性メモリアのダメージ/妨害スキル効果([+-]?\d+(?:\.\d+)?)％DOWN`,
                        "g",
                      ).test(description),
                    ),
                  )
                  .otherwise(() => false),
              )
              .otherwise(() => false),
          );
      },
    },
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
        {schema.costume.map((col) => (
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
      table={"costume"}
      origin={original}
      resolver={resolver}
      initialQuery={initialQuery}
      schema={schema}
      completion={completeCandidates}
      help={<Help />}
      columns={columns}
      visibilityAll={visibilityAll}
      hidden={["released_at"]}
    />
  );
}
