# Family Drive Workspace

這是一個可開源分享的私有媒體相簿。

## 我們使用的服務

- Firebase Authentication：登入與身份驗證。
- Firebase Firestore：使用者角色與應用資料。
- Google Drive API：照片與影片來源。
- Cloudflare Worker：影片串流代理與 Range 支援。

## 為什麼這樣做

- 媒體保留在你自己的 Google Drive。
- 影片可直接串流與拖曳播放，不需整檔下載。
- 以 Firebase 身份與角色控制存取權限。

## SaaS 用途

- Firebase Auth：驗證誰可以登入。
- Firestore：儲存角色（admin/member）與設定資料。
- Google Drive API：依檔案 id 讀取媒體。
- Cloudflare Worker：在伺服端處理 token 與串流回應。

## 設定檔

- 前端環境範例：`family-drive-app/.env.example`
- Worker 本機秘密範例：`family-drive-worker/.dev.vars.example`
- Worker CI 環境範例：`family-drive-worker/.env.example`
- Firestore 規則模板：`firebase/firestore.rules`

## 部署重點

- Worker 部署前會先編譯檢查（`npm --workspace family-drive-worker run deploy`）。
- 前端部署使用 GitHub Actions secrets。

## 安全提醒

請勿提交任何真實金鑰、私鑰、token 或個人環境值。
