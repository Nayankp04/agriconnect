
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

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

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const parsedKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        clientEmail = parsedKey.client_email || clientEmail;
        privateKey = parsedKey.private_key || privateKey;
      } catch (error) {
        console.warn('[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
      }
    }

    if (!clientEmail || !privateKey) {
      console.warn('[FirebaseAdmin] Firebase service account credentials are missing.');
      return null;
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const existingApps = getApps();
    firebaseApp = existingApps.length
      ? existingApps[0]
      : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        projectId,
      });

    isConfigured = true;
    console.log(`[FirebaseAdmin] Initialized Firebase Admin SDK for project: ${projectId}`);

    return firebaseApp;
  } catch (error) {
    console.error('[FirebaseAdmin] Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
}

initFirebaseAdmin();

async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    const err = new Error('A valid Firebase ID token string is required.');
    err.code = 'INVALID_ID_TOKEN';
    err.statusCode = 400;
    throw err;
  }

  if (!isConfigured || !firebaseApp) {
    const err = new Error('Firebase Admin SDK is not configured with service account credentials in environment.');
    err.code = 'FIREBASE_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }

  try {
    return await getAuth(firebaseApp).verifyIdToken(idToken, true);
  } catch (authError) {
    console.error('[FirebaseAdmin] Token verification failed:', authError.message);
    const err = new Error(`Firebase token verification failed: ${authError.message}`);
    err.code = authError.code || 'TOKEN_VERIFICATION_FAILED';
    err.statusCode = 401;
    throw err;
  }
}

module.exports = {
  initFirebaseAdmin,
  verifyFirebaseIdToken,
  isFirebaseAdminConfigured: () => isConfigured,
};
