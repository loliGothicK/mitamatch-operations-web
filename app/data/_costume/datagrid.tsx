import Paper from "@mui/material/Paper";
import { type Costume, costumeList as dataSource } from "@/domain/costume/costume";

import { DataGrid, type GridColDef, type GridColumnVisibilityModel } from "@mui/x-data-grid";
import { Lenz } from "@/domain/lenz";
import Image from "next/image";
import { useState } from "react";
import Link from "@/components/link";
import { QueryConsle } from "@/data/_common/QueryConsle";
import { Clazz, SchemaResolver } from "@/parser/query/filter";
import { useVisivility } from "@/data/_common/useVisivility";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { match, P } from "ts-pattern";
import { option } from "fp-ts";
import { ComleteCandidate } from "@/data/_common/autocomplete";
import { isSome } from "fp-ts/lib/Option";

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
  {
    field: "specialSkill",
    headerName: "Special Skill",
    width: 1000,
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
                {get({ limitBreak: 0, isAwakened: true }).map(({ name, description }) => {
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
];

const paginationModel = { page: 0, pageSize: 10 };

export const schema = {
  costume: [
    "name",
    "type",
    "atk",
    "spatk",
    "def",
    "spdef",
    "rareSkill.name",
    "rareSkill.desc",
    "specialSkill",
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
  specialSkill: {
    type: "clazz",
    accessor: (costume: Costume) => ({ data: costume.specialSkill }),
  },
};

const visivilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
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
      operator: ({ data }: Clazz, pattern: string): boolean => {
        return pattern
          .replaceAll(" ", "")
          .split(",")
          .every((query) =>
            match(query)
              .with("EX", () => isSome(data) && data.value.type === "ex")
              .with("ADX", () => isSome(data) && data.value.type === "adx")
              .with("覚醒", () => isSome(data) && data.value.type === "adx" && data.value.awakable)
              .with(P.union("火", "水", "風", "光", "闇"), (attribute) =>
                match(data)
                  .with({ value: { type: "ex", skills: P._.select() } }, (skills) =>
                    skills.some(({ name }) => name.includes(`${attribute}属性メモリア効果増加`)),
                  )
                  .with({ value: { type: "adx", get: P._.select() } }, (get) =>
                    get({ limitBreak: 3, isAwakened: true }).some(({ name }) =>
                      name.includes(`${attribute}属性メモリア効果増加`),
                    ),
                  )
                  .otherwise(() => false),
              )
              .with(P.union("対火", "対水", "対風", "対光", "対闇"), (attribute) =>
                match(data)
                  .with({ value: { type: "ex", skills: P._.select() } }, (skills) =>
                    skills.some(({ name }) => name.includes(`${attribute.replace('対', '')}属性メモリア効果耐性`)),
                  )
                  .with({ value: { type: "adx", get: P._.select() } }, (get) =>
                    get({ limitBreak: 3, isAwakened: true }).some(({ name }) =>
                      name.includes(`${attribute.replace('対', '')}属性メモリア効果耐性`),
                    ),
                  )
                  .otherwise(() => false),
              )
              .run(),
          );
      },
    },
  },
};

export function Datagrid({ initialQuery }: { initialQuery?: string }) {
  const [visivility, setVisivility, visivilityChanged] = useVisivility(visivilityAll);
  const [rows, setRows] = useState<Costume[]>(dataSource.toReversed());

  return (
    <Paper style={{ display: "flex", width: "100%", flexDirection: "column" }}>
      <QueryConsle
        type={"costume"}
        origin={dataSource.toReversed()}
        resolver={resolver}
        initial={initialQuery || "select * from costume where `specialSkill` like 'ADX, 覚醒';"}
        schema={schema}
        updateVisivilityAction={visivilityChanged}
        updateDataAction={setRows}
        completion={completeCandidates}
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
