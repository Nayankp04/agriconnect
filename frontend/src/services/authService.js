import API from './api';

export const loginUser = async (credentials) => {
  const res = await API.post('/auth/login', credentials);
  return res.data;
};

export const registerUser = async (userData) => {
  const res = await API.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await API.get('/auth/me');
  return res.data;
};

export const sendOtp = async (email) => {
  const res = await API.post('/auth/send-otp', { email });
  return res.data;
};

// Check if an email is available in MongoDB before registering
export const checkEmailAvailability = async (email) => {
  const res = await API.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
  return res.data;
};

// Save a secure registration intent before Firebase sends verification email
export const createRegisterIntent = async (data) => {
  const res = await API.post('/auth/register-intent', data);
  return res.data;
};

// Finalize registration using verified Firebase ID token and registrationToken
export const verifyFirebaseRegistration = async ({ idToken, registrationToken }) => {
  const res = await API.post('/auth/firebase-register', { idToken, registrationToken });
  return res.data;
};

// Refresh or generate fresh registrationToken for resending verification link
export const resendVerificationIntent = async (email) => {
  const res = await API.post('/auth/resend-verification-intent', { email });
  return res.data;
};
