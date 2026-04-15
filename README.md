# Family Drive Workspace

Open-source private media gallery that keeps your files in Google Drive while serving access through Firebase and Cloudflare.

## Architecture

### GCP / Google

- Google Drive stores photos and videos.
- A Google service account is used by backend services to access the shared Drive folder.

### Firebase

- Firebase Authentication handles sign-in and identity.
- Firestore stores user role data (`admin` / `member`) as an allowlist.
- Firebase Functions (`driveApi`) provides secured file/folder operations.

### Cloudflare

- Cloudflare Worker proxies video streaming requests.
- Worker supports HTTP Range, verifies Firebase ID tokens, and keeps Drive token flow on the server side.

## Monorepo Structure (Simplified)

- `family-drive-app/`: React + Vite frontend
- `family-drive-worker/`: Cloudflare Worker for media proxy/streaming
- `firebase/functions/`: Firebase Functions API
- `firebase/firestore/`: Firestore rules

## Getting Started

### 1. Prerequisites

- Node.js 22+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)
- Wrangler CLI (`npm i -g wrangler`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Files

- Frontend: copy `family-drive-app/.env.example` to `family-drive-app/.env`
- Worker local: copy `family-drive-worker/.dev.vars.example` to `family-drive-worker/.dev.vars`
- Worker CI: set Wrangler authentication values in GitHub Actions (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- Worker deploy runtime: set Worker secrets/vars in Cloudflare (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `ALLOWED_ORIGINS`, `FIREBASE_PROJECT_ID`)
- Functions local: copy `firebase/functions/.env.example` to `firebase/functions/.env`

### 4. Set Required Values

- Firebase web app config values (`VITE_FIREBASE_*`)
- Functions base URL (`VITE_DRIVE_FUNCTIONS_BASE_URL`)
- Worker URL (`VITE_CLOUDFLARE_WORKER_URL`)
- Worker Firebase project id (`FIREBASE_PROJECT_ID`)
- Service account values for Worker/Functions (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`)
- Worker CORS allowlist (`ALLOWED_ORIGINS`, comma-separated)
- Shared root folder id (`SHARED_DRIVE_FOLDER_ID`)
- Functions CORS allowlist (`ALLOWED_ORIGINS`, comma-separated)

### 5. Run Local Development

```bash
npm run dev
```

### 6. Deploy

- Functions: `npm run deploy:functions`
- Worker: `npm --workspace family-drive-worker run deploy`
- Frontend: GitHub Actions workflow (with repository secrets)

## Security Checklist for Public Repositories

- Never commit real keys, tokens, private keys, or personal `.env` values.
- Keep `.env`, `.dev.vars`, and service-account JSON files ignored by git.
- Use least-privilege IAM roles and Drive sharing scope.
- Rotate keys immediately if they are exposed.

