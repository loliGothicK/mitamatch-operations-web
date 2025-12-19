import type { CompletionContext, CompletionSource } from "@codemirror/autocomplete";
import { Clazz } from "@/parser/query/filter";
import { match, P } from "ts-pattern";

export type JsonData = {
  [key: string]: readonly string[] | Readonly<JsonData>;
};

export type ComleteCandidate = {
  equals?: string[];
  json?: Readonly<JsonData> | readonly string[];
  like?:
    | {
        pattern: string[];
        item: "string";
        operator: (item: string, pattern: string) => boolean;
      }
    | {
        pattern: string[];
        item: "clazz";
        operator: (item: Clazz, pattern: string) => boolean;
      };
};

export const makeSchemaCompletionSource =
  (map: Record<string, ComleteCandidate>): CompletionSource =>
  (context: CompletionContext) => {
    // 検索範囲を少し広めに確保
    const textBefore = context.state.doc.sliceString(Math.max(0, context.pos - 200), context.pos);

    const complexMatch = textBefore.match(
      /([`\w]+)\s*((?:NOT\s+)?(?:LIKE|ILIKE))\s*(['"]?)([^'"]*)$/i,
    );
    const simpleMatch = textBefore.match(/([`\w]+)\s*(=)\s*(['"]?\w*)$/);

    // --- LIKE / ILIKE の処理 ---
    if (complexMatch) {
      const columnName = complexMatch[1].replace(/`(.+?)`$/, "$1");
      const operator = complexMatch[2].toUpperCase();
      const quoteChar = complexMatch[3]; // undefined or ' or "
      const contentInside = complexMatch[4];

      if (operator.endsWith("LIKE") && columnName in map && map[columnName].like !== undefined) {
        const lastCommaIndex = contentInside.lastIndexOf(",");

        // 補完対象の抽出（カンマ区切り対応）
        // カンマがない場合は全体、ある場合は最後のカンマ以降
        const partialWord =
          lastCommaIndex !== -1
            ? contentInside.slice(lastCommaIndex + 1).trimStart() // スペースを除去して比較用にする
            : contentInside;

        const from = context.pos - partialWord.length;

        // 既に入力済みの値を除外
        const existingValues = new Set(contentInside.split(",").map((s) => s.trim()));

        // 挿入テキストの決定ロジック
        const getApplyText = (val: string) => {
          // 1. まだクォートが開いていない場合 -> クォート付きで開始
          if (!quoteChar) {
            return `'${val}'`;
          }
          // 2. 既にクォート内、かつ直前がカンマ（スペースなし） -> スペースを入れて追加
          // contentInsideの末尾が "," で終わっているか判定
          if (contentInside.trim().endsWith(",")) {
            return ` ${val}`;
          }
          // 3. それ以外（通常入力や、既にスペースがある場合）
          return val;
        };

        return {
          from: from,
          options: map[columnName].like.pattern
            .filter((val) => !existingValues.has(val))
            .map((val) => ({
              label: val,
              apply: getApplyText(val), // 状況に応じて補完文字列を動的に変更
              boost: 10,
            })),
          // クォート内、またはクォート開始前(LIKE直後)でも有効とする
          validFor: /^(?:['"]|[^'"]*)$/,
        };
      }
    }

    if (simpleMatch) {
      const columnName = simpleMatch[1].toLowerCase().replace(/`(.+?)`$/, "$1");
      const value = simpleMatch[3];
      const from = context.pos - value.length;

      if (columnName in map && map[columnName].equals !== undefined) {
        return {
          from: from,
          to: context.pos,
          options: map[columnName].equals.map((val) => ({
            label: `'${val}'`,
            type: "enum",
            boost: 10,
          })),
          validFor: /^\w*$/,
        };
      }
    }

    return null;
  };

function splitArray<T>(arr: T[]) {
  // 1. 先頭(first)と残り(middleの候補)に分ける
  const [first, ...middle] = arr;

  // 2. 残りから末尾(last)を取り出す
  // middleが空なら pop() は undefined を返すため、長さ1のケースも自然に解決する
  const last = middle.pop();

  return { first, middle, last };
}

const resolvePathToNode = (
  map: Readonly<JsonData> | readonly string[] | undefined,
  path: string[],
): readonly string[] | null => {
  if (map === undefined) {
    return null;
  } else {
    return match(path)
      .with([], () =>
        match(map)
          .with(P.array(P.string), (arr) => arr)
          .with(P.record(P.string, P.any), (obj) => Object.keys(obj))
          .exhaustive(),
      )
      .with([P.string, ...P.array(P.string)], ([first, ...rest]) =>
        match(map)
          .with(P.array(P.string), () => null)
          .with(P.record(P.string, P.any), (obj) => resolvePathToNode(obj[first], rest))
          .exhaustive(),
      )
      .exhaustive();
  }
};

export const makeColumnCompletionSource =
  (schema: string[], map: Record<string, ComleteCandidate>) => (context: CompletionContext) => {
    // 1. まず CodeMirror の機能でカーソル直前がパターンに合致するか確認
    const regex = /(^|\s|[,=(])(`?)([\w.]*)$/;
    const match = context.matchBefore(regex);

    if (!match) {
      return null;
    }

    // 2. マッチしたテキストに対して再度正規表現を適用し、キャプチャグループを取得する
    // match.text は例えば " `someCol" のような文字列
    const captures = match.text.match(regex);
    if (!captures) {
      return null; // 理論上ここには来ないが型安全のため
    }

    // captures[1]: 区切り文字 (space, comma, etc)
    // captures[2]: バッククォート (`?)
    // captures[3]: カラム名部分 (\w*)
    const hasBacktick = captures[2] === "`";
    const partialWord = captures[3];

    if (!partialWord && !hasBacktick) {
      return null;
    }

    if (partialWord.includes(".")) {
      const { first, middle, last } = splitArray(partialWord.split("."));
      return {
        from: context.pos - (last ? last.length : 0),
        options:
          resolvePathToNode(map[first].json, middle)?.map((name) => ({
            label: name,
            type: "variable",
            apply: name,
            boost: 10,
          })) ?? [],
        validFor: /^`?\w*$/,
      };
    }

    return {
      from: context.pos - partialWord.length,
      options: schema
        .filter((name) => name.startsWith(partialWord))
        .map((name) => ({
          label: name,
          type: "variable",
          // バッククォートがない場合は補完時に自動付与する
          apply: hasBacktick ? name : `\`${name}\``,
          boost: 10,
        })),
      validFor: /^`?\w*$/,
    };
  };
