import { describe, expect, it } from "vitest";
import type { Completion } from "@codemirror/autocomplete";
import { filterSupportedKeywordCompletions } from "./Console";

describe("filterSupportedKeywordCompletions", () => {
  it("uppercases supported SQL keywords", () => {
    const options: Completion[] = [
      { label: "select", type: "keyword" },
      { label: "where", type: "keyword", apply: "where" },
      { label: "order", type: "keyword" },
    ];

    const result = filterSupportedKeywordCompletions(options);

    expect(result).toEqual([
      { label: "SELECT", type: "keyword", apply: "SELECT" },
      { label: "WHERE", type: "keyword", apply: "WHERE" },
      { label: "ORDER", type: "keyword", apply: "ORDER" },
    ]);
  });

  it("filters out unsupported SQL keywords", () => {
    const options: Completion[] = [
      { label: "select", type: "keyword" },
      { label: "delete", type: "keyword" },
      { label: "update", type: "keyword" },
    ];

    const result = filterSupportedKeywordCompletions(options);

    expect(result).toEqual([{ label: "SELECT", type: "keyword", apply: "SELECT" }]);
  });

  it("preserves non-keyword completions", () => {
    const tableCompletion: Completion = { label: "memoria", type: "type", apply: "memoria" };
    const columnCompletion: Completion = {
      label: "`name`",
      type: "variable",
      apply: "`name`",
    };

    const result = filterSupportedKeywordCompletions([
      { label: "from", type: "keyword" },
      tableCompletion,
      columnCompletion,
    ]);

    expect(result).toEqual([
      { label: "FROM", type: "keyword", apply: "FROM" },
      tableCompletion,
      columnCompletion,
    ]);
  });
});
