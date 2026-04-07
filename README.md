# Mitamatch Operations for Web

ラスバレ向けの Web ツール群を提供する、Next.js 16 ベースのアプリケーションです。
Deck Builder / Timeline Builder 等 を App Router 上で提供し、Clerk と Postgres を使ったユーザーデータ連携にも対応しています。

## プロジェクト概要

主な機能:

- Data
  メモリア、衣装、キャラクターの参照と検索
- Deck Builder
  デッキ作成、比較、共有、期待値計算
- Timeline Builder
  オーダータイムライン作成、編集、共有
- Docs
  MDX + content-collections によるドキュメント表示
- User Data
  Clerk webhook 経由のユーザー同期、Deck / Timeline の保存

## 構成

```mermaid
flowchart TB
%% Users & External
User([User / Browser])
ClerkAuth([Clerk: Auth & User Mgmt])
Sentry([Sentry / Analytics])

    %% Environments
    subgraph Prod["Production Environment (Vercel)"]
        NextProd["Next.js (App Router)"]

        subgraph ServerProd["Server (RSC / API)"]
            API_Prod["API Routes (Webhooks etc)"]
            Action_Prod["Server Actions / Data Fetch"]
        end

        subgraph ClientProd["Client (React 19)"]
            UI_Prod["UI (Deck / Timeline)"]
            State_Prod["Jotai (Global State)\nTanStack Query (Cache)"]
        end

        NextProd --- ServerProd
        NextProd --- ClientProd
    end

    subgraph LocalDev["Local Development Environment"]
        NextLocal["Next.js (localhost:3000)"]
        CFTunnel["Cloudflare Tunnel"]
    end

    %% Database
    Neon[(Neon: PostgreSQL)]
    Docs[("docs/ (MDX)\ncontent-collections")]

    %% --- Connections ---

    %% User Flow
    User -- "1. Access / Interact" --> NextProd
    User -- "2. Login / Token" --> ClerkAuth

    %% Build & Static
    Docs -. "Build-time parsing" .-> NextProd

    %% Production Data Flow
    ClientProd -- "Query / Mutation" --> ServerProd
    Action_Prod -- "Drizzle ORM" --> Neon
    API_Prod -- "Drizzle ORM" --> Neon
    NextProd -- "Logs / Traces" --> Sentry
    ServerProd -- "Verify Token" --> ClerkAuth

    %% Local Webhook Flow (Debug)
    ClerkAuth -- "Webhook (User Sync etc)" --> CFTunnel
    CFTunnel -- "Forward to /api/webhooks" --> NextLocal
    NextLocal -- "Sync User Data" --> Neon
```

## 技術スタック

- Framework: Next.js 16.2, React 19.2, TypeScript 6
- UI: MUI 7, dnd-kit, CodeMirror, react-virtuoso
- State/Data: Jotai, TanStack Query
- Auth: Clerk
- DB/ORM: Neon(PostgreSQL), Drizzle ORM, drizzle-kit
- Observability: Sentry, OpenTelemetry, Vercel Analytics, Speed Insights
- Content: MDX, content-collections, remark-gfm, rehype-slug
- Test: Vitest, Testing Library, happy-dom
- Utility: fp-ts, neverthrow, ts-pattern
- Lint/Format: oxlint, oxfmt, Biome
- Package Manager: pnpm 10
- Runtime 管理: Volta (`node@24.14.1`)

## ディレクトリ構造

```text
.
|- app/                    # App Router のページ/ルートハンドラ
|  |- _actions/            # Server Actions
|  |- actions/             # サーバー側ユーティリティ
|  |- api/                 # API routes（Webhook等）
|  |- dashboard/           # ユーザー保存データの閲覧
|  |- data/                # メモリア / 衣装 / キャラクター参照ページ
|  |- deck-builder/        # Deck Builder 画面
|  |- docs/                # ドキュメント表示ルート
|  |- flowchart/           # フローチャート系ページ
|  |- timeline-builder/    # Timeline Builder 画面
|- src/
|  |- components/          # UI コンポーネント
|  |- database/            # Drizzle schema / DB アクセス
|  |- domain/              # ドメインデータ(JSON含む)
|  |- endec/               # URL 共有用のエンコード/デコード
|  |- evaluate/            # 計算・評価ロジック
|  |- jotai/               # グローバル状態
|  |- metadata/            # Metadata ヘルパー
|  |- parser/              # スキル / クエリパーサ
|  |- styles/, theme/      # スタイル / テーマ
|  |- test/                # テスト補助
|- docs/                   # MDXドキュメントソース
|- public/                 # 画像アセット
|- drizzle/                # SQLマイグレーション
|- scripts/                # seed / ドメイン更新スクリプト
|- content-collections.ts  # docs コレクション定義
|- next.config.ts          # Next / MDX / Sentry 設定
|- drizzle.config.ts       # Drizzle 設定
```

## セットアップ

### 1. Node.js / pnpm

このプロジェクトは Volta で Node バージョンを固定しています。

```bash
volta install node@24.14.1
pnpm install
```

### 2. 環境変数

`.env.example` をもとに `.env` を作成してください。

```bash
cp .env.example .env
```

主に使用する環境変数:

- `POSTGRES_URL`
- `POSTGRES_DEVELOP_BRANCH_URL`（開発 DB を分ける場合）
- `CLERK_WEBHOOK_SECRET` / `CLERK_WEBHOOK_DEV_SECRET`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `SENTRY_AUTH_TOKEN`

`.env.example` には Postgres / Sentry 系のひな形を置いています。Clerk や Webhook 用シークレットは利用環境に合わせて追記してください。

## 開発の進め方

### ローカル起動

```bash
pnpm dev
```

### テスト

```bash
pnpm test
pnpm test:coverage
```

### Lint / Format

```bash
pnpm lint
pnpm lint:fix
pnpm fmt
pnpm fmt:check
pnpm pretty
```

### ビルド確認

```bash
pnpm build
pnpm start
```

### ドメインデータ更新

```bash
pnpm domain:update
pnpm domain:update:memoria
pnpm domain:update:costume
```

## データベース運用

Drizzle 設定は `drizzle.config.ts` で管理しています。

- schema: `src/database/schema.ts`
- migration出力: `drizzle/`

初期データ投入:

```bash
pnpm seed
```

`scripts/seed.ts` は `src/domain/memoria/memoria.json` と `src/domain/order/order.json` を DB に投入します。

## ドキュメント運用

- MDXソース: `docs/`
- 変換設定: `content-collections.ts`
- 表示ルート: `app/docs/[...slug]/page.tsx`
- Markdown 拡張: `remark-gfm`
- 見出し ID 付与: `rehype-slug`

## License

MIT License. See [LICENSE](LICENSE).
