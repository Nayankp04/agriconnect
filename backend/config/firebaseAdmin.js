const admin = require('firebase-admin');

let firebaseApp = null;
let isConfigured = false;

function initFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'agriconnect-f12ab';
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Check for JSON string credential
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsedKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        clientEmail = parsedKey.client_email || clientEmail;
        privateKey = parsedKey.private_key || privateKey;
      } catch (e) {
        console.warn('[FirebaseAdmin] Warning: FIREBASE_SERVICE_ACCOUNT_KEY was provided but could not be parsed as JSON.');
      }
    }

    if (clientEmail && privateKey) {
      // Normalize escaped newlines from environment variables
      const formattedPrivateKey = privateKey.includes('\\n')
        ? privateKey.replace(/\\n/g, '\n')
        : privateKey;

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        projectId,
      });

      isConfigured = true;
      console.log(`[FirebaseAdmin] ✅ Initialized Firebase Admin SDK for project: ${projectId}`);
    } else {
      console.warn('[FirebaseAdmin] ⚠️ Credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) not set in environment.');
      console.warn('[FirebaseAdmin] ℹ️ Live Firebase ID Token verification requires these variables on Render/production.');
    }
  } catch (error) {
    console.error('[FirebaseAdmin] ❌ Error initializing Firebase Admin SDK:', error.message);
  }

  return firebaseApp;
}

// Initialize on module load
initFirebaseAdmin();

/**
 * Verify a Firebase ID token securely on the backend
 * @param {string} idToken - The Firebase ID token from the client
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    const err = new Error('A valid Firebase ID token string is required.');
    err.code = 'INVALID_ID_TOKEN';
    err.statusCode = 400;
    throw err;
  }

  if (!isConfigured) {
    const err = new Error('Firebase Admin SDK is not configured with service account credentials in environment.');
    err.code = 'FIREBASE_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);
    return decodedToken;
  } catch (authError) {
    console.error('[FirebaseAdmin] ❌ Token verification failed:', authError.message);
    const err = new Error(`Firebase token verification failed: ${authError.message}`);
    err.code = authError.code || 'TOKEN_VERIFICATION_FAILED';
    err.statusCode = 401;
    throw err;
  }
}

module.exports = {
  admin,
  initFirebaseAdmin,
  verifyFirebaseIdToken,
  isFirebaseAdminConfigured: () => isConfigured,
};

