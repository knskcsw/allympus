# エージェント指示 (manage-task-app)

## ワークツリー + ブランチ
- `main` からワークツリーとブランチ切ってや〜。ここはホンマに守ってな〜。
- ワークツリー作る場所はここやで〜: `/Users/kansukechisuwa/project/manage-task-app-worktrees`

## DB (SQLite + Prisma)
- DBファイルのコピーは禁止やで〜。そこ間違えたらあかんで〜。
- ワークツリー専用のSQLite DBを作って、本体DBを dump/restore で引き継いでな〜。
  - 本体DB: `/Users/kansukechisuwa/project/manage-task-app/dev.db`
  - ワークツリーDB: `/Users/kansukechisuwa/project/manage-task-app-worktrees/<branch>/dev.db`
  - 例:
    - `sqlite3 /Users/kansukechisuwa/project/manage-task-app/dev.db .dump | sqlite3 /Users/kansukechisuwa/project/manage-task-app-worktrees/<branch>/dev.db`
- `DATABASE_URL` はワークツリーDBを指してな〜。本体向けたらあかんで〜。
- ワークツリー側で `prisma migrate dev`（または `prisma db push`）を実行して整合性を取ってな〜。ここも忘れんといて〜。

## 開発サーバ
- 起動前に稼働中プロセスを確認して、空いてるポート使ってな〜。被ったらあかんで〜。
- 必要なら `npm install` してな〜。
- 他と被らないポートで `npm run dev` を起動してな〜。

## 片付け
- ユーザーからOKもろたら、`main` にマージしてワークツリーとブランチ削除して、起動したサーバ止めてな〜。最後まで頼むで〜。
- `main` マージ後は本体DBに対して `prisma migrate dev`（または `prisma db push`）を実行して最新化してな〜。これも忘れたらあかんで〜。

## プランニング
- 要件が曖昧ならプランモードに切り替えて詰めてな〜。そのまま進めたらあかんで〜。
