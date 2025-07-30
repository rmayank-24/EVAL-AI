// File: functions/index.js

// 1. Import necessary modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// 2. Initialize the Firebase Admin SDK
// This gives your function access to other Firebase services like Firestore.
admin.initializeApp();

// 3. Get a reference to the Firestore database
const db = admin.firestore();

/**
 * This Cloud Function triggers automatically whenever a new user is created
 * in Firebase Authentication. Its job is to create a corresponding user
 * profile document in the 'users' collection in Firestore.
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  // The 'user' object contains all the auth information (uid, email, etc.)
  const { uid, email, displayName } = user;

  // Log to the Cloud Functions console for debugging
  console.log(`New user signed up: UID=${uid}, Email=${email}. Creating profile...`);

  // 4. Define the structure for the new user profile document
  const newUserProfile = {
    email: email || "", // The user's email address
    displayName: displayName || "", // The user's display name, if available from signup
    role: "student", // Assign a default role of 'student'
    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add a timestamp
    // You can add any other default fields you need here
    // e.g., photoURL: user.photoURL || ""
  };

  try {
    // 5. Create the new document in the 'users' collection.
    // It's crucial that the document ID is the same as the user's UID.
    await db.collection("users").doc(uid).set(newUserProfile);

    console.log(`Successfully created profile for user: ${uid}`);
    return null; // Indicates successful execution
  } catch (error) {
    // Log any errors to the console
    console.error(`Error creating user profile for UID: ${uid}`, error);
    // You could add more robust error handling here, like sending an alert.
    return null;
  }
});
