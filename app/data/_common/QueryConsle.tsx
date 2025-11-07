"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { flow, pipe } from "fp-ts/function";
import { sqlToModel } from "@/parser/query/sql";
import { either } from "fp-ts";
import { Box } from "@mui/system";
import { Alert, IconButton, Snackbar, Tooltip } from "@mui/material";
import { Lens } from "monocle-ts";
import { Info, PlayArrowRounded, Share } from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import Console from "@/components/Console";
import { isSome } from "fp-ts/Option";
import build, { SchemaResolver } from "@/parser/query/filter";
import { isRight } from "fp-ts/Either";
import { CompletionSource } from "@codemirror/autocomplete";

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

export function QueryConsle<
  Schema extends {
    [p: string]: string[];
  },
  T,
>({
  origin,
  initial,
  resolver,
  schema,
  updateVisivilityAction,
  updateDataAction,
  completions,
}: {
  origin: T[];
  resolver: SchemaResolver<T>;
  schema: Schema;
  updateVisivilityAction: (whiteList: Set<GridColDef["field"]>) => void;
  updateDataAction: Dispatch<SetStateAction<T[]>>;
  initial?: string;
  completions?: CompletionSource[];
}) {
  const [query, setQuery] = useState(
    initial ? decodeURI(initial) : "select * from memoria where `cost` > 18;",
  );

  const [state, setState] = useState<ToastState>({
    open: false,
    vertical: "top" as const,
    horizontal: "center" as const,
    message: "Query Error",
    severity: "error",
  });

  const { vertical, horizontal, open, message, severity } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

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
        either.map(([whiteList, result]) => {
          updateVisivilityAction(whiteList);
          const pred = build(result, resolver);
          if (isRight(pred)) {
            const { where, orderBy } = pred.right;
            if (isSome(where)) {
              updateDataAction(() =>
                origin.filter(where.value.apply.bind(where.value)),
              );
            }
            if (isSome(orderBy)) {
              updateDataAction((data) =>
                data.sort(orderBy.value.compare.bind(orderBy.value)),
              );
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
                messageLens.set(
                  `Query Build Error: ${pred.left.map((e) => e.msg).join("\n")}`,
                ),
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
    [query, resolver, updateVisivilityAction, updateDataAction],
  );

  useEffect(() => {
    if (initial !== undefined) queryExecutor(true);
  }, [initial]); // oxlint-disable-line exhaustive-deps

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
        completions={completions}
        initialeValue={query}
        execute={queryExecutor}
        onChangeBack={setQuery}
      />
    </>
  );
}
