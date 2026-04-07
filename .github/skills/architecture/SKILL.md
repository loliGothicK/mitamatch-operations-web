# Copilot Instructions for Mitamatch Operations Architecture

## Skill Details

- pages and components
  1. ページそのものは `app` ディレクトリに置く
  2. ヘルパーのコンポーネントはアンダースコアで `app` ディレクトリに置く
  3. ページをまたいで共通化されるコンポーネントは `src/components` に置く
     - `app/{route}/` にしか使われないコンポーネントは基本的に `src/components/{route}` に置くこと
- actions
  1. 外部連携する内部 API は `_actions` に置く
  2. 外部連携しない内部 API は `actions` に置く
  3. 外部から呼ばれる API は `api` に置く
- others
  1. 基本的に全て `src` 以下に用途別にディレクトリを作ってそこにまとめる
  2. `utility` のような意味が広すぎるディレクトリ名は決して採用しない
  3. ドメインデータのパーサー系は `parser` それを使った計算系は `evaluate` の直下に置く


