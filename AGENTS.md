# Workspace Rules for Antigravity

## Automatic Git Push & Vercel Redeployment
After every response or task where code is added, modified, or deleted:
1. Verify the frontend bundle compiles without errors using `npm run build`.
2. Stage all changed files: `git add .`
3. Commit the changes with a concise, descriptive commit message: `git commit -m "<Summary of changes>"`
4. Push to origin main: `git push origin main` (or using `node server/scripts/gitPush.cjs`) so Vercel can automatically trigger a fresh production build and deployment.
