
const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let firebaseApp = null;
let isConfigured = false;

function initFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      '/etc/secrets/firebase-service-account.json';

    let serviceAccount = null;

    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8')
      );
      console.log('[FirebaseAdmin] Loaded credentials from Secret File.');
    } else {
      console.warn('[FirebaseAdmin] Secret File not found:', serviceAccountPath);
      console.warn('[FirebaseAdmin] Checking environment variables instead.');
    }

    let projectId =
      serviceAccount?.project_id ||
      process.env.FIREBASE_PROJECT_ID ||
      'agriconnect-f12ab';

    const clientEmail =
      serviceAccount?.client_email ||
      process.env.FIREBASE_CLIENT_EMAIL;

    const privateKey =
      serviceAccount?.private_key ||
      process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.error('[FirebaseAdmin] Service account credentials are missing.');
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

    console.log(
      `[FirebaseAdmin] Initialized successfully for project: ${projectId}`
    );

    return firebaseApp;
  } catch (error) {
    console.error(
      '[FirebaseAdmin] Error initializing Firebase Admin SDK:',
      error.message
    );
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
    const err = new Error(
      'Firebase Admin SDK is not configured with service account credentials.'
    );
    err.code = 'FIREBASE_NOT_CONFIGURED';
    err.statusCode = 503;
    throw err;
  }

  try {
    return await getAuth(firebaseApp).verifyIdToken(idToken, true);
  } catch (authError) {
    console.error('[FirebaseAdmin] Token verification failed:', authError.message);
    const err = new Error(
      `Firebase token verification failed: ${authError.message}`
    );
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
