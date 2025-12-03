import {
  GridColDef,
  GridValidRowModel,
  DataGrid as MuiDataGrid,
  GridColumnVisibilityModel,
  GridSortModel,
} from "@mui/x-data-grid";
import {
  ComponentPropsWithoutRef,
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { GridApiCommunity } from "@mui/x-data-grid/internals";
import { Box } from "@mui/system";
import { Alert, IconButton, Modal, Paper, Snackbar, Tooltip } from "@mui/material";
import { ClearAll, Info, PlayArrowRounded, Share } from "@mui/icons-material";
import Console from "@/components/Console";
import { ComleteCandidate, makeSchemaCompletionSource } from "@/data/_common/autocomplete";
import { flow, pipe } from "fp-ts/function";
import build, { SchemaResolver } from "@/parser/query/filter";
import { Lens } from "monocle-ts";
import { sqlToModel } from "@/parser/query/sql";
import { either } from "fp-ts";
import { isRight } from "fp-ts/lib/Either";
import { isSome } from "fp-ts/Option";
import queryAtom from "@/jotai/queryAtoms";
import { useAtom } from "jotai";
import { useEffectOnce } from "react-use";

type SingleStringArrayField<T> = {
  [K in keyof T]: Record<K, string[]>;
}[keyof T];

type hasAtom = SingleStringArrayField<typeof queryAtom>;

type Props<
  T extends GridValidRowModel,
  Schema extends hasAtom,
  Table extends keyof Schema & keyof typeof queryAtom = keyof Schema & keyof typeof queryAtom,
> = {
  apiRef: RefObject<GridApiCommunity | null>;
  data: readonly T[];
  columns: readonly GridColDef<T>[];
  visibility: [GridColumnVisibilityModel, Dispatch<SetStateAction<GridColumnVisibilityModel>>];
  table: Table;
  origin: T[];
  resolver: SchemaResolver<T>;
  schema: Schema;
  initialQuery?: string;
  updateVisibilityAction: (whiteList: Set<GridColDef["field"]>) => void;
  updateDataAction: (
    action: { type: "update"; data: T[] } | { type: "sort"; model: GridSortModel },
  ) => void;
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

export function DataGrid<T extends GridValidRowModel, Schema extends hasAtom>({
  apiRef,
  data,
  columns,
  visibility: [visibility, setVisivility],
  table,
  origin,
  resolver,
  schema,
  initialQuery,
  updateVisibilityAction,
  updateDataAction,
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

  const { vertical, horizontal, open, message, severity } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

  const handleVisibilityChange = useCallback(
    (newModel: GridColumnVisibilityModel) => {
      setTimeout(() => {
        setVisivility(newModel);
      }, 0);
    },
    [setVisivility],
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
    (first = false) => {
      return pipe(
        sqlToModel(query),
        either.map(([whiteList, result]) => {
          updateVisibilityAction(whiteList);
          const pred = build(result, resolver, completion);
          if (isRight(pred)) {
            const { where, orderBy, limit } = pred.right;
            if (isSome(where)) {
              updateDataAction({
                type: "update",
                data: limit(origin.filter(where.value.apply.bind(where.value))),
              });
            }
            if (isSome(orderBy)) {
              updateDataAction({
                type: "sort",
                model: orderBy.value,
              });
            }
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
    [origin, completion, query, resolver, updateVisibilityAction, updateDataAction],
  );

  const clearQuery = useCallback(() => {
    const atomicQuery = `select * from ${String(table)};`;
    setQuery(atomicQuery);
    updateDataAction({
      type: "update",
      data: origin,
    });
  }, [origin, table, setQuery, updateDataAction]);

  const [modalOpen, setModalOpen] = useState(false);
  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => setModalOpen(false);

  useEffectOnce(() => {
    if (initialQuery) {
      runQuery(true);
    }
  });

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
        <IconButton onClick={() => runQuery()} sx={{ marginRight: 1 }}>
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
        execute={runQuery}
        onChange={onChange}
      />
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <MuiDataGrid
          key={table}
          apiRef={apiRef}
          rows={data}
          rowHeight={80}
          columns={columns}
          columnVisibilityModel={visibility}
          onColumnVisibilityModelChange={handleVisibilityChange}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10, 50, 100]}
          sx={{ border: 0 }}
        />
      </div>
    </Paper>
  );
}
