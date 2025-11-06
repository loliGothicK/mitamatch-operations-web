import Paper from "@mui/material/Paper";
import {
  type Memoria,
  memoriaList as dataSource,
} from "@/domain/memoria/memoria";
import { Box } from "@mui/system";

import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { Lenz } from "@/domain/memoria/lens";
import type { Attribute } from "@/parser/skill";
import { match, P } from "ts-pattern";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Console from "@/components/Console";
import { memoriaCompletionSource } from "@/data/_memoria/autocomplete";
import { Alert, IconButton, Snackbar, Tooltip } from "@mui/material";
import { PlayArrowRounded, Info, Share } from "@mui/icons-material";
import { sqlToModel } from "@/parser/query/sql";
import { flow, pipe } from "fp-ts/function";
import { either } from "fp-ts";
import { isSome } from "fp-ts/Option";
import build from "@/parser/query/filter";
import { isRight } from "fp-ts/Either";
import { Lens } from "monocle-ts";
import Link from "@/components/link";
import { schema } from "@/data/_schema/schema";

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
    valueGetter: (_, memoria: Memoria) => Lenz.memoria.spatk.get(memoria),
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

type ToastState = {
  open: boolean;
  vertical: "top" | "bottom";
  horizontal: "left" | "center" | "right";
  message: string;
  severity: "error" | "warning" | "info" | "success";
};

const openLens = Lens.fromProp<ToastState>()("open");
const messageLens = Lens.fromProp<ToastState>()("message");
const severityLens = Lens.fromProp<ToastState>()("severity");

const resolver: Record<string, (memoria: Memoria) => string | number> = {
  name: (memoria: Memoria) => Lenz.memoria.fullName.get(memoria),
  type: (memoria: Memoria) => Lenz.memoria.cardType.get(memoria),
  attribute: (memoria: Memoria) =>
    match(Lenz.memoria.attribute.get(memoria))
      .with("Fire", () => "火")
      .with("Water", () => "水")
      .with("Wind", () => "風")
      .with("Light", () => "光")
      .with("Dark", () => "闇")
      .exhaustive(),
  cost: (memoria: Memoria) => Lenz.memoria.cost.get(memoria),
  atk: (memoria: Memoria) => Lenz.memoria.atk.get(memoria),
  spatk: (memoria: Memoria) => Lenz.memoria.spatk.get(memoria),
  def: (memoria: Memoria) => Lenz.memoria.def.get(memoria),
  spdef: (memoria: Memoria) => Lenz.memoria.spdef.get(memoria),
  questSkill: (memoria: Memoria) =>
    Lenz.memoria.questSkill.get(memoria).raw.name,
  gvgSkill: (memoria: Memoria) => Lenz.memoria.gvgSkill.get(memoria).raw.name,
  autoSkill: (memoria: Memoria) => Lenz.memoria.autoSkill.get(memoria).raw.name,
};

const visivilityAll = columns.reduce<GridColumnVisibilityModel>((acc, col) => {
  acc[col.field] = true;
  return acc;
}, {});

export function MemoriaList({ initialQuery }: { initialQuery?: string }) {
  const [visivility, setVisivility] = useState(visivilityAll);
  const [query, setQuery] = useState(
    initialQuery
      ? decodeURI(initialQuery)
      : "select * from memoria where `cost` > 18;",
  );
  const [rows, setRows] = useState<Memoria[]>(dataSource.toReversed());
  const [state, setState] = useState<ToastState>({
    open: false,
    vertical: "top" as const,
    horizontal: "center" as const,
    message: "Query Error",
    severity: "error",
  });
  const shared = useCallback(async () => {
    await navigator.clipboard.writeText(
      `https://operations.mitama.io/data/memoria?query=${encodeURI(query)}`,
    );
    setState(
      flow(
        openLens.set(true),
        messageLens.set("Successfuly copeid URL to clipboard."),
        severityLens.set("success"),
      ),
    );
  }, [query]);

  const queryExecutor = useCallback(
    (first = false) => {
      return pipe(
        sqlToModel(query),
        either.map(([whiteList, expr]) => {
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
          if (isSome(expr)) {
            const pred = build(expr.value, resolver);
            if (isRight(pred)) {
              setRows(() => {
                return dataSource
                  .toReversed()
                  .filter((memoria) => pred.right.apply(memoria));
              });
              if (!first) {
                setState(
                  flow(
                    openLens.set(true),
                    messageLens.set(`Executed successfully.`),
                    severityLens.set("success"),
                  ),
                );
              }
            } else {
              setState(
                flow(
                  openLens.set(true),
                  messageLens.set(
                    `Query Build Error: ${pred.left.map((e) => e.msg).join("\n")}`,
                  ),
                  severityLens.set("error"),
                ),
              );
            }
          }
          return true;
        }),
        either.getOrElse((err) => {
          setState(
            flow(
              openLens.set(true),
              messageLens.set(
                `SQL Parse Error: ${err.map((e) => e.msg).join("\n")}`,
              ),
              severityLens.set("error"),
            ),
          );
          return true;
        }),
      );
    },
    [query],
  );
  const { vertical, horizontal, open, message, severity } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

  useEffect(() => {
    if (initialQuery !== undefined) queryExecutor(true);
  }, [initialQuery]); // oxlint-disable-line exhaustive-deps

  return (
    <Paper style={{ display: "flex", width: "100%", flexDirection: "column" }}>
      <Box display={"flex"} sx={{ justifyContent: "left" }}>
        <Snackbar
          anchorOrigin={{ vertical, horizontal }}
          autoHideDuration={2000}
          open={open}
          onClose={handleClose}
          key={vertical + horizontal}
        >
          <Alert severity={severity}>{message}</Alert>
        </Snackbar>
        <IconButton onClick={() => queryExecutor()} sx={{ marginRight: 1 }}>
          <Tooltip title={"Ctrl + Enter"} placement="top">
            <PlayArrowRounded />
          </Tooltip>
        </IconButton>
        <IconButton onClick={shared}>
          <Share />
        </IconButton>
        {/* 右端に寄せる */}
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "right" }}>
          <Tooltip title={"help"} placement="top">
            <IconButton onClick={() => {}} sx={{ marginRight: 1 }}>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Console
        type={"memoria"}
        schema={schema}
        completion={memoriaCompletionSource}
        initialeValue={query}
        execute={queryExecutor}
        onChangeBack={setQuery}
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
