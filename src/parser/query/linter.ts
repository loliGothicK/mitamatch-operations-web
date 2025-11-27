import { Diagnostic, linter } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";

const ALLOWED_CMDS = new Set(["select", "with", "values", "explain"]);

export const makeQueryLinter = (schema: DbSchema) =>
  linter((view) => {
    const state = view.state;

    // 1. 構造解析 (Analysis)
    const context = analyzeQueryStructure(state);

    // 2. 構文チェック (Permissions)
    const permissionErrors = checkCommandPermissions(state, ALLOWED_CMDS);

    // 3. スキーマチェック (Validation)
    const schemaErrors = validateSchema(state, context, schema);

    // エラーを統合して返す
    return [...permissionErrors, ...schemaErrors];
  });

// --- 型定義 ---

export interface DbSchema {
  [tableName: string]: string[]; // TableName -> ColumnList
}

export interface QueryContext {
  definedCTEs: Set<string>; // WITH句で定義された名前
  aliasMap: Map<string, string>; // "u" -> "USERS"
  activeTables: Set<string>; // 実際に使われている実テーブル名
}

// --- 1. 構造解析 (Analysis Phase) ---

/**
 * SQLの構造を解析し、CTEやエイリアスのマップを生成する
 * エラーチェックは行わない
 */
export function analyzeQueryStructure(state: EditorState): QueryContext {
  const ctx: QueryContext = {
    definedCTEs: new Set(),
    aliasMap: new Map(),
    activeTables: new Set(),
  };

  syntaxTree(state).iterate({
    enter: (node) => {
      // フラット構造対応
      if (node.name === "Statement") {
        const cursor = node.node.cursor();
        if (!cursor.firstChild()) return;

        // --- ステート管理 ---
        let inWithClause = false;
        let parenDepth = 0; // ★重要: カッコの深さを追跡

        do {
          const type = cursor.name;
          const text = normalize(state, cursor.node); // 小文字化済み

          // 0. カッコの深さの更新
          // Punctuation "(" または ノード名にParenが含まれる場合
          if (text === "(" || type.includes("OpenParen") || type.includes("ParenL")) {
            parenDepth++;
          } else if (text === ")" || type.includes("CloseParen") || type.includes("ParenR")) {
            parenDepth--;
          }

          // 1. 文脈の切り替え
          if (type === "Keyword") {
            if (text === "with") {
              inWithClause = true;
            }
            // ★重要: カッコの外 (depth 0) でのみ、WITH句を終了させる
            else if (["select", "insert", "update", "delete", "values"].includes(text)) {
              if (parenDepth === 0) {
                inWithClause = false;
              }
            }
          }

          // 2. CTE 定義の検出
          // inWithClause が true の間だけ探す
          if (inWithClause && (type === "Identifier" || type === "QuotedIdentifier")) {
            const next = cursor.node.nextSibling;

            // "AS" チェック
            if (next && normalize(state, next) === "as") {
              const nextNext = next.nextSibling;

              // "(" チェック
              if (nextNext) {
                const nnText = normalize(state, nextNext);
                if (nnText === "(" || nextNext.name.includes("Paren")) {
                  // ここでCTE名として確定
                  ctx.definedCTEs.add(text);
                  ctx.aliasMap.set(text, text);
                }
              }
            }
          }

          // 3. テーブル参照の検出
          if (type === "Identifier" || type === "QuotedIdentifier") {
            const prev = cursor.node.prevSibling;
            if (prev) {
              const prevText = normalize(state, prev);

              if (["from", "join", "update", "into"].includes(prevText)) {
                if (!ctx.definedCTEs.has(text)) {
                  ctx.activeTables.add(text);
                }
                ctx.aliasMap.set(text, text);

                // エイリアス検出
                const next = cursor.node.nextSibling;
                if (next) {
                  const nextText = normalize(state, next);

                  // AS省略エイリアス
                  if (next.name === "Identifier" || next.name === "QuotedIdentifier") {
                    ctx.aliasMap.set(nextText, text);
                  }
                  // ASありエイリアス
                  else if (nextText === "as") {
                    const nextNext = next.nextSibling;
                    if (
                      nextNext &&
                      (nextNext.name === "Identifier" || nextNext.name === "QuotedIdentifier")
                    ) {
                      ctx.aliasMap.set(normalize(state, nextNext), text);
                    }
                  }
                }
              }
            }
          }
        } while (cursor.nextSibling());
      }
    },
  });

  return ctx;
}

// --- 2. 権限チェック (Permission Phase) ---

export function checkCommandPermissions(
  state: EditorState,
  allowedCommands: Set<string>,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === "Statement") {
        const text = state.sliceDoc(node.from, node.to);
        // コメント除去して最初の単語
        const match = text.match(/^\s*(?:--.*|\/\*[\s\S]*?\*\/|\s+)*([a-zA-Z]+)/);

        if (match) {
          const command = match[1].toLowerCase();
          if (!allowedCommands.has(command)) {
            diagnostics.push({
              from: node.from,
              to: node.from + match[0].length,
              severity: "error",
              message: `許可されていないコマンドです: ${command}`,
            });
          }
        }
      }
    },
  });

  return diagnostics;
}

// --- 3. スキーマ検証 (Validation Phase) ---

