# Architecture

## Directory Structure

シンプル構成（lib配下）を採用。MVPに適した軽量構成。

```
app/
├── lib/           # 共有ライブラリ・ユーティリティ
│   └── auth/      # 認証関連
├── services/      # ビジネスロジック（将来拡張時）
├── components/    # 共有UIコンポーネント
├── routes/        # React Routerのルート│   └── api/       #  API関連
（ページ）
└── types/         # 型定義
```

## Principles

1. **Feature by folder**: 機能単位でlib配下にフォルダを作成
   - `lib/auth/` - 認証
   - `lib/rss/` - RSS取得
   - `lib/llm/` - LLM連携

2. **Server/Client separation**: `.server.ts`サフィックスでサーバー専用コードを明示
   - `session.server.ts` - サーバーでのみ実行
   - `context.ts` - 共有可能な型定義

3. **Colocation**: 関連ファイルは近くに配置
   - ルートとそのローダー/アクションは同一ファイル
   - コンポーネントとその型は同一ディレクトリ

## Route Organization

```
routes/
├── login.tsx           # 公開ルート
├── logout.tsx          # 公開ルート
├── _protected.tsx      # 保護レイアウト（ミドルウェア適用）
└── home.tsx            # 保護ルート（_protected配下）
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Route file | kebab-case | `article-list.tsx` |
| Component | PascalCase | `ArticleCard.tsx` |
| Utility | camelCase | `formatDate.ts` |
| Server-only | `.server.ts` suffix | `auth.server.ts` |
| Types | `.types.ts` or in same file | `database.types.ts` |
