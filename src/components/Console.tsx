import CodeMirror, { keymap, Prec } from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import { sql, keywordCompletionSource, MySQL, schemaCompletionSource } from "@codemirror/lang-sql";
import { autocompletion, type CompletionSource } from "@codemirror/autocomplete";
import { makeQueryLinter } from "@/parser/query/linter";
import { ComleteCandidate, makeColumnCompletionSource } from "@/data/_common/autocomplete";
import { option } from "fp-ts";
import { iter } from "@/fp-ts-ext/function";
import { projector } from "@/functional/proj";

// サポートしているキーワードのホワイトリスト
const keywordWhitelist = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "LIKE",
  "ILIKE",
  "NOT",
  "ORDER",
  "BY",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "IN",
  "IS",
  "NULL",
  "BETWEEN",
  "EXISTS",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "ON",
  "GROUP",
  "HAVING",
  "DISTINCT",
  "AS",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "+",
  "-",
  "*",
  "/",
  "=",
  ">",
  "<",
  ">=",
  "<=",
]);

// デフォルトの SQL 補完ソースを取得
const defaultSqlSource = keywordCompletionSource(MySQL);

const supportedKeywordSource: CompletionSource = async (context) => {
  // 1. まずデフォルトの補完結果（キーワード、テーブル名などすべて）を取得
  const result = await defaultSqlSource(context);

  console.log(
    result?.options.filter((completion) => completion.type === "keyword").map(projector("label")),
  );

  if (!result) {
    return null;
  }

  // 2. 補完オプション (result.options) をフィルタリング
  const filteredOptions = result.options.filter((completion) => {
    // 補完のタイプが 'keyword' の場合のみチェック
    if (completion.type === "keyword") {
      // ホワイトリストに存在するか確認 (大文字に変換して比較)
      return keywordWhitelist.has(completion.label.toUpperCase());
    }

    // キーワード以外 (テーブル名、カラム名、'type: "enum"' など) は
    // フィルタリングせず、そのまま通す
    return true;
  });

  // 3. フィルター後の結果を返す
  return {
    ...result, // from, to などの情報はそのまま使う
    options: filteredOptions,
  };
};

export default function Console<
  Schema extends {
    [p: string]: string[];
  },
>({
  type,
  value,
  schema,
  completions,
  execute,
  onChange,
  completion,
}: {
  readonly type: keyof Schema;
  readonly value?: string;
  readonly schema: Schema;
  readonly completions?: readonly CompletionSource[];
  readonly execute: () => void;
  readonly onChange: (val: string, _: unknown) => void;
  readonly completion: Readonly<Record<string, ComleteCandidate>>;
}) {
  const customKeymap = Prec.highest(
    keymap.of([
      {
        // クエリの実行ショートカットキー
        key: "Ctrl-Enter",
        run() {
          execute();
          return true;
        },
      },
    ]),
  );
  const myCompletions = autocompletion({
    override: [
      makeColumnCompletionSource(schema[type], completion),
      schemaCompletionSource({ dialect: MySQL, schema }),
      supportedKeywordSource,
      ...iter(option.fromNullable(completions)).flat(),
    ],
  });
  return (
    <CodeMirror
      value={value}
      height="75px"
      theme={githubDark}
      extensions={[
        sql({ dialect: MySQL, schema }),
        myCompletions,
        makeQueryLinter(schema, completion),
        customKeymap,
      ]}
      onChange={onChange}
    />
  );
}
