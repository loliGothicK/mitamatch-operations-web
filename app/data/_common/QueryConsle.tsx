"use client";

import { ComponentPropsWithoutRef, SetStateAction, useCallback, useState } from "react";
import { flow, pipe } from "fp-ts/function";
import { sqlToModel } from "@/parser/query/sql";
import { either } from "fp-ts";
import { Box } from "@mui/system";
import { Alert, IconButton, Modal, Snackbar, Tooltip } from "@mui/material";
import { Lens } from "monocle-ts";
import { ClearAll, Info, PlayArrowRounded, Share } from "@mui/icons-material";
import { GridColDef, GridSortModel } from "@mui/x-data-grid";
import Console from "@/components/Console";
import { isSome } from "fp-ts/Option";
import build, { SchemaResolver } from "@/parser/query/filter";
import { isRight } from "fp-ts/Either";
import { ComleteCandidate, makeSchemaCompletionSource } from "@/data/_common/autocomplete";
import { useAtom, WritableAtom } from "jotai";
import { useEffectOnce } from "react-use";

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

export function QueryConsle<
  Schema extends {
    [p: string]: string[];
  },
  T,
>({
  table,
  origin,
  resolver,
  schema,
  queryAtom,
  updateVisivilityAction,
  updateDataAction,
  help,
  completion,
}: {
  table: keyof Schema;
  origin: T[];
  resolver: SchemaResolver<T>;
  schema: Schema;
  queryAtom: WritableAtom<string, [SetStateAction<string>], void>;
  updateVisivilityAction: (whiteList: Set<GridColDef["field"]>) => void;
  updateDataAction: (
    action: { type: "update"; data: T[] } | { type: "sort"; model: GridSortModel },
  ) => void;
  help: ComponentPropsWithoutRef<typeof Modal>["children"];
  completion?: Record<string, ComleteCandidate>;
}) {
  const [query, setQuery] = useAtom(queryAtom);
  const [state, setState] = useState<ToastState>({
    open: false,
    vertical: "top" as const,
    horizontal: "center" as const,
    message: "Query Error",
    severity: "error",
  });
  const [value, setValue] = useState(query);
  const onChange = useCallback(
    (val: string, _: unknown) => {
      setValue(val);
      setQuery(val);
    },
    [setValue, setQuery],
  );

  const { vertical, horizontal, open, message, severity } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

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
          updateVisivilityAction(whiteList);
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
    [origin, completion, query, resolver, updateVisivilityAction, updateDataAction],
  );

  const clearQuery = useCallback(() => {
    const atomicQuery = `select * from ${String(table)};`;
    setQuery(atomicQuery);
    setValue(atomicQuery);
    updateDataAction({
      type: "update",
      data: origin,
    });
  }, [origin, table, setQuery, setValue, updateDataAction]);

  const [modalOpen, setModalOpen] = useState(false);
  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => setModalOpen(false);

  useEffectOnce(() => {
    runQuery(true);
  });

  return (
    <>
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
        value={value}
        schema={schema}
        completions={completion ? [makeSchemaCompletionSource(completion)] : []}
        initialeValue={query}
        execute={runQuery}
        onChange={onChange}
      />
    </>
  );
}
