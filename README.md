# Family Drive Workspace

Open-source private media gallery using Google Drive storage.

## What We Use

- Firebase Authentication: sign-in and user identity.
- Firebase Firestore: user roles and app metadata.
- Google Drive API: media source (photos/videos).
- Cloudflare Worker: secure video streaming proxy with HTTP Range support.

## Why

- Keep files in your own Drive account.
- Stream videos reliably without full file download.
- Control access with Firebase user/role model.

## SaaS and Service Purpose

- Firebase Auth: verify who can sign in.
- Firestore: store user role (admin/member) and app-side config/log data.
- Google Drive API: fetch media by file id.
- Cloudflare Worker: hide Drive token flow from browser and return stream response.

## Setup Files

- Frontend env example: `family-drive-app/.env.example`
- Worker local secret example: `family-drive-worker/.dev.vars.example`
- Worker CI env example: `family-drive-worker/.env.example`
- Firestore rules template: `firebase/firestore.rules`

## Deploy Notes

- Worker deploy uses compile check first (`npm --workspace family-drive-worker run deploy`).
- Frontend deploy uses repository secrets in GitHub Actions.

## Security Reminder

Never commit real secrets, private keys, or personal environment values.

