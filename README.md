# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## ローカル環境での cron API 実行手順（curl）

ローカルで開発サーバーを起動した状態で、`curl` を使って cron 用 API を直接叩くことができます。

---

### 手順

#### 1. `.env` に `CRON_SECRET` を設定（未設定の場合）

```env
# .env に追加
CRON_SECRET=local-test-secret
```

---

#### 2. 開発サーバーを起動

```bash
npm run dev
```

---

#### 3. 別ターミナルから `curl` で実行

```bash
# rss取得
curl -H "Authorization: Bearer local-test-secret" http://localhost:5173/api/cron/fetch-rss

#古い記事の削除
curl -H "Authorization: Bearer local-test-secret" http://localhost:5173/api/cron/cleanup-old-articles
```

---

### レスポンス例

```json
{
  "success": true,
  "totalSources": 2,
  "results": [
    {
      "sourceId": "...",
      "sourceName": "Tech Blog",
      "created": 5,
      "skipped": 0,
      "errors": []
    }
  ]
}
```

---

### エラー時の挙動

- 認証に失敗した場合、以下が返ります：

```json
{ "error": "Unauthorized" }
```

- HTTP ステータスコード: **401**

---

### 注意事項

- 実行前に **DB にアクティブな RSS ソースが登録されている必要**があります
- **Supabase が起動していること**を確認してください

```bash
npm run db:start
```

