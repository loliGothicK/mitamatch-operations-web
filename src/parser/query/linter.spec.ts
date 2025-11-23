import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import {
  analyzeQueryStructure,
  checkCommandPermissions,
  validateSchema,
  DbSchema,
} from "./linter";
import { syntaxTree } from "@codemirror/language";

// for debug
function printTree(state: EditorState) {
  const tree = syntaxTree(state);
  let output = "";
  tree.iterate({
    enter: (node) => {
      const text = state.sliceDoc(node.from, node.to);
      // ノード名、位置、テキストの一部（改行は除去）を表示
      const cleanText = text.length > 20 ? text.slice(0, 20) + "..." : text;
      // もしくは node.from で深さを判定
      output += `${node.name} [${node.from}-${node.to}]: "${cleanText.replace(/\n/g, "\\n")}"\n`;
    },
  });
  console.log(output);
}

// テストデータ
const TEST_SCHEMA: DbSchema = {
  USERS: ["ID", "NAME"],
  ORDERS: ["ID", "USER_ID", "AMOUNT"],
};
const ALLOWED = new Set(["select", "with"]);

// State生成ヘルパー
const mkState = (doc: string) =>
  EditorState.create({ doc, extensions: [sql()] });

describe("SQL Linter Logic", () => {
  describe("analyzeQueryStructure (Context Building)", () => {
    it("extracts CTEs correctly", () => {
      const state = mkState(
        "WITH cte1 AS (SELECT 1), cte2 AS (SELECT 2) SELECT * FROM cte1",
      );
      const ctx = analyzeQueryStructure(state);

      expect(ctx.definedCTEs.has("cte1")).toBe(true);
      expect(ctx.definedCTEs.has("cte2")).toBe(true);
    });

    it("extracts Aliases correctly", () => {
      const state = mkState(
        "SELECT * FROM USERS u JOIN ORDERS o ON u.id = o.id",
      );
      const ctx = analyzeQueryStructure(state);

      expect(ctx.aliasMap.get("u")).toBe("users");
      expect(ctx.aliasMap.get("o")).toBe("orders");
    });
  });

  describe("checkCommandPermissions", () => {
    it("allows SELECT", () => {
      const state = mkState("SELECT * FROM USERS");
      const errs = checkCommandPermissions(state, ALLOWED);
      expect(errs).toHaveLength(0);
    });

    it("blocks DELETE", () => {
      const state = mkState("DELETE FROM USERS");
      const errs = checkCommandPermissions(state, ALLOWED);
      expect(errs).toHaveLength(1);
      expect(errs[0].message).toContain("許可されていない");
    });
  });

  describe("validateSchema", () => {
    it("detects unknown tables", () => {
      const doc = "SELECT * FROM GHOST_TABLE";
      const state = mkState(doc);
      const ctx = analyzeQueryStructure(state); // コンテキストを作成して
      const errs = validateSchema(state, ctx, TEST_SCHEMA); // 検証に渡す

      expect(errs).toHaveLength(1);
      expect(errs[0].message).toContain("存在しません");
    });

    it("validates columns with alias", () => {
      const doc = "SELECT u.INVALID_COL FROM USERS u";
      const state = mkState(doc);
      const ctx = analyzeQueryStructure(state);
      const errs = validateSchema(state, ctx, TEST_SCHEMA);

      printTree(state);

      expect(errs).toHaveLength(1);
      expect(errs[0].message).toContain("invalid_col");
    });

    it("respects CTEs (does not validate columns inside CTE result)", () => {
      const doc = `
        WITH my_cte AS (SELECT ID FROM USERS)
        SELECT c.whatever FROM my_cte c
      `;
      const state = mkState(doc);
      const ctx = analyzeQueryStructure(state);
      const errs = validateSchema(state, ctx, TEST_SCHEMA);

      expect(errs).toHaveLength(0); // CTE由来のカラムはチェックしないのでOK
    });
  });
});
