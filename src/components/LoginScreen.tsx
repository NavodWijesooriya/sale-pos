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
  Clock,
  CheckCircle2
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, registerAccount, authNotice, clearAuthNotice } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  
  // Registration fields
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetFields = () => {
    setName('');
    setBusinessName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
  };

  const handleModeSwitch = (newMode: 'signin' | 'register') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessNotice('');
    clearAuthNotice();
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address format.');
      return false;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return false;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return false;
      }
      if (name.trim().length < 2) {
        setErrorMessage('Name must be at least 2 characters.');
        return false;
      }
      if (!businessName.trim()) {
        setErrorMessage('Please enter your business or dealership name.');
        return false;
      }
      if (businessName.trim().length < 2) {
        setErrorMessage('Business name must be at least 2 characters.');
        return false;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your confirm password.');
        return false;
      }
    }
    return true;
  };

  const formatFirebaseError = (error: unknown): string => {
    if (!(error instanceof Error)) return 'An unexpected error occurred. Please try again.';
    const message = error.message;

    if (message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'The email address is invalid.';
    }
    if (message.includes('auth/weak-password')) {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Access temporarily blocked due to many failed attempts. Please wait a moment.';
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    clearAuthNotice();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'register') {
        await registerAccount({
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          password
        });
        resetFields();
        setSuccessNotice('Account created successfully! Your registration is awaiting administrator approval.');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error) {
      setErrorMessage(formatFirebaseError(error));
    } finally {
      setIsLoading(false);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-3 animate-fadeIn">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BikeIcon className="w-7 h-7 text-sky-400 transform -rotate-12" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sales POS</h1>

          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Vehicle Dealership & Sales Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Authorized Dealership Terminal</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">

          {/* Tab Selector: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleModeSwitch('signin')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleModeSwitch('register')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="text-center sm:text-left">
            <h2 className="text-base font-black text-white">
              {mode === 'signin' ? 'Welcome Back' : 'Create New Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'signin' 
                ? 'Sign in to access your vehicle inventory and sales ledger.' 
                : 'Register your dealership account to request access.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div 
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success / Status Message */}
          {(successNotice || authNotice) && !errorMessage && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 font-medium">{successNotice || authNotice}</div>
            </div>
          )}

          {/* Registration Notice */}
          {mode === 'register' && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs flex items-start gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">
                New accounts require <strong>administrator approval</strong> before dashboard access is unlocked.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registration specific fields */}
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="reg-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Kasun Perera"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div className="space-y-1">
                  <label htmlFor="reg-business-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Business / Dealership Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id="reg-business-name"
                      type="text"
                      required
                      autoComplete="organization"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Perera Motors"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1">
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
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password * {mode === 'register' && <span className="text-[10px] lowercase text-slate-400 font-normal">(min 6 characters)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder={mode === 'register' ? 'Create a secure password' : 'Enter your password'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-12 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
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
            {mode === 'register' && (
              <div className="space-y-1">
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
                    placeholder="Confirm your password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-xl pl-10 pr-12 py-2.5 min-h-[44px] text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 min-h-[46px] rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  mode === 'register'
                    ? <UserPlus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                    : <LogIn className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                )}
                <span>{mode === 'register' ? 'Submit Registration Request' : 'Sign In to Dashboard'}</span>
              </button>
            </div>

            {/* Toggle Mode Link */}
            <p className="text-center text-xs text-slate-400 pt-1">
              {mode === 'register' ? 'Already have an approved account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleModeSwitch(mode === 'register' ? 'signin' : 'register')}
                className="font-bold text-sky-300 hover:text-sky-200 underline underline-offset-4 disabled:opacity-50"
              >
                {mode === 'register' ? 'Sign in here' : 'Create an Account'}
              </button>
            </p>

          </form>
        </div>
      </div>

      <div className="text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Sales POS • All rights reserved
      </div>
    </div>
  );
};
