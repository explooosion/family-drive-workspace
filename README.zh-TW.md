# Family Drive Workspace

這是一個可開源分享的私有媒體相簿，媒體保留在 Google Drive，存取控制由 Firebase 與 Cloudflare 共同完成。

## AI 協作規範（重要）

在此 repo 請 Copilot/AI 產生或重構程式碼前，請先遵守以下架構邊界。

### 1. Firebase Functions（API 與授權閘道）

- 負責 metadata、資料夾/檔案 CRUD 與安全決策。
- 每個請求都必須驗證 Firebase ID token。
- 必須從 Firestore 驗證使用者角色（`admin` / `member`）。
- 必須強制資料夾隔離（使用者只能存取被指派的 Drive 資料夾範圍）。
- Google Service Account 憑證僅能留在後端。

### 2. Cloudflare Worker（媒體代理與串流引擎）

- 負責重媒體傳輸（特別是影片串流）。
- 必須正確支援 HTTP Range（讓影片可 seek/scrub）。
- 回傳媒體前必須驗證 Firebase ID token。
- 必須在伺服端附加 Drive access token。
- 不可把 Drive 直接下載 URL 暴露給瀏覽器。

### 3. Frontend（React + Vite）

- 僅為 UI 層。
- metadata 操作（list/upload/delete/rename）走 Firebase Functions。
- 圖片/影片渲染走 Cloudflare Worker URL。
- 不可處理 Service Account 機密或直接 Drive API 憑證。

### 任務請求模板

需要 AI 寫程式時可使用以下模板：

```md
# Context: Family Drive Workspace Architecture

Please act as a senior full-stack developer assisting me with the "Family Drive Workspace" monorepo.
Before generating or refactoring any code, you must follow our separation of concerns:

1) Firebase Functions = metadata CRUD + auth + authorization
2) Cloudflare Worker = media proxy/streaming + range support
3) Frontend = UI only, consume Functions/Worker APIs

## Task
[請描述具體開發任務]

## Constraints
- 不可把安全邏輯移到前端。
- 不可暴露 Drive 憑證或直連 URL 給 client。
- 必須保留既有角色檢查與資料夾範圍限制。
```

## 系統架構

### GCP / Google

- Google Drive：儲存照片與影片。
- Service Account：由後端服務使用，用於存取共享資料夾。

### Firebase

- Firebase Authentication：登入與身份驗證。
- Firestore：儲存使用者角色（`admin` / `member`）與白名單資料。
- Firebase Functions（`driveApi`）：提供受保護的檔案/資料夾操作 API。

### Cloudflare

- Cloudflare Worker：代理影片串流請求。
- 支援 HTTP Range、驗證 Firebase ID token，並在伺服端處理 Drive token 流程。

## 目錄結構（簡化）

- `family-drive-app/`：React + Vite 前端
- `family-drive-worker/`：Cloudflare Worker 串流代理
- `firebase/functions/`：Firebase Functions API
- `firebase/firestore/`：Firestore Rules

## Getting Started

### 1. 先備條件

- Node.js 22+
- npm 10+
- Firebase CLI（`npm i -g firebase-tools`）
- Wrangler CLI（`npm i -g wrangler`）

### 2. 安裝依賴

```bash
npm install
```

### 3. 建立環境設定檔

- 前端：`family-drive-app/.env.example` 複製為 `family-drive-app/.env`
- Worker 本機：`family-drive-worker/.dev.vars.example` 複製為 `family-drive-worker/.dev.vars`
- Worker CI：在 GitHub Actions 設定 Wrangler 驗證所需值（`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`）
- Worker 正式執行環境：在 Cloudflare 設定 Worker secrets / vars（`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `ALLOWED_ORIGINS`, `FIREBASE_PROJECT_ID`）
- Functions 本機：`firebase/functions/.env.example` 複製為 `firebase/functions/.env`

### 4. 填入必要值

- Firebase 前端設定（`VITE_FIREBASE_*`）
- Functions URL（`VITE_DRIVE_FUNCTIONS_BASE_URL`）
- Worker URL（`VITE_CLOUDFLARE_WORKER_URL`）
- Worker Firebase project id（`FIREBASE_PROJECT_ID`）
- Service Account 參數（`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`）
- Worker CORS 白名單（`ALLOWED_ORIGINS`，逗號分隔）
- Shared Drive root folder id（`SHARED_DRIVE_FOLDER_ID`）
- Functions CORS 白名單（`ALLOWED_ORIGINS`，逗號分隔）

### 5. 本機開發

```bash
npm run dev
```

### 6. 部署

- Functions：`npm run deploy:functions`
- Worker：`npm --workspace family-drive-worker run deploy`
- Frontend：透過 GitHub Actions（需配置 repository secrets）

## 公開專案安全檢查

- 不要提交真實金鑰、私鑰、token、或個人 `.env` 值。
- 確認 `.env`、`.dev.vars`、service-account JSON 皆被 `.gitignore` 排除。
- 使用最小權限 IAM 與最小資料夾共享範圍。
- 若金鑰曾外洩，立即輪替。
