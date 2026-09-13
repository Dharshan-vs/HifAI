# Enable Phone Login in Firebase (Required)

The error **"This sign-in method is not enabled"** means Phone auth is OFF in your Firebase project. The app code is correct — you must enable it in the console:

## Steps (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **`auth-hifi`**
3. Open **Build → Authentication → Sign-in method**
4. Click **Phone** in the providers list
5. Toggle **Enable** → click **Save**
6. Go to **Authentication → Settings → Authorized domains**
7. Ensure **`localhost`** is listed (add it if missing)
8. For production, add your domain (e.g. `yourapp.vercel.app`)

## Test without SMS (optional)

Under **Authentication → Sign-in method → Phone → Phone numbers for testing**:

| Phone number   | OTP code |
|----------------|----------|
| +91 9876543210 | 123456   |

Add your test number + fixed OTP to develop without sending real SMS.

## After enabling

1. Restart the dev server: `npm run dev`
2. Open login → **Phone** tab
3. Complete the **reCAPTCHA** checkbox that appears
4. Enter phone with country code → **Send OTP**

---

# Connect Your Landing Page "Get Started" Button

Your landing page and this app are separate projects. Link them with a URL.

## Option A — Local development

Landing page button:

```html
<a href="http://localhost:5173/signup">Get Started</a>
```

Or to login:

```html
<a href="http://localhost:5173/">Get Started</a>
```

Use the port shown when you run `npm run dev` (5173, 5176, etc.).

## Option B — After deployment

Deploy this app (Vercel, Netlify, Firebase Hosting), then point your landing page to the live URL:

```html
<a href="https://app.yuga.com/signup">Get Started</a>
```

```jsx
// React landing page example
import { Link } from 'react-router-dom';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

<Link to={`${APP_URL}/signup`}>Get Started</Link>

// Or plain anchor (works across separate sites):
<a href="https://your-yuga-app.vercel.app/signup">Get Started</a>
```

## Option C — Same domain (advanced)

- Landing: `yuga.com` → marketing site  
- App: `app.yuga.com` → this project deployed separately  

```html
<a href="https://app.yuga.com/signup">Get Started</a>
```

## Routes in this app

| URL path           | Page              |
|--------------------|-------------------|
| `/`                | Login             |
| `/signup`          | Sign up           |
| `/forgot-password` | Reset password    |
| `/dashboard`       | Dashboard (auth)  |

## Paste your landing page code

You can paste your landing page HTML/React here in chat and we can wire the exact **Get Started** link for you.

## Deploy this app quickly

```bash
npm run build
```

Then deploy the `dist/` folder to:
- **Vercel:** `npx vercel`
- **Netlify:** drag `dist/` to netlify.com/drop
- **Firebase Hosting:** `firebase deploy`

Set the same `.env` Firebase variables in your hosting provider's environment settings.
