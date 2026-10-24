import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bike as BikeIcon, 
  Clock, 
  ShieldAlert, 
  ShieldX, 
  RefreshCw, 
  LogOut, 
  Building, 
  User, 
  Mail, 
  Calendar,
  CheckCircle2,
  Send
} from 'lucide-react';

export const PendingApprovalScreen: React.FC = () => {
  const { 
    user, 
    profile, 
    approvalStatus, 
    logout, 
    refreshProfile, 
    submitPendingRequest 
  } = useAuth();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [customBusiness, setCustomBusiness] = useState('');

  const isRejected = approvalStatus === 'rejected';
  const isUnregistered = approvalStatus === 'unregistered';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    try {
      await refreshProfile();
      setRefreshMessage('Status checked. Awaiting approval.');
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch {
      setRefreshMessage('Could not refresh status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualSubmit = async () => {
    setIsSubmitting(true);
    setRefreshMessage(null);
    try {
      await submitPendingRequest(user?.displayName || '', customBusiness);
      setRefreshMessage('Approval request submitted successfully!');
    } catch (err) {
      setRefreshMessage(err instanceof Error ? err.message : 'Failed to submit approval request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applicantName = profile?.name || user?.displayName || 'Account Holder';
  const businessName = profile?.businessName || customBusiness || 'Dealership Business';
  const emailAddress = user?.email || profile?.email || 'Registered Email';

  const formatSubmittedDate = () => {
    const rawDate = profile?.submittedAt || profile?.createdAt;
    if (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate && typeof (rawDate as any).toDate === 'function') {
      return (rawDate as any).toDate().toLocaleString();
    }
    return new Date().toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 relative overflow-hidden selection:bg-sky-500 selection:text-slate-950">
      
      {/* Background Ambience & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className={`absolute -top-40 -right-40 w-96 h-96 ${isRejected ? 'bg-rose-500/10' : 'bg-amber-500/10'} rounded-full blur-3xl pointer-events-none`} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Status Card */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/70">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-4 animate-fadeIn">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BikeIcon className="w-8 h-8 text-sky-400 transform -rotate-12" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sales POS</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Vehicle Dealership & Inventory Management
          </p>

          <div className="mt-4 flex items-center justify-center">
            {isRejected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold animate-fadeIn">
                <ShieldX className="w-4 h-4 text-rose-400" />
                <span>Registration Request Declined</span>
              </span>
            ) : isUnregistered ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                <span>Approval Request Required</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Awaiting Administrator Approval</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-white">
              {isRejected 
                ? 'Account Access Declined' 
                : isUnregistered 
                  ? 'Submit for Administrator Approval'
                  : 'Your Account is Pending Review'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isRejected
                ? 'Your registration request was reviewed and declined by the system administrator. If you believe this is an error, please contact your administrator.'
                : isUnregistered
                  ? 'Your account was authenticated, but an approval request document needs to be saved in Firestore. Click below to submit your approval request.'
                  : 'Thank you for registering. For business security and data isolation, each dealership account must be verified and approved by the system administrator before access is unlocked.'}
            </p>
          </div>

          {/* Unregistered Form or Details */}
          {isUnregistered ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Business / Dealership Name
                </label>
                <input
                  type="text"
                  value={customBusiness}
                  onChange={(e) => setCustomBusiness(e.target.value)}
                  placeholder="e.g. Wijesooriya Motors"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Approval Request'}</span>
              </button>
            </div>
          ) : (
            /* Registration Details Card */
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2 flex items-center justify-between">
                <span>Registration Application Details</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isRejected 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isRejected ? 'REJECTED' : 'PENDING'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <User className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 block">Applicant Name</span>
                  <span className="font-bold text-white truncate block">{applicantName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Building className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 block">Dealership / Business</span>
                  <span className="font-bold text-white truncate block">{businessName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 block">Registered Email</span>
                  <span className="font-mono text-white truncate block">{emailAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 block">Submitted On</span>
                  <span className="font-mono text-slate-300 truncate block">{formatSubmittedDate()}</span>
                </div>
              </div>
            </div>
          )}

          {refreshMessage && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs text-center flex items-center justify-center gap-2 animate-fadeIn font-medium">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isRejected && !isUnregistered && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 hover:border-slate-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <RefreshCw className={`w-4 h-4 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void logout()}
              className="w-full py-3 min-h-[44px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs sm:text-sm border border-rose-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-500">
              Signed in as <strong className="text-slate-400 font-mono">{emailAddress}</strong>
            </p>
          </div>
        </div>

      </div>

      <div className="mt-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Sales POS • All rights reserved
      </div>
    </div>
  );
};
