// src/config/firebase.js
import admin from "firebase-admin";

// Make sure you have set FIREBASE_SERVICE_ACCOUNT as an environment variable
// Example: process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(firebaseServiceAccountJson)

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT environment variable not set. Please add it in Render or your environment."
  );
}

// Parse the service account JSON from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get Firestore instance
const db = admin.firestore();

export { db, admin }; // named exports
