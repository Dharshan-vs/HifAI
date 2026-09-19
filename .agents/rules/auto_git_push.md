# Automatic Git Push & Vercel Redeployment Rule

At the completion of every coding task or prompt where files are modified or created:
1. Verify that the project builds cleanly (`npm run build`).
2. Automatically stage all modified and newly created files (`git add .`).
3. Create a descriptive commit summarizing the changes (`git commit -m "..."`).
4. Automatically push the commit to GitHub (`git push origin main` or via the automated script `node server/scripts/gitPush.cjs`), which immediately triggers a Vercel redeployment.
