import type {
  CompletionContext,
  CompletionSource,
} from "@codemirror/autocomplete";

const enumMap: Record<string, string[]> = {
  type: [
    "'通常単体'",
    "'通常範囲'",
    "'特殊単体'",
    "'特殊範囲'",
    "'支援'",
    "'妨害'",
    "'回復'",
  ],
  attribute: ["'火'", "'水'", "'風'", "'光'", "'闇'"],
};

/**
 * "column_name = " の直後でEnumの値を補完するカスタムソース
 */
export const memoriaCompletionSource: CompletionSource = (
  context: CompletionContext,
) => {
  // 1. カーソル直前までのテキストを取得 (検索効率のため直近100文字程度に)
  const textBefore = context.state.doc.sliceString(
    Math.max(0, context.pos - 100),
    context.pos,
  );
  // 2. "column = 'value..." のパターンにマッチさせる
  //    (\w+)        : (第1グループ) カラム名 (e.g., cardType)
  //    \s*=\s* : " = "
  //    ((?:'|")?\w*) : (第2グループ) ユーザーが入力中の値 (e.g., 'V or V)
  //    $            : カーソル位置 (テキストの終端)
  const valueMatch = textBefore.match(
    /(\w+)\s*((?:NOT\s+)?(?:LIKE|ILIKE)|=)\s*(['"]?\w*)$/i,
  );

  // パターンにマッチしなければ補完しない
  if (!valueMatch) {
    return null;
  }

  const columnName = valueMatch[1].toLowerCase();
  const operator = valueMatch[2].toUpperCase(); // "LIKE", "ILIKE", "=" のいずれか
  const value = valueMatch[3];
  const from = context.pos - value.length;

  if (operator === "=" && columnName in enumMap) {
    // 2. マップから値の配列を取得
    //    この時点で optionsList は string[] 型であることが保証される
    const optionsList = enumMap[columnName];

    return {
      from: from,
      // 3. string[] から補完オプションを生成
      options: optionsList.map((val) => ({
        label: val,
        type: "enum",
        boost: 10,
      })),
    };
  } else if (operator.endsWith("LIKE")) {
    if (columnName === "type") {
      return {
        from: from,
        // 3. string[] から補完オプションを生成
        options: ["'通常' ", "'特殊' ", "'前衛' ", "'後衛' "].map((val) => ({
          label: val,
          boost: 10,
        })),
        validFor: /(\w+)\s*((?:NOT\s+)?(?:LIKE|ILIKE))\s*(['"]?\w*)$/,
      };
    }
  }

  return null;
};

export const tableCompletionSource =
  (schema: string[]) => (context: CompletionContext) => {
    const match = context.matchBefore(/(^|\s|[,=(])`\w*$/);

    if (!match) {
      return null;
    }

    const backtickIndex = match.text.lastIndexOf("`");
    const partialWord = match.text.slice(backtickIndex + 1);

    return {
      from: match.from + backtickIndex + 1,
      options: schema

        .filter((name) => name.startsWith(partialWord)) // `` に対してはすべてのテーブル名を表示
        .map((name) => ({
          label: name,
          type: "variable",
          boost: 10,
        })),
      validFor: /^\w*$/, // ユーザーが単語を続けて入力している間は、この補完リストを使い続ける
    };
  };
