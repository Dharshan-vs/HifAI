# Firebase Security Rules (paste in Firebase Console)

## Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Authentication Providers to Enable (Firebase Console → Authentication → Sign-in method)
- Email/Password
- Google
- Phone

## Authorized domains (Authentication → Settings → Authorized domains)
- localhost
- Your production domain when deployed

## Phone Auth
- Enable Phone provider in Firebase Console
- For testing, add test phone numbers in Firebase Console (optional)