export function validateSchema(
  state: EditorState,
  ctx: QueryContext,
  schema: DbSchema,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const normalizedSchema = normalizeSchema(schema);
  const knownRealTables = new Set(Object.keys(normalizedSchema));

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === "Statement") {
        const cursor = node.node.cursor();
        if (!cursor.firstChild()) return;

        let expectingTable = false;

        do {
          const type = cursor.name;
          const rawText = raw(state, cursor.node);
          const nomalizedText = normalize(state, cursor.node);

          // 1. 文脈切り替え (from/join等)
          if (type === "Keyword") {
            if (["from", "join", "update", "into"].includes(nomalizedText)) {
              expectingTable = true;
            } else if (
              ["select", "set", "where", "group", "order", "having", "limit", "on"].includes(
                nomalizedText,
              )
            ) {
              expectingTable = false;
            }
            continue;
          }

          // 2. 識別子の検証 (Identifier / QuotedIdentifier)
          if (type === "Identifier" || type === "QuotedIdentifier") {
            // A. テーブル文脈
            if (expectingTable) {
              const tableName = rawText;
              const isCTE = ctx.definedCTEs.has(tableName);
              const isReal = knownRealTables.has(tableName);

              if (!isCTE && !isReal) {
                diagnostics.push({
                  from: cursor.from,
                  to: cursor.to,
                  severity: "error",
                  message: `テーブル '${tableName}' は存在しません。`,
                });
              }

              // 次のトークンがIdentifierならエイリアスとしてスキップ
              const next = cursor.node.nextSibling;
              if (next && (next.name === "Identifier" || next.name === "QuotedIdentifier")) {
                cursor.nextSibling();
              }
            }
            // B. 単独カラム文脈 (CompositeIdentifierではない単発のIdentifier)
            else {
              // "AS" の直後でなければチェック
              const prev = cursor.node.prevSibling;
              if (!prev || normalize(state, prev) !== "as") {
                validateStandaloneColumn(cursor.node, state, ctx, normalizedSchema, diagnostics);
              }
            }
          }

          // 3. 複合識別子 (CompositeIdentifier) の検証  <-- 追加！！
          // 構造: Identifier(Alias) -> "." -> Identifier(Col)
          if (type === "CompositeIdentifier") {
            // 中身を解析するために、現在のノードからサブカーソルを作成
            const innerCursor = cursor.node.cursor();

            // 子要素へ移動 (最初のIdentifierへ)
            if (innerCursor.firstChild()) {
              let part1: string | null = null;
              let part2: string | null = null;

              // 構造をなめる: [Identifier] [.] [Identifier]
              do {
                const iType = innerCursor.name;
                if (iType === "Identifier" || iType === "QuotedIdentifier") {
                  const val = normalize(state, innerCursor.node);
                  if (!part1) part1 = val;
                  else part2 = val;
                }
              } while (innerCursor.nextSibling());

              // part1 がエイリアス、part2 がカラム名とみなす
              if (part1 && part2) {
                const alias = part1;
                const colName = part2;
                const realTableName = ctx.aliasMap.get(alias);

                if (realTableName) {
                  // CTEでなければ検証
                  if (!ctx.definedCTEs.has(realTableName)) {
                    const cols = normalizedSchema[realTableName];
                    if (cols && !cols.includes(colName) && colName !== "*") {
                      diagnostics.push({
                        from: cursor.from, // エラー位置はCompositeIdentifier全体、あるいは微調整可
                        to: cursor.to,
                        severity: "error",
                        message: `カラム '${colName}' はテーブル '${realTableName}' (${alias}) に存在しません。`,
                      });
                    }
                  }
                } else {
                  diagnostics.push({
                    from: innerCursor.from,
                    to: innerCursor.to,
                    severity: "error",
                    message: `エイリアス '${alias}' の定義が見つかりません。`,
                  });
                }
              }
            }
          }
        } while (cursor.nextSibling());
      }
    },
  });

  return diagnostics;
}

// ヘルパー (変更なし)
function validateStandaloneColumn(
  node: SyntaxNode,
  state: EditorState,
  ctx: QueryContext,
  schema: DbSchema,
  diagnostics: Diagnostic[],
) {
  const colName = normalize(state, node);
  const hasCTE = Array.from(ctx.activeTables).some((t) => ctx.definedCTEs.has(t));
  if (hasCTE) return;

  let found = false;
  for (const t of ctx.activeTables) {
    if (schema[t]?.includes(colName)) {
      found = true;
      break;
    }
  }

  if (!found && ctx.activeTables.size > 0 && colName.length > 2) {
    diagnostics.push({
      from: node.from,
      to: node.from + colName.length,
      severity: "error",
      message: `unknown column name: ${colName}`,
    });
  }
}

function normalize(state: EditorState, node: SyntaxNode | { from: number; to: number }): string {
  return state
    .sliceDoc(node.from, node.to)
    .replace(/["`[\]]/g, "")
    .toLowerCase();
}

function raw(state: EditorState, node: SyntaxNode | { from: number; to: number }): string {
  return state.sliceDoc(node.from, node.to).replace(/["`[\]]/g, "");
}

export function normalizeSchema(schema: DbSchema): DbSchema {
  const normalized: DbSchema = {};
  for (const [table, cols] of Object.entries(schema)) {
    // キー（テーブル名）を小文字化
    const lowerTable = table.toLowerCase();
    // 値（カラムリスト）もすべて小文字化
    normalized[lowerTable] = cols.map((c) => c.toLowerCase());
  }
  return normalized;
}
