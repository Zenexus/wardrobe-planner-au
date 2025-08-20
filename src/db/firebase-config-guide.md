# Firebase Configuration Guide

## Environment Variables Required

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
# Get these values from your Firebase project settings
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## How to Get Firebase Config Values

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project (or create a new one)
3. Click on the gear icon (Project Settings)
4. Scroll down to "Your apps" section
5. If you haven't added a web app yet, click "Add app" and select Web
6. Copy the config values from the Firebase SDK snippet

## Firestore Database Setup

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location for your database

## Security Rules (Optional)

For production, you might want to secure your Firestore with rules like:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to designs collection
    match /designs/{document} {
      allow read, write: if true; // Adjust based on your auth requirements
    }
  }
}
```
