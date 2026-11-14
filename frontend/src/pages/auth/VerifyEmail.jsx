import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { resendVerificationIntent } from '../../services/authService';
import { Sprout, CheckCircle2, AlertCircle, RefreshCw, LogIn, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { finalizeRegistrationWithToken } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | error | expired | needs_login
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendPassword, setResendPassword] = useState('');

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const regTokenParam = searchParams.get('regToken') || sessionStorage.getItem('agriconnect_reg_token') || '';

  useEffect(() => {
    let isMounted = true;

    const processVerification = async () => {
      try {
        // 1. If an oobCode action code is provided by Firebase in the link, apply it
        if (oobCode) {
          try {
            await applyActionCode(auth, oobCode);
            console.log('[VerifyEmail] ✅ Firebase action code successfully applied');
          } catch (codeErr) {
            console.warn('[VerifyEmail] Action code warning:', codeErr.code);
            if (codeErr.code === 'auth/expired-action-code') {
              if (isMounted) {
                setStatus('expired');
                setErrorMessage('This email verification link has expired. Please request a new verification link.');
              }
              return;
            }
            if (codeErr.code === 'auth/invalid-action-code') {
              // Code might already be applied or invalid
              console.log('[VerifyEmail] Code already used or invalid. Checking current auth status...');
            }
          }
        }

        // 2. Check current authenticated user in Firebase client
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();

          if (currentUser.emailVerified) {
            const idToken = await currentUser.getIdToken(true);
            const tokenToUse = regTokenParam;

            if (tokenToUse) {
              try {
                await finalizeRegistrationWithToken({
                  idToken,
                  registrationToken: tokenToUse,
                });
                sessionStorage.removeItem('agriconnect_reg_token');
                if (isMounted) {
                  setStatus('success');
                  setTimeout(() => navigate('/dashboard'), 2500);
                }
                return;
              } catch (regErr) {
                console.error('[VerifyEmail] Finalization error:', regErr);
                if (isMounted) {
                  setStatus('error');
                  setErrorMessage(regErr.response?.data?.message || regErr.message || 'Failed to complete registration.');
                }
                return;
              }
            } else {
              // User verified in Firebase but regToken not in this browser session (e.g. cross-device)
              if (isMounted) {
                setStatus('needs_login');
              }
              return;
            }
          }
        }

        // 3. If no user is signed in to Firebase in this tab (e.g. user clicked link in mobile email app)
        if (isMounted) {
          setStatus('needs_login');
        }
      } catch (err) {
        console.error('[VerifyEmail] General error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'An unexpected error occurred during email verification.');
        }
      }
    };

    processVerification();

    return () => {
      isMounted = false;
    };
  }, [oobCode, regTokenParam, finalizeRegistrationWithToken, navigate]);

  const handleResendLink = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendPassword) {
      setErrorMessage('Please enter both your registered email and password to resend the link.');
      return;
    }
    setResending(true);
    setResendStatus('');
    setErrorMessage('');

    try {
      // 1. Sign in to existing Firebase account without creating a duplicate
      const userCred = await signInWithEmailAndPassword(auth, resendEmail.trim(), resendPassword);
      const fbUser = userCred.user;

      if (fbUser.emailVerified) {
        setResendStatus('Your email is already verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      // 2. Request a refreshed registrationToken from backend
      const intentRes = await resendVerificationIntent(resendEmail.trim());
      const freshToken = intentRes.registrationToken;
      sessionStorage.setItem('agriconnect_reg_token', freshToken);

      // 3. Dispatch fresh Firebase verification email
      const returnUrl = `${window.location.origin}/verify-email?regToken=${freshToken}`;
      await sendEmailVerification(fbUser, {
        url: returnUrl,
        handleCodeInApp: true,
      });

      setResendStatus('Fresh verification link dispatched! Please check your email inbox or spam folder.');
    } catch (resendErr) {
      console.error('[VerifyEmail] Resend error:', resendErr);
      setErrorMessage(resendErr.response?.data?.message || resendErr.message || 'Failed to resend verification link.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80"
        alt="Real Farming Land Backdrop"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90"></div>

      <div className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-agri-700 to-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-agri-600/30">
          <Sprout className="w-8 h-8" />
        </div>

        {status === 'verifying' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Verifying Your Email...</h2>
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="w-8 h-8 text-agri-600 animate-spin" />
            </div>
            <p className="text-xs text-slate-500">
              Please wait while we verify your agricultural credentials and prepare your portal.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Email Verified!</h2>
            <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              Your AgriConnect account has been activated successfully. Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {status === 'needs_login' && (
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-agri-100 text-agri-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Email Verified!</h2>
              <p className="text-xs text-slate-500">
                Sign in with your email and password to complete setup and open your dashboard.
              </p>
            </div>
            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-agri-700 to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:from-agri-800 hover:to-emerald-800 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Go to Sign In Page
              </Link>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'expired') && (
          <div className="space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {status === 'expired' ? 'Link Expired' : 'Verification Issue'}
              </h2>
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                {errorMessage || 'This verification link is invalid or has expired.'}
              </p>
            </div>

            {resendStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold rounded-xl text-center">
                {resendStatus}
              </div>
            )}

            <form onSubmit={handleResendLink} className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block text-center">
                Resend Verification Link
              </span>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={resendPassword}
                  onChange={(e) => setResendPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {resending ? 'Sending New Link...' : 'Send Fresh Verification Link'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <Link to="/register" className="text-xs font-bold text-agri-700 hover:underline">
                Back to Registration
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

