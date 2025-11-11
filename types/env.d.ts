// Next.js Environment Variables Type Definitions

declare namespace NodeJS {
  interface ProcessEnv {
    // Firebase Configuration (Client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;

    // Site Configuration (Client-side)
    NEXT_PUBLIC_SITE_REGION?: string; // "AU" or "NZ", defaults to "AU"

    // Email Configuration (Server-side only)
    EMAIL_USER: string;
    EMAIL_PASS: string;

    // Optional: Add other environment variables as needed
    NODE_ENV: "development" | "production" | "test";
  }
}
