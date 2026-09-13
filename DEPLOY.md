# Deploying YUGA — Renewable Energy Community Platform

Production layout after `npm run build`:

| URL | Serves |
|-----|--------|
| `/` | YUGA App Entry & Authentication (Login) |
| `/landing` | YUGA React Marketing Landing Page |
| `/landing.html` | YUGA Static Marketing Landing Page |
| `/signup`, `/dashboard`, `/profile`, `/settings` | YUGA React SPA Protected & Public Routes |

---

## 1. Vercel (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import your YUGA repository.
2. Framework preset: **Vite** (auto-detected). Build command: `npm run build`. Output: `dist`.
3. Add **Environment Variables** (Project → Settings → Environment Variables):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy! `vercel.json` will automatically rewrite all SPA routes to `/index.html`.

---

## 2. Firebase Hosting

1. Install Firebase CLI: `npm i -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Deploy hosting: `firebase deploy --only hosting`
- `firebase.json` is pre-configured to output `dist` with SPA rewrite rules to `/index.html`.

---

## 3. Netlify

1. Connect your repository on Netlify.
2. Build command: `npm run build`, Publish directory: `dist`.
3. Add `VITE_FIREBASE_*` environment variables in Netlify site settings.
- `netlify.toml` automatically handles SPA routing redirects.

---

## 4. Firebase Console Setup (Required)

Ensure the following configuration in your Firebase Project (`auth-hifi`):
1. **Authentication → Sign-in method**:
   - Enable **Email/Password**
   - Enable **Google**
   - Enable **Phone**
2. **Authorized Domains**: Add your production domain (e.g. `yuga.vercel.app`) under Authentication → Settings → Authorized Domains.
3. **Firestore & Storage Security Rules**:
   - Apply Firestore rules from `firebase-setup.md`.
   - Apply Storage rules from `firebase-setup.md`.

---

## 5. Local Production Preview

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173/` (App at `/`, Landing at `/landing` or `/landing.html`).
