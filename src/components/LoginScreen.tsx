import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bike as BikeIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  UserPlus, 
  User, 
  Building, 
  Mail, 
  Info,
  Database
} from 'lucide-react';
import { FirebaseConfigModal } from './FirebaseConfigModal';
import { getActiveFirebaseConfig } from '../../lib/firebase';

export const LoginScreen: React.FC = () => {
  const { signIn, registerAccount, authNotice, clearAuthNotice } = useAuth();
  const { config: activeConfig, isCustom } = getActiveFirebaseConfig();

  // Mode: Sign In or Create Account
  const [isRegistering, setIsRegistering] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatAuthError = (err: unknown): string => {
    if (!(err instanceof Error)) return 'An unexpected error occurred. Please try again.';
    const message = err.message || '';
    if (message.includes('auth/configuration-not-found') || message.includes('CONFIGURATION_NOT_FOUND')) {
      return 'Firebase Authentication has not been started in your Firebase project. In Firebase Console, go to Build → Authentication, click "Get Started", and turn ON Email/Password under Sign-in method.';
    }
    if (message.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is disabled in your Firebase project. Go to Firebase Console → Authentication → Sign-in method, and turn ON Email/Password.';
    }
    if (message.includes('auth/api-key-not-valid') || message.includes('API_KEY_INVALID')) {
      return 'Invalid Firebase API Key. Please verify the credentials copied from your Firebase Console Project Settings.';
    }
    if (message.includes('auth/unauthorized-domain')) {
      return 'This domain is not authorized. In Firebase Console → Authentication → Settings → Authorized domains, add your domain or localhost.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (message.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (
      message.includes('auth/invalid-credential') ||
      message.includes('auth/user-not-found') ||
      message.includes('auth/wrong-password')
    ) {
      return 'Invalid email address or password. Please check your credentials.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Too many failed login attempts. Please wait a few moments and try again.';
    }
    if (message.includes('auth/network-request-failed')) {
      return 'Network connection error. Please verify your internet connection.';
    }
    return message;
  };

  const handleToggleMode = (register: boolean) => {
    setIsRegistering(register);
    setErrorMessage('');
    clearAuthNotice();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    clearAuthNotice();

    if (isRegistering) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!businessName.trim()) {
        setErrorMessage('Please enter your dealership or business name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your passwords.');
        return;
      }

      setIsLoading(true);
      try {
        await registerAccount({
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          password
        });
      } catch (error) {
        setErrorMessage(formatAuthError(error));
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await signIn(email.trim(), password);
      } catch (error) {
        setErrorMessage(formatAuthError(error));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 relative overflow-hidden selection:bg-sky-500 selection:text-slate-950">
      
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login / Register Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden my-4 sm:my-8">
        
        {/* Top Brand Banner */}
        <div className="p-6 sm:p-7 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/70">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-3 animate-fadeIn">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BikeIcon className="w-8 h-8 text-sky-400 transform -rotate-12" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sales POS</h1>

          <p className="text-xs text-slate-400 font-medium mt-1">
            Vehicle Dealership & Inventory Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Authorized Dealership Terminal</span>
          </div>
        </div>

        {/* Tab Controls: Sign In vs Create Account */}
        <div className="px-6 sm:px-8 pt-6">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleMode(false)}
              className={`py-2.5 text-xs font-black rounded-xl transition-all ${
                !isRegistering
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleMode(true)}
              className={`py-2.5 text-xs font-black rounded-xl transition-all ${
                isRegistering
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div 
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Auth Notice Alert */}
          {authNotice && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium">{authNotice}</div>
            </div>
          )}

          {/* Registration Extra Fields: Name & Business Name */}
          {isRegistering && (
            <>
              {/* Full Name */}
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. Kasun Perera"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="reg-business-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Business / Dealership Name *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="reg-business-name"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. Wijesooriya Motors"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter email address"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isRegistering ? 'Password * (Min. 6 characters)' : 'Password *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isRegistering ? 6 : undefined}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder={isRegistering ? 'Create a secure password' : 'Enter password'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-12 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-sky-400"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Registration only) */}
          {isRegistering && (
            <div className="space-y-1.5 animate-fadeIn">
              <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Re-enter your password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-12 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-sky-400"
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          )}

          {/* Pending Approval Notice for New Users */}
          {isRegistering && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                New registrations are set to <strong>pending</strong> status. An administrator must approve your account before you can access the dealership dashboard.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 min-h-[44px] rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              isRegistering
                ? <UserPlus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                : <LogIn className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            )}
            <span>
              {isLoading 
                ? (isRegistering ? 'Submitting Registration...' : 'Signing In...')
                : (isRegistering ? 'Submit Registration' : 'Sign In')}
            </span>
          </button>

          {/* Bottom Switcher */}
          <p className="text-center text-xs text-slate-400 pt-1">
            {isRegistering ? 'Already have an approved account?' : 'Need a new dealership account?'}{' '}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleMode(!isRegistering)}
              className="font-bold text-sky-300 hover:text-sky-200 underline underline-offset-4 disabled:opacity-50 transition-colors"
            >
              {isRegistering ? 'Sign In' : 'Create Account'}
            </button>
          </p>

          {/* Database Switcher Button */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate max-w-[170px] text-slate-300 font-bold">{activeConfig.projectId}</span>
              {isCustom && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">Custom</span>}
            </span>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 font-bold underline underline-offset-2 transition-colors"
            >
              Change Database
            </button>
          </div>

        </form>

      </div>

      <div className="mt-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Sales POS • All rights reserved
      </div>

      {/* Firebase Custom Connection Modal */}
      <FirebaseConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
      />
    </div>
  );
};
