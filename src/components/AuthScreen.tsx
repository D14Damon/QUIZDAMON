import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  auth, 
  googleProvider 
} from '../lib/firebase';
import { saveUserProfile } from '../lib/userService';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        // Ensure user document exists in Firestore
        await saveUserProfile(res.user.uid, {
          displayName: res.user.displayName || res.user.email?.split('@')[0] || 'Creator',
          email: res.user.email || undefined,
          photoBase64: res.user.photoURL || undefined,
        });
      }
      onAuthSuccess?.();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Failed to connect with Google. Please check your credentials or try email login.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isSignUp) {
        if (!name.trim()) {
          setError('Please provide your name to create an account.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save initial user profile
        if (userCredential.user) {
          await saveUserProfile(userCredential.user.uid, {
            displayName: name.trim(),
            email: userCredential.user.email || undefined,
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      onAuthSuccess?.();
    } catch (err: any) {
      console.error('Email auth error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
      onAuthSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pattern-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white shadow-lg mx-auto mb-2 border border-zinc-700">
            <Sparkles className="w-7 h-7 text-amber-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight font-modern">
            𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩
          </h1>

          <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
            Welcome to the aesthetic quiz & assessment studio. Sign in or create an account to access your creator dashboard.
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-200/80 p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-2xl text-xs font-bold text-zinc-600">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-zinc-900 shadow-xs' 
                  : 'hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-zinc-900 shadow-xs' 
                  : 'hover:text-zinc-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
              {error}
            </div>
          )}

          {/* Primary Connect With Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 text-sm font-semibold rounded-2xl shadow-xs transition-all disabled:opacity-60 cursor-pointer hover:border-zinc-400"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Connect with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold absolute">
              or email & password
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Full Name / Creator Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Damon Rivera"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩 Account' : 'Sign In to 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick guest fallback */}
          <div className="pt-2 border-t border-zinc-100 text-center">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Or continue with Instant Guest Creator Mode</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Accounts & quizzes secured in your personal Firebase space</span>
        </div>
      </div>
    </div>
  );
};
