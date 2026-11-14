const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getUsers,
  sendOtp,
  checkSmtpStatus,
  checkEmailAvailability,
  createRegisterIntent,
  registerWithFirebaseToken,
  resendVerificationIntent,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Firebase Email Verification Registration Routes
router.get('/check-email', checkEmailAvailability);
router.post('/register-intent', createRegisterIntent);
router.post('/firebase-register', registerWithFirebaseToken);
router.post('/resend-verification-intent', resendVerificationIntent);

// Core Authentication & Diagnostic Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.get('/email-status', checkSmtpStatus);
router.get('/smtp-status', checkSmtpStatus);
router.route('/me')
  .get(protect, getMe)
  .put(protect, updateMe);
router.get('/users', protect, authorize('ADMIN'), getUsers);

module.exports = router;
