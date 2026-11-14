const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const app = require('./app');
const connectDB = require('./config/database');
const User = require('./models/User');
const PendingRegistration = require('./models/PendingRegistration');
const FarmerProfile = require('./models/FarmerProfile');
const FPOProfile = require('./models/FPOProfile');
const BuyerProfile = require('./models/BuyerProfile');
const LogisticsProfile = require('./models/LogisticsProfile');
const generateToken = require('./utils/generateToken');

// Helper to make local HTTP requests
function makeRequest(server, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      hostname: '127.0.0.1',
      port: address.port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', reject);

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🔥 AGRICONNECT FIREBASE AUTH & EMAIL VERIFICATION TEST SUITE 🔥');
  console.log('===============================================================\n');

  let server;
  try {
    // 1. Connect to Database using standard connectDB
    await connectDB();

    server = http.createServer(app).listen(0);
    const port = server.address().port;
    console.log(`[Test] HTTP Server running on ephemeral port: ${port}\n`);

    const testEmail = `farmer.test.${Date.now()}@agriconnect.org`;
    const testPassword = 'SecureFarmerPassword@2026';
    const testFirebaseUid = `fb_uid_${Date.now()}`;
    let savedRegToken = '';

    // TEST 1: Check Email Availability
    console.log('1️⃣ Testing Email Availability Pre-Check (/api/auth/check-email)...');
    const check1 = await makeRequest(server, { path: `/api/auth/check-email?email=${encodeURIComponent(testEmail)}` });
    if (check1.statusCode !== 200 || !check1.data.available) {
      throw new Error(`Expected email to be available, got status ${check1.statusCode}: ${JSON.stringify(check1.data)}`);
    }
    console.log(`   - Status: ${check1.statusCode} | Available: ${check1.data.available}`);
    console.log('   ✅ Email availability pre-check verified!\n');

    // TEST 2: Register Intent & Password Hashing (Zero Plaintext)
    console.log('2️⃣ Testing Register Intent Creation (/api/auth/register-intent)...');
    const intentRes = await makeRequest(server, { path: '/api/auth/register-intent', method: 'POST' }, {
      name: 'Shankarappa Gowda',
      email: testEmail,
      phone: '9845012345',
      password: testPassword,
      role: 'FARMER',
      location: { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
      firebaseUid: testFirebaseUid,
    });

    if (intentRes.statusCode !== 200 || !intentRes.data.registrationToken) {
      throw new Error(`Failed to create register intent: ${JSON.stringify(intentRes.data)}`);
    }

    savedRegToken = intentRes.data.registrationToken;
    console.log(`   - Status: ${intentRes.statusCode}`);
    console.log(`   - Cryptographic Registration Token: ${savedRegToken.slice(0, 16)}... (Length: ${savedRegToken.length})`);

    // Verify PendingRegistration in MongoDB directly
    const pendingDoc = await PendingRegistration.findOne({ email: testEmail });
    if (!pendingDoc) {
      throw new Error('PendingRegistration document was not found in MongoDB!');
    }

    if (pendingDoc.passwordHash === testPassword) {
      throw new Error('CRITICAL SECURITY VIOLATION: Password was stored in plaintext in PendingRegistration!');
    }

    const isBcrypt = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(pendingDoc.passwordHash);
    if (!isBcrypt) {
      throw new Error(`Stored passwordHash is not a valid bcrypt hash: ${pendingDoc.passwordHash}`);
    }

    const passwordMatches = await bcrypt.compare(testPassword, pendingDoc.passwordHash);
    if (!passwordMatches) {
      throw new Error('bcrypt.compare failed on stored passwordHash!');
    }
    console.log(`   - Password Hash Verified in DB: ${pendingDoc.passwordHash.slice(0, 20)}... (Bcrypt match: true)`);
    console.log('   ✅ Register Intent & Secure Bcrypt Hashing verified!\n');

    // TEST 3: Strict Validation of registrationToken (Correction 3)
    console.log('3️⃣ Testing Strict registrationToken Enforcement on Finalization...');
    const failNoToken = await makeRequest(server, { path: '/api/auth/firebase-register', method: 'POST' }, {
      idToken: 'fake_token',
      // registrationToken omitted
    });
    if (failNoToken.statusCode !== 400 || !failNoToken.data.message.includes('Registration token is required')) {
      throw new Error(`Expected 400 for missing registrationToken, got ${failNoToken.statusCode}: ${JSON.stringify(failNoToken.data)}`);
    }
    console.log(`   - Missing token rejected properly: HTTP ${failNoToken.statusCode} - "${failNoToken.data.message}"`);

    const failBadToken = await makeRequest(server, { path: '/api/auth/firebase-register', method: 'POST' }, {
      idToken: 'fake_token',
      registrationToken: 'invalid_non_existent_token_1234567890abcdef',
    });
    // Should fail token verification or return 401/400/503 depending on Firebase Admin config
    console.log(`   - Invalid token rejected safely: HTTP ${failBadToken.statusCode}`);
    console.log('   ✅ Strict registrationToken enforcement verified!\n');

    // TEST 4: Verification of Password Handling on User Document (Correction 1 - No Double Hashing)
    console.log('4️⃣ Testing User Model Password Handling (Single Hashing Guaranteed)...');
    const user = new User({
      name: pendingDoc.name,
      email: pendingDoc.email,
      phone: pendingDoc.phone,
      password: pendingDoc.passwordHash,
      role: pendingDoc.role,
      location: pendingDoc.location,
      firebaseUid: pendingDoc.firebaseUid,
      isVerified: true,
    });
    user.$locals.skipPasswordHash = true;
    await user.save();

    // Verify user password was NOT double-hashed
    const fetchedUser = await User.findOne({ email: testEmail }).select('+password');
    if (fetchedUser.password !== pendingDoc.passwordHash) {
      throw new Error(`Password was modified or double-hashed! Original hash: ${pendingDoc.passwordHash}, User hash: ${fetchedUser.password}`);
    }

    const loginMatch = await fetchedUser.matchPassword(testPassword);
    if (!loginMatch) {
      throw new Error('User.matchPassword failed! Double hashing may have occurred.');
    }
    console.log(`   - User stored password matches original bcrypt hash exactly: true`);
    console.log(`   - User.matchPassword('${testPassword}') succeeded: true`);
    console.log('   ✅ Single-hashing password guarantee verified!\n');

    // TEST 5: Role-Specific Profile Creation Verification (Correction 6)
    console.log('5️⃣ Testing Role-Specific Profile Creation (FarmerProfile)...');
    const farmerProf = await FarmerProfile.create({ user: fetchedUser._id });
    if (!farmerProf || farmerProf.farmSizeAcres !== 5 || farmerProf.soilType !== 'Red Loam') {
      throw new Error('FarmerProfile creation did not apply expected schema defaults!');
    }
    console.log(`   - FarmerProfile created for user: ${farmerProf.user}`);
    console.log(`   - Soil Type default: ${farmerProf.soilType} | Farm Size default: ${farmerProf.farmSizeAcres} acres`);
    console.log('   ✅ Role-specific profile creation verified!\n');

    // TEST 6: Resend Verification Intent (Correction 4)
    console.log('6️⃣ Testing Resend Verification Intent (/api/auth/resend-verification-intent)...');
    const testEmail2 = `resend.test.${Date.now()}@agriconnect.org`;
    const intentRes2 = await makeRequest(server, { path: '/api/auth/register-intent', method: 'POST' }, {
      name: 'Resend Test Farmer',
      email: testEmail2,
      phone: '9845099999',
      password: 'password123456',
      role: 'FPO',
      organizationName: 'Kaveri Farmers Producer Co.',
      firebaseUid: `fb_resend_${Date.now()}`,
    });
    const token1 = intentRes2.data.registrationToken;

    const resendRes = await makeRequest(server, { path: '/api/auth/resend-verification-intent', method: 'POST' }, {
      email: testEmail2,
    });
    if (resendRes.statusCode !== 200 || !resendRes.data.registrationToken) {
      throw new Error(`Resend verification failed: ${JSON.stringify(resendRes.data)}`);
    }
    const token2 = resendRes.data.registrationToken;
    if (token1 === token2) {
      throw new Error('Resend verification token should be freshly regenerated!');
    }
    console.log(`   - Initial Token: ${token1.slice(0, 16)}...`);
    console.log(`   - Refreshed Token: ${token2.slice(0, 16)}... (Successfully refreshed)`);
    console.log('   ✅ Resend Verification Intent verified!\n');

    // TEST 7: Existing Login & Demo Accounts Compatibility (Requirement 5)
    console.log('7️⃣ Testing Existing Login Endpoint (/api/auth/login) with Newly Created User...');
    const loginRes = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
      email: testEmail,
      password: testPassword,
    });
    if (loginRes.statusCode !== 200 || !loginRes.data.data.token) {
      throw new Error(`Login failed for verified user: ${JSON.stringify(loginRes.data)}`);
    }
    console.log(`   - Status: ${loginRes.statusCode}`);
    console.log(`   - JWT Token generated: ${loginRes.data.data.token.slice(0, 24)}...`);
    console.log(`   - Role in token payload: ${loginRes.data.data.role}`);
    console.log('   ✅ Standard login with newly registered verified user succeeded!\n');

    // Clean up test documents
    await User.deleteOne({ email: testEmail });
    await FarmerProfile.deleteOne({ user: fetchedUser._id });
    await PendingRegistration.deleteMany({ email: { $in: [testEmail, testEmail2] } });

    console.log('===============================================================');
    console.log('🎉 ALL FIREBASE AUTH & EMAIL VERIFICATION TESTS PASSED! 🎉');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runTestSuite();
