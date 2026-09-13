# REOS — Renewable Energy Operating System

A production-ready MVP for a renewable energy community marketplace. Sprint 1 delivers authentication, user management, dashboard foundation, and a reusable design system.

## Tech Stack

- **Frontend:** React 19, Vite, JavaScript, Tailwind CSS v4
- **Routing:** React Router DOM v7
- **Forms:** React Hook Form
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Backend:** Firebase v11 (Auth, Firestore, Storage)

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication, Firestore, and Storage enabled

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment template and add your Firebase credentials:

```bash
cp .env.example .env
```

3. Configure Firebase in `.env`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Enable in Firebase Console:
   - **Authentication:** Email/Password sign-in
   - **Firestore:** Create a `users` collection (auto-created on signup)
   - **Storage:** Enable for avatar uploads

5. Start the development server:

```bash
npm run dev
```

## Project Structure

```
src/
├── assets/
├── components/
│   ├── common/          # Reusable UI components
│   └── layout/          # Layout wrappers
├── features/
│   ├── authentication/  # Login, Signup, Forgot Password
│   ├── dashboard/       # Dashboard page
│   ├── profile/         # Profile management
│   └── settings/        # User settings
├── context/             # Auth Context (Context API)
├── firebase/            # Firebase configuration
├── hooks/               # Custom React hooks
├── pages/               # Standalone pages (404)
├── routes/              # Route definitions & guards
├── services/            # Firebase service layer
├── styles/              # Global styles & Tailwind
└── utils/               # Helpers & constants
```

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Login | Public |
| `/signup` | Sign Up | Public |
| `/forgot-password` | Password Reset | Public |
| `/verify-email` | Email Verification | Protected |
| `/dashboard` | Dashboard | Protected |
| `/profile` | User Profile | Protected |
| `/settings` | Settings | Protected |

## Sprint 1 Scope

- Authentication system (login, signup, forgot password, email verification)
- User profile management with avatar upload
- Dashboard with placeholder stats and charts
- Responsive sidebar navigation with collapse
- Top navbar with search, notifications, profile menu
- Reusable design system components
- Protected & public route guards
- Dark mode support (Settings)

## Not in Sprint 1

Energy trading, AI prediction, blockchain, payments, IoT integration, smart meters, weather APIs, and real analytics.

## Build

```bash
npm run build
npm run preview
```

## License

Proprietary — REOS © 2026
