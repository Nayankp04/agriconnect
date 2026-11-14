const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const FPOProfile = require('../models/FPOProfile');
const BuyerProfile = require('../models/BuyerProfile');
const LogisticsProfile = require('../models/LogisticsProfile');
const Otp = require('../models/Otp');
const PendingRegistration = require('../models/PendingRegistration');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail, verifyEmailService, maskEmail } = require('../utils/emailService');
const { verifyFirebaseIdToken } = require('../config/firebaseAdmin');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify your MongoDB Atlas IP Whitelist in Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { name, email, phone, password, role, location, organizationName, businessType, otp } = req.body;

    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const cleanOtp = String(otp).trim();
    const validOtp = await Otp.findOne({ email: normalizedEmail, otp: cleanOtp });
    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, clean up OTPs for this email so it cannot be used again
    await Otp.deleteMany({ email: normalizedEmail });

    const user = await User.create({
      name: name ? name.trim() : 'Agri Partner',
      email: normalizedEmail,
      phone: phone ? phone.trim() : '+91 9800000000',
      password: password || 'password123',
      role: role || 'FARMER',
      location: location && location.city ? location : { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
    });

    // Create role-specific profile safely (does not abort account creation if profile defaults fail)
    try {
      if (user.role === 'FARMER') {
        await FarmerProfile.create({ user: user._id });
      } else if (user.role === 'FPO') {
        await FPOProfile.create({
          user: user._id,
          fpoName: organizationName || `${name} Farmers Producer Co.`,
          registrationNumber: `REG-FPO-${Math.floor(100000 + Math.random() * 900000)}`,
          operatingRegions: [user.location?.district || 'Mysuru'],
        });
      } else if (user.role === 'BUYER') {
        await BuyerProfile.create({
          user: user._id,
          companyName: organizationName || `${name} Enterprises`,
          businessType: businessType || 'Supermarket',
        });
      } else if (user.role === 'LOGISTICS') {
        await LogisticsProfile.create({
          user: user._id,
          companyName: organizationName || `${name} Logistics Services`,
          operatingRegions: [user.location?.district || 'Mysuru'],
        });
      }
    } catch (profileErr) {
      console.warn(`[Auth] Note: Initial profile creation for ${user.role} deferred:`, profileErr.message);
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        isVerified: user.isVerified,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify your MongoDB Atlas IP Whitelist in Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      // Check if registration is pending email verification
      const pending = await PendingRegistration.findOne({ email: normalizedEmail });
      if (pending) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_VERIFICATION_PENDING',
          message: 'Your account is pending email verification. Please check your inbox for the verification link.',
          pending: true,
          email: normalizedEmail,
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Authentication failed' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'FARMER') {
      profile = await FarmerProfile.findOne({ user: user._id });
    } else if (user.role === 'FPO') {
      profile = await FPOProfile.findOne({ user: user._id });
    } else if (user.role === 'BUYER') {
      profile = await BuyerProfile.findOne({ user: user._id });
    } else if (user.role === 'LOGISTICS') {
      profile = await LogisticsProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const { name, phone, location, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (profileImage) user.profileImage = profileImage;
    if (location) {
      user.location = {
        city: location.city || user.location?.city || 'Mysuru',
        district: location.district || user.location?.district || 'Mysuru',
        state: location.state || user.location?.state || 'Karnataka',
        address: location.address !== undefined ? location.address : user.location?.address || '',
        pincode: location.pincode !== undefined ? location.pincode : user.location?.pincode || '',
      };
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (Admin/utility)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to email via Resend HTTPS API
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please verify that your IP is whitelisted in MongoDB Atlas Network Access.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Attempt actual Resend HTTPS email delivery FIRST
    // Only proceed to store OTP and return success if Resend confirms delivery with a valid ID
    let emailResult;
    try {
      emailResult = await sendOtpEmail({
        to: normalizedEmail,
        otp: generatedOtp,
        userName: name || 'Farmer / Agri Partner',
      });
    } catch (deliveryError) {
      console.error(`[Auth] ⚠️ OTP delivery notice for ${maskEmail(normalizedEmail)}:`, deliveryError.message);

      // In local dev mode when RESEND_API_KEY is not yet configured, provide mock OTP so registration testing can proceed
      if (deliveryError.code === 'RESEND_NOT_CONFIGURED' || !process.env.RESEND_API_KEY) {
        console.log(`[Auth] 💡 [DEV MODE OTP]: Verification code for ${normalizedEmail} is: ${generatedOtp}`);
        await Otp.deleteMany({ email: normalizedEmail });
        await Otp.create({
          email: normalizedEmail,
          otp: generatedOtp,
        });

        return res.status(200).json({
          success: true,
          message: `Dev Mode: OTP generated successfully! Your verification code is ${generatedOtp}`,
          devOtp: generatedOtp,
          data: {
            devMode: true,
            otp: generatedOtp,
          },
        });
      }

      // Live delivery failure from Resend
      let clientMsg = deliveryError.message || 'Failed to deliver OTP email. Please try again.';
      if (deliveryError.statusCode === 401 || deliveryError.message?.includes('API key')) {
        clientMsg = 'Email service authentication failed. Please verify RESEND_API_KEY in backend configuration.';
      } else if (deliveryError.statusCode === 403 || deliveryError.message?.includes('domain')) {
        clientMsg = 'Email domain not verified or sender address rejected by Resend. Verify RESEND_FROM_EMAIL settings.';
      } else if (deliveryError.statusCode === 429) {
        clientMsg = 'Email rate limit exceeded. Please wait a minute and try again.';
      }

      return res.status(503).json({
        success: false,
        message: clientMsg,
        code: deliveryError.code || 'EMAIL_DELIVERY_FAILED',
      });
    }

    // 2. Clear any prior unexpired OTPs for this email and store the fresh OTP
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({
      email: normalizedEmail,
      otp: generatedOtp,
    });

    console.log(`[Auth] ✅ OTP email dispatched successfully to ${maskEmail(normalizedEmail)} (Resend ID: ${emailResult.messageId})`);

    // 3. Return confirmed success response to the client
    res.status(200).json({
      success: true,
      message: 'Verification OTP has been sent successfully to your email address.',
      data: {
        messageId: emailResult.messageId,
      },
    });
  } catch (error) {
    console.error('[Auth] Unexpected error in sendOtp:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for creating role profile records safely
async function createRoleProfileRecord(user, profileData, options = {}) {
  try {
    if (user.role === 'FARMER') {
      await FarmerProfile.create([{ user: user._id }], options);
    } else if (user.role === 'FPO') {
      await FPOProfile.create(
        [
          {
            user: user._id,
            fpoName: profileData.organizationName || `${user.name} Farmers Producer Co.`,
            registrationNumber: `REG-FPO-${Math.floor(100000 + Math.random() * 900000)}`,
            operatingRegions: [user.location?.district || 'Mysuru'],
          },
        ],
        options
      );
    } else if (user.role === 'BUYER') {
      await BuyerProfile.create(
        [
          {
            user: user._id,
            companyName: profileData.organizationName || `${user.name} Enterprises`,
            businessType: profileData.businessType || 'Supermarket',
          },
        ],
        options
      );
    } else if (user.role === 'LOGISTICS') {
      await LogisticsProfile.create(
        [
          {
            user: user._id,
            companyName: profileData.organizationName || `${user.name} Logistics Services`,
            operatingRegions: [user.location?.district || 'Mysuru'],
          },
        ],
        options
      );
    }
  } catch (profileErr) {
    console.warn(`[Auth] Note: Initial profile creation for ${user.role} deferred:`, profileErr.message);
  }
}

// @desc    Check if an email address is already taken in MongoDB
// @route   GET /api/auth/check-email
// @access  Public
const checkEmailAvailability = async (req, res) => {
  try {
    const email = req.query.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email parameter is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    res.json({
      success: true,
      available: !userExists,
      message: userExists ? 'Email address is already registered' : 'Email address is available',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a secure pending registration intent before Firebase email verification
// @route   POST /api/auth/register-intent
// @access  Public
const createRegisterIntent = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { name, email, phone, password, role, organizationName, businessType, location, firebaseUid } = req.body;

    if (!email || !password || !name || !phone || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, password, firebaseUid).',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in MongoDB
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address. Please log in.',
      });
    }

    // Hash the password with bcrypt (Plaintext password is NEVER stored in database)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate a 256-bit cryptographically secure registration token
    const registrationToken = crypto.randomBytes(32).toString('hex');

    // Upsert into PendingRegistration collection
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        registrationToken,
        email: normalizedEmail,
        firebaseUid: String(firebaseUid).trim(),
        passwordHash,
        name: name.trim(),
        phone: phone.trim(),
        role: role || 'FARMER',
        organizationName: organizationName ? organizationName.trim() : '',
        businessType: businessType || 'Supermarket',
        location: location && location.city ? location : { city: 'Mysuru', district: 'Mysuru', state: 'Karnataka' },
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Auth] 📝 Registered pending intent for ${maskEmail(normalizedEmail)} (Role: ${role || 'FARMER'})`);

    res.status(200).json({
      success: true,
      registrationToken,
      message: 'Registration intent recorded securely. Awaiting email verification.',
    });
  } catch (error) {
    console.error('[Auth] Registration intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Finalize registration using verified Firebase ID token and registrationToken
// @route   POST /api/auth/firebase-register
// @access  Public
const registerWithFirebaseToken = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable.',
        code: 'DATABASE_UNAVAILABLE',
      });
    }

    const { idToken, registrationToken } = req.body;

    // Strict validation: registrationToken is mandatory
    if (!registrationToken || typeof registrationToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required to finalize registration.',
      });
    }

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required to finalize registration.',
      });
    }

    // 1. Verify Firebase ID Token securely using Firebase Admin SDK
    const decodedToken = await verifyFirebaseIdToken(idToken);

    // 2. Cryptographic assertion: Email MUST be verified by Firebase
    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address has not been verified yet. Please check your inbox and click the verification link.',
      });
    }

    const verifiedEmail = decodedToken.email ? decodedToken.email.toLowerCase().trim() : '';
    if (!verifiedEmail) {
      return res.status(400).json({
        success: false,
        message: 'No verified email found in the provided authentication token.',
      });
    }

    // 3. Strict lookup by registrationToken AND verified email
    const pending = await PendingRegistration.findOne({
      registrationToken,
      email: verifiedEmail,
    });

    if (!pending) {
      // Check if user account was already finalized previously (idempotent return)
      const existingUser = await User.findOne({ email: verifiedEmail });
      if (existingUser) {
        const token = generateToken(existingUser._id, existingUser.role);
        return res.status(200).json({
          success: true,
          message: 'Account is already verified and registered.',
          data: {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            role: existingUser.role,
            location: existingUser.location,
            isVerified: existingUser.isVerified,
            token,
          },
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired registration token. Please initiate registration again.',
        code: 'INVALID_REGISTRATION_TOKEN',
      });
    }

    // 4. Create User and Role Profile (Ensuring PendingRegistration is NOT deleted before success)
    let createdUser = null;
    const session = await mongoose.startSession();
    let usedTransaction = false;

    try {
      session.startTransaction();

      const user = new User({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        password: pending.passwordHash,
        role: pending.role,
        location: pending.location,
        firebaseUid: decodedToken.uid,
        isVerified: true,
      });

      // Pass skipPasswordHash flag so pre-hashed password is saved exactly once without double-hashing
      user.$locals.skipPasswordHash = true;
      await user.save({ session });

      await createRoleProfileRecord(user, pending, { session });

      // Atomically remove PendingRegistration inside the same transaction
      await PendingRegistration.deleteOne({ _id: pending._id }, { session });

      await session.commitTransaction();
      usedTransaction = true;
      createdUser = user;
    } catch (txError) {
      await session.abortTransaction();

      // If standalone MongoDB does not support transactions, use sequenced creation with compensation
      const msg = txError.message || '';
      if (!usedTransaction && (msg.includes('replica set') || msg.includes('Transaction numbers') || msg.includes('transactions are not supported'))) {
        const user = new User({
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          password: pending.passwordHash,
          role: pending.role,
          location: pending.location,
          firebaseUid: decodedToken.uid,
          isVerified: true,
        });

        user.$locals.skipPasswordHash = true;
        await user.save();

        await createRoleProfileRecord(user, pending);

        // ONLY delete PendingRegistration after User and Role Profile creation succeeded
        await PendingRegistration.deleteOne({ _id: pending._id });
        createdUser = user;
      } else {
        throw txError;
      }
    } finally {
      session.endSession();
    }

    console.log(`[Auth] 🎉 Verified and registered user ${maskEmail(createdUser.email)} as ${createdUser.role}`);

    const token = generateToken(createdUser._id, createdUser.role);

    res.status(201).json({
      success: true,
      message: 'Email verified and account registered successfully.',
      data: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        location: createdUser.location,
        isVerified: createdUser.isVerified,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth] Error finalizing Firebase registration:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

// @desc    Refresh or generate a new registrationToken for resending email verification
// @route   POST /api/auth/resend-verification-intent
// @access  Public
const resendVerificationIntent = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists and is verified in User collection
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_REGISTERED',
        message: 'Account is already verified and active. Please log in.',
      });
    }

    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({
        success: false,
        code: 'NO_PENDING_REGISTRATION',
        message: 'No pending registration found for this email. Please register again.',
      });
    }

    // Refresh with a fresh cryptographically secure registration token
    const newRegistrationToken = crypto.randomBytes(32).toString('hex');
    pending.registrationToken = newRegistrationToken;
    pending.createdAt = new Date(); // Resets 24h TTL
    await pending.save();

    console.log(`[Auth] 🔄 Refreshed verification token for ${maskEmail(normalizedEmail)}`);

    res.json({
      success: true,
      registrationToken: newRegistrationToken,
      message: 'Fresh verification link generated.',
    });
  } catch (error) {
    console.error('[Auth] Error in resendVerificationIntent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Email service configuration (Resend HTTPS)
// @route   GET /api/auth/smtp-status and /api/auth/email-status
// @access  Public / Diagnostic
const checkSmtpStatus = async (req, res) => {
  try {
    const status = await verifyEmailService();
    res.status(status.success ? 200 : 503).json(status);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
