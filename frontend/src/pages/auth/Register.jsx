import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase';
import { checkEmailAvailability, createRegisterIntent, resendVerificationIntent } from '../../services/authService';
import { Sprout, UserCheck, AlertCircle, Mail, CheckCircle2, RefreshCw } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('FARMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('Mysuru');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setResendMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !password || !cleanName || !cleanPhone) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Pre-flight check: Verify email is not already taken in MongoDB User collection
      const checkRes = await checkEmailAvailability(cleanEmail);
      if (!checkRes.available) {
        setError('An account with this email address is already registered. Please log in.');
        setSubmitting(false);
        return;
      }

      // 2. Create or resume existing unverified Firebase user account (Correction 4)
      let fbUser = null;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = userCred.user;
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use') {
          // Account already exists in Firebase. Check if it is unverified
          try {
            const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
            fbUser = signInCred.user;
            if (fbUser.emailVerified) {
              setError('This email is already verified. Please sign in directly from the login page.');
              setSubmitting(false);
              return;
            }
          } catch (signInErr) {
            setError('An account with this email exists in Firebase. Please sign in with your original password or reset it.');
            setSubmitting(false);
            return;
          }
        } else {
          throw fbErr;
        }
      }

      if (!fbUser) {
        throw new Error('Could not establish Firebase identity.');
      }

      // 3. Record pending registration intent with backend (generates cryptographic registrationToken)
      const intentRes = await createRegisterIntent({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password, // Backend encrypts with bcrypt (salt rounds = 10) immediately
        role,
        organizationName: organizationName.trim(),
        businessType: 'Supermarket',
        location: { city, district: city, state: 'Karnataka' },
        firebaseUid: fbUser.uid,
      });

      const regToken = intentRes.registrationToken;
      sessionStorage.setItem('agriconnect_reg_token', regToken);

      // 4. Send Firebase Email Verification Link with actionCodeSettings
      const returnUrl = `${window.location.origin}/verify-email?regToken=${regToken}`;
      await sendEmailVerification(fbUser, {
        url: returnUrl,
        handleCodeInApp: true,
      });

      setVerificationSent(true);
      startCooldown();
    } catch (err) {
      console.error('[Register] Registration error:', err);
      let clientMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      if (err.code === 'auth/invalid-email') {
        clientMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        clientMsg = 'Password is too weak. Please choose a stronger password.';
      }
      setError(clientMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setResendMessage('');
    setError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      let fbUser = auth.currentUser;

      if (!fbUser || fbUser.email.toLowerCase() !== cleanEmail) {
        const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = signInCred.user;
      }

      // Refresh registrationToken on backend
      const intentRes = await resendVerificationIntent(cleanEmail);
      const freshToken = intentRes.registrationToken;
      sessionStorage.setItem('agriconnect_reg_token', freshToken);

      const returnUrl = `${window.location.origin}/verify-email?regToken=${freshToken}`;
      await sendEmailVerification(fbUser, {
        url: returnUrl,
        handleCodeInApp: true,
      });

      setResendMessage('A fresh verification link has been sent to your email.');
      startCooldown();
    } catch (err) {
      console.error('[Register] Resend error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Real Farming Land Background Image */}
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80"
        alt="Real Farming Land Backdrop"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl relative z-10 bg-white/95 backdrop-blur-xl">
        {/* Left Side: Real Farming Land Showcase */}
        <div className="relative hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-agri-900/90 to-slate-950/90 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"
            alt="Real Farming Land"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-agri-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black leading-tight">
              Join 250+ Farmers & FPOs on AgriConnect
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sell crops directly, eliminate middlemen, and access aggregated bulk contracts across Karnataka.
            </p>
          </div>

          <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs space-y-1">
            <span className="text-[10px] font-extrabold text-agri-300 uppercase tracking-widest block">Direct Advantage</span>
            <p className="font-bold">Transparent Prices | 0% Commission | GPS Logistics Dispatch</p>
          </div>
        </div>

        {/* Right Side: Form or Verification Pending Screen */}
        <div className="p-8 space-y-6">
          {!verificationSent ? (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Create Account</h2>
                <p className="text-xs text-slate-500">Register as Farmer, FPO, Buyer or Logistics Partner</p>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                {['FARMER', 'FPO', 'BUYER', 'LOGISTICS'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-xl transition-all ${
                      role === r ? 'bg-agri-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleRegister}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Basavaraj Gowda"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                  />
                </div>

                {(role === 'FPO' || role === 'BUYER' || role === 'LOGISTICS') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Company Name</label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={role === 'FPO' ? 'e.g. Mysuru Farmers Producer Co.' : 'e.g. FreshToHome Foods'}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9845012345"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create password (min 6 chars)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                    >
                      <option value="Mysuru">Mysuru</option>
                      <option value="Mandya">Mandya</option>
                      <option value="Hassan">Hassan</option>
                      <option value="Kodagu">Kodagu</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Chamarajanagar">Chamarajanagar</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-agri-700 to-emerald-700 hover:from-agri-800 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  <UserCheck className="w-4 h-4" />
                  {submitting ? 'Creating Account & Sending Link...' : `Register as ${role}`}
                </button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-agri-700 hover:underline">
                  Log in here
                </Link>
              </div>
            </>
          ) : (
            /* Verification Link Sent State */
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Mail className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">Check Your Email</h2>
                <p className="text-xs text-slate-600">
                  We've sent a verification link to:
                </p>
                <p className="text-sm font-extrabold text-agri-800 bg-agri-50 py-1.5 px-3 rounded-lg inline-block border border-agri-200">
                  {email}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-2 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Next Steps for Instant Activation:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 pl-1 leading-relaxed">
                  <li>Open your email inbox (or check spam/promotions folder).</li>
                  <li>Click on the <strong>verification link</strong> sent by Firebase Auth.</li>
                  <li>You will be redirected back to AgriConnect and your <strong>{role}</strong> dashboard will be activated.</li>
                </ol>
              </div>

              {resendMessage && (
                <div className="p-3 bg-emerald-100/60 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold">
                  {resendMessage}
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  disabled={resending || resendCooldown > 0}
                  onClick={handleResendLink}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resending
                    ? 'Resending Link...'
                    : resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Verification Link'}
                </button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVerificationSent(false)}
                    className="text-slate-500 hover:text-slate-800 font-medium"
                  >
                    ← Edit Registration Info
                  </button>
                  <Link to="/login" className="font-bold text-agri-700 hover:underline">
                    Proceed to Login →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
