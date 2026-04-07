# Copilot Instructions for Mitamatch Operations State Management

## Skill Details

- コンポーネントに閉じた状態、またはバケツリレーで済む場合は `useState` を使う
- グローバルな状態が必要なときは `Jotai` ライブラリを使う
  - コンポーネントが使うだけの状態には `atom` を使う
  - 半永続化が必要な状態（フラグ管理など）は `atomWithStorage` を使う
  - 完全な永続化が必要な状態は `neon` に保存するので、`atomWithQuery` で Tanstack React Query と連携する
    - 必ず loading 状態を管理する
    - できる限り楽観的更新をする
