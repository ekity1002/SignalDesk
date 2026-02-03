### ブランチ命名規則

機能ブランチ（プロジェクト配下）: `feature/issue-チケット番号/説明`
  - 例: `feature/issue-1234/add_simulation_list`
  - ベースブランチ: `develop`

親子チケットの場合:
  - 親ブランチ: `feature/issue-親チケット番号/develop`
  - 子ブランチ: `feature/issue-親チケット番号/issue-子チケット番号/説明`


### コミットメッセージフォーマット

- 必須形式: `:emoji: issue-チケット番号: サブジェクト`
- 絵文字ショートコードは`.commit_template`を参照

- コミット例:
:bug: issue-1234: ログイン時のクラッシュを修正
:sparkles: issue-2345: ユーザープロフィール画像アップロード機能を追加
:robot: issue-3456: ログインコンポーネントのテストを追加

### PR作成ルール

- タイトル形式:
  - 通常の機能ブランチ → develop: `issue-チケット番号: チケット件名`
