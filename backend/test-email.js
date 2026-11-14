/**
 * Comprehensive Automated Test Suite for AgriConnect Email & OTP Verification (Resend HTTPS)
 *
 * Verifies:
 * 1. Environment & Configuration (RESEND_API_KEY, RESEND_FROM_EMAIL, getSenderEmail, maskEmail)
 * 2. Service Verification over HTTPS (verifyEmailService / checkSmtpStatus)
 * 3. Failure Handling & Security:
 *    - Rejection by Resend returns 503
 *    - OTP is NEVER stored in database when delivery fails
 *    - Success is NEVER falsely reported
 * 4. Dev Mode fallback when RESEND_API_KEY is not set
 * 5. Full End-to-End Registration Lifecycle with verified OTP:
 *    - Dispatch OTP via /api/auth/send-otp
 *    - Verify OTP in database
 *    - Register account via /api/auth/register with valid OTP
 *    - Replay protection: OTP cannot be reused after registration
 *    - Invalid OTP rejection
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/config.env') });
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');
const Otp = require('./models/Otp');
const User = require('./models/User');
const { sendOtpEmail, verifyEmailService, maskEmail, getSenderEmail } = require('./utils/emailService');

async function runEmailTests() {
  console.log('===============================================================');
  console.log('âœ‰ï¸  AGRICONNECT EMAIL SERVICE (RESEND HTTPS) TEST SUITE  âœ‰ï¸');
  console.log('===============================================================\n');

  // Connect to Database
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(8096, resolve));
  const baseUrl = 'http://localhost:8096/api/auth';

  try {
    // -------------------------------------------------------------------------
    // Test 1: Configuration & Masking Utilities
    // -------------------------------------------------------------------------
    console.log('1ï¸âƒ£ Checking Resend Configuration & Safe Masking Utilities...');
    const sender = getSenderEmail();
    console.log('   - Configured Sender (RESEND_FROM_EMAIL):', sender);
    if (!sender || !sender.includes('@')) {
      throw new Error('Invalid sender email format from getSenderEmail()');
    }

    const testMask1 = maskEmail('nayankp987@gmail.com');
    const testMask2 = maskEmail('farmer.shanthappa@agriconnect.in');
    console.log('   - Masking nayankp987@gmail.com ->', testMask1);
    console.log('   - Masking farmer.shanthappa@agriconnect.in ->', testMask2);

    if (testMask1.includes('nayankp987') || testMask2.includes('shanthappa')) {
      throw new Error('maskEmail failed: complete username leaked in masked output');
    }
    console.log('   âœ… Configuration & masking utilities verified!\n');

    // -------------------------------------------------------------------------
    // Test 2: Resend Email Service Status Check (/api/auth/email-status)
    // -------------------------------------------------------------------------
    console.log('2ï¸âƒ£ Testing Email Service Diagnostic Endpoint (/api/auth/email-status)...');
    const statusRes = await fetch(`${baseUrl}/email-status`);
    const statusData = await statusRes.json();
    console.log('   - HTTP Status:', statusRes.status);
    console.log('   - Provider:', statusData.provider);
    console.log('   - Message:', statusData.message);
    console.log('   - From Email:', statusData.fromEmail);

    if (statusData.provider !== 'Resend (HTTPS API)') {
      throw new Error(`Expected provider 'Resend (HTTPS API)', got '${statusData.provider}'`);
    }

    // Also check backwards compatibility route /api/auth/smtp-status
    const legacyRes = await fetch(`${baseUrl}/smtp-status`);
    const legacyData = await legacyRes.json();
    if (legacyData.provider !== 'Resend (HTTPS API)') {
      throw new Error(`Legacy /smtp-status did not route to Resend provider`);
    }
    console.log('   âœ… Email service diagnostic routes verified over HTTPS!\n');

    // -------------------------------------------------------------------------
    // Test 3: Failure Handling with Invalid Resend API Key
    // -------------------------------------------------------------------------
    console.log('3ï¸âƒ£ Testing Failure Handling: Ensure backend returns 503 and does NOT save OTP when Resend rejects...');
    const originalApiKey = process.env.RESEND_API_KEY;
    const testFarmerEmail = `farmer.reject.${Date.now()}@gmail.com`;

    // Force invalid API key to trigger Resend 401 error
    process.env.RESEND_API_KEY = 're_invalid_test_key_for_rejection_test_12345';

    try {
      const failRes = await fetch(`${baseUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testFarmerEmail, name: 'Test Farmer' }),
      });

      const failData = await failRes.json();
      console.log('   - HTTP Status:', failRes.status);
      console.log('   - Success Flag:', failData.success);
      console.log('   - Server Message:', failData.message);

      // Verify database state: OTP MUST NOT exist in MongoDB if Resend rejected delivery
      const storedOtp = await Otp.findOne({ email: testFarmerEmail });
      console.log('   - OTP in MongoDB:', storedOtp ? 'FOUND (ERROR: should not exist!)' : 'NONE (CORRECT)');

      if (failData.success === true) {
        throw new Error('TEST FAILED: Backend returned success: true when Resend rejected email!');
      }
      if (failRes.status !== 503) {
        throw new Error(`TEST FAILED: Expected HTTP 503 on email rejection, got ${failRes.status}`);
      }
      if (storedOtp) {
        throw new Error('TEST FAILED: Backend stored OTP in database despite email delivery failure!');
      }
      console.log('   âœ… Backend properly returned 503 and prevented false OTP storage!\n');
    } finally {
      process.env.RESEND_API_KEY = originalApiKey;
    }

    // -------------------------------------------------------------------------
    // Test 4: Dev Mode Fallback when RESEND_API_KEY is not configured
    // -------------------------------------------------------------------------
    console.log('4ï¸âƒ£ Testing Dev Mode Fallback (when RESEND_API_KEY is absent)...');
    process.env.RESEND_API_KEY = '';
    const devTestEmail = `dev.farmer.${Date.now()}@gmail.com`;

    try {
      const devRes = await fetch(`${baseUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devTestEmail, name: 'Dev Farmer' }),
      });

      const devData = await devRes.json();
      console.log('   - HTTP Status:', devRes.status);
      console.log('   - Success Flag:', devData.success);
      console.log('   - Dev OTP:', devData.devOtp);

      if (devRes.status !== 200 || !devData.success || !devData.devOtp) {
        throw new Error('Dev mode fallback failed to generate OTP');
      }

      const devStoredOtp = await Otp.findOne({ email: devTestEmail });
      console.log('   - Dev OTP in MongoDB:', Boolean(devStoredOtp), '| OTP:', devStoredOtp?.otp);
      if (!devStoredOtp || devStoredOtp.otp !== devData.devOtp) {
        throw new Error('Dev OTP was not saved in MongoDB for registration');
      }
      console.log('   âœ… Dev Mode fallback correctly generated and saved OTP!\n');
    } finally {
      process.env.RESEND_API_KEY = originalApiKey;
    }

    // -------------------------------------------------------------------------
    // Test 5: Full Registration Lifecycle with OTP Verification
    // -------------------------------------------------------------------------
    console.log('5ï¸âƒ£ Testing Full End-to-End Registration Lifecycle with OTP verification...');
    const registerEmail = `newfarmer.${Date.now()}@agriconnect.in`;
    const mockOtp = '849201';

    // Seed valid OTP in database (as send-otp does after confirmed delivery)
    await Otp.deleteMany({ email: registerEmail });
    await Otp.create({ email: registerEmail, otp: mockOtp });

    // 5A: Attempt registration with WRONG OTP -> Expect 400
    console.log('   - Submitting registration with incorrect OTP (000000)...');
    const wrongOtpRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Gowda',
        email: registerEmail,
        password: 'password123',
        role: 'FARMER',
        otp: '000000',
      }),
    });
    const wrongOtpData = await wrongOtpRes.json();
    console.log('     Status:', wrongOtpRes.status, '| Message:', wrongOtpData.message);
    if (wrongOtpRes.status !== 400 || wrongOtpData.success) {
      throw new Error('Registration allowed invalid OTP');
    }

    // 5B: Attempt registration with CORRECT OTP -> Expect 201/200
    console.log('   - Submitting registration with verified OTP (849201)...');
    const validRegisterRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Gowda',
        email: registerEmail,
        password: 'password123',
        role: 'FARMER',
        otp: mockOtp,
      }),
    });
    const validRegisterData = await validRegisterRes.json();
    console.log('     Status:', validRegisterRes.status, '| Success:', validRegisterData.success, '| User:', validRegisterData.data?.name);
    if (validRegisterRes.status !== 201 && validRegisterRes.status !== 200) {
      throw new Error('Registration failed with valid OTP: ' + validRegisterData.message);
    }

    // 5C: Replay protection: Check that OTP was destroyed and cannot be reused
    console.log('   - Verifying OTP replay protection (OTP must be deleted from DB)...');
    const remainingOtp = await Otp.findOne({ email: registerEmail });
    console.log('     Remaining OTP in MongoDB:', remainingOtp ? 'FOUND (ERROR: replay possible!)' : 'NONE (CORRECT)');
    if (remainingOtp) {
      throw new Error('OTP was not deleted after successful registration (replay vulnerability)');
    }

    // Clean up test user
    await User.deleteMany({ email: registerEmail });
    await Otp.deleteMany({ email: registerEmail });
    console.log('   âœ… Full Registration Lifecycle & OTP Replay Protection Verified!\n');

    console.log('===============================================================');
    console.log('ðŸŽ‰ ALL RESEND EMAIL & OTP VERIFICATION TESTS PASSED! ðŸŽ‰');
    console.log('===============================================================');

  } catch (err) {
    console.error('âŒ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runEmailTests();
