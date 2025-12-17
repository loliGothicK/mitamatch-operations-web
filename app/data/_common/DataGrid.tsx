import {
  GridColDef,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
  GridColumnVisibilityModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { ComponentPropsWithoutRef, useCallback, useEffect, useState } from "react";
import { Box } from "@mui/system";
import { Alert, IconButton, Modal, NoSsr, Paper, Snackbar, Tooltip } from "@mui/material";
import {
  ClearAll,
  Info,
  PlayArrowRounded,
  Share,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import Console from "@/components/Console";
import { ComleteCandidate, makeSchemaCompletionSource } from "@/data/_common/autocomplete";
import { flow, identity, pipe } from "fp-ts/function";
import build, { SchemaResolver } from "@/parser/query/filter";
import { Lens } from "monocle-ts";
import { sqlToModel } from "@/parser/query/sql";
import { either, option } from "fp-ts";
import { isRight } from "fp-ts/lib/Either";
import { isSome } from "fp-ts/Option";
import queryAtom from "@/jotai/queryAtoms";
import { useAtom } from "jotai";
import { useEffectOnce } from "react-use";

type Spread<T, V> = {
  [K in keyof T]: Record<K, V>;
}[keyof T];

type hasAtom = Spread<typeof queryAtom, string[]>;

type Props<
  T extends GridValidRowModel,
  Schema extends hasAtom,
  Table extends keyof Schema & keyof typeof queryAtom = keyof Schema & keyof typeof queryAtom,
> = {
  columns: readonly GridColDef<T>[];
  visibilityAll: GridColumnVisibilityModel;
  table: Table;
  origin: T[];
  resolver: SchemaResolver<T>;
  schema: Schema;
  initialQuery?: string;
  help: ComponentPropsWithoutRef<typeof Modal>["children"];
  completion?: Record<string, ComleteCandidate>;
};

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

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export function DataGrid<
  T extends GridValidRowModel & { readonly phantasm?: boolean },
  Schema extends hasAtom,
>({
  columns,
  visibilityAll,
  table,
  origin,
  resolver,
  schema,
  initialQuery,
  help,
  completion,
}: Props<T, Schema>) {
  const [query, setQuery] = useAtom(queryAtom[table]);
  const [state, setState] = useState<ToastState>({
    open: false,
    vertical: "top" as const,
    horizontal: "center" as const,
    message: "Query Error",
    severity: "error",
  });
  const onChange = useCallback(
    (val: string, _: unknown) => {
      setQuery(val);
    },
    [setQuery],
  );

  const [visible, setVisible] = useState(false);

  const phantasmFilter = useCallback(
    (rows: T[]) => {
      return visible ? rows : rows.filter((row) => row.phantasm !== true);
    },
    [visible],
  );

  const { vertical, horizontal, open, message, severity } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

  const [rows, setRows] = useState(phantasmFilter(origin));
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [visibility, setVisibility] = useState(visibilityAll);

  const handleVisibilityChange = useCallback(
    (newModel: GridColumnVisibilityModel) => {
      requestAnimationFrame(() => {
        setVisibility(newModel);
      });
    },
    [setVisibility],
  );

  const shared = useCallback(async () => {
    await navigator.clipboard.writeText(
      `https://operations.mitama.io/data/memoria?query=${encodeURIComponent(query.trim())}`,
    );
    setState(
      flow(
        openLens.set(true),
        messageLens.set("Successfuly copeid URL to clipboard."),
        severityLens.set("success"),
      ),
    );
  }, [query]);

  const runQuery = useCallback(
    ({ toast }: { toast: boolean } = { toast: false }) => {
      return pipe(
        sqlToModel(query),
        either.map(({ visibility, ...result }) => {
          setVisibility(
            visibility.has("*")
              ? visibilityAll
              : Object.keys(visibilityAll).reduce((model, col) => {
                  model[col] = visibility.has(col);
                  return model;
                }, visibilityAll),
          );
          const pred = build(result, resolver, completion);
          if (isRight(pred)) {
            const { where, orderBy, limit } = pred.right;
            const filterFn = pipe(
              where,
              option.map((w) => (data: T[]) => data.filter(w.apply.bind(w))),
              option.getOrElse(() => identity<T[]>),
            );
            setRows(pipe(origin, filterFn, limit, phantasmFilter));
            if (isSome(orderBy)) {
              setSortModel(orderBy.value);
            }

            if (toast) {
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
                messageLens.set(`Query Build Error: ${pred.left.map((e) => e.msg).join("\n")}`),
                severityLens.set("error"),
              ),
            );
          }
          return true;
        }),
        either.getOrElse((err) => {
          setState(
            flow(
              openLens.set(true),
              messageLens.set(`SQL Parse Error: ${err.map((e) => e.msg).join("\n")}`),
              severityLens.set("error"),
            ),
          );
          return true;
        }),
      );
    },
    [completion, query, resolver, origin, phantasmFilter, visibilityAll],
  );

  const handleToggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, [setVisible]);

  const clearQuery = useCallback(() => {
    const atomicQuery = `select * from ${String(table)};`;
    setQuery(atomicQuery);
    setRows(phantasmFilter(origin));
  }, [origin, table, setQuery, setRows, phantasmFilter]);

  const [modalOpen, setModalOpen] = useState(false);
  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => setModalOpen(false);

  useEffectOnce(() => {
    runQuery();
  });

  useEffect(() => {
    runQuery({ toast: false });
  }, [visible]); // oxlint-disable-line exhaustive-deps

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
        <Modal
          open={modalOpen}
          onClose={handleModalClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>{help}</Box>
        </Modal>
        <IconButton onClick={() => runQuery({ toast: true })} sx={{ marginRight: 1 }}>
          <Tooltip title={"Ctrl + Enter"} placement="top">
            <PlayArrowRounded />
          </Tooltip>
        </IconButton>
        <IconButton onClick={() => clearQuery()} sx={{ marginRight: 1 }}>
          <Tooltip title={"Clear All"} placement="top">
            <ClearAll />
          </Tooltip>
        </IconButton>
        <IconButton onClick={shared}>
          <Share />
        </IconButton>
        <IconButton onClick={handleToggle} aria-label="toggle visibility">
          {visible ? <Visibility /> : <VisibilityOff />}
        </IconButton>
        {/* 右端に寄せる */}
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "right" }}>
          <Tooltip title={"help"} placement="top">
            <IconButton onClick={handleModalOpen} sx={{ marginRight: 1 }}>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Console
        type={table}
        value={initialQuery || query}
        schema={schema}
        completions={completion ? [makeSchemaCompletionSource(completion)] : []}
        execute={() => runQuery({ toast: true })}
        onChange={onChange}
      />
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <NoSsr>
          <MuiDataGrid
            key={table}
            rows={rows}
            rowHeight={80}
            columns={columns}
            columnVisibilityModel={visibility}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            onColumnVisibilityModelChange={handleVisibilityChange}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10, 50, 100]}
            sx={{ border: 0 }}
          />
        </NoSsr>
      </div>
    </Paper>
  );
}
