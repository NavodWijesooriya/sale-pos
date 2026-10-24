import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, ApprovalStatus } from '@/context/AuthContext';
import { 
  Bike as BikeIcon, 
  Clock, 
  ShieldAlert, 
  User as UserIcon, 
  Building, 
  Mail, 
  LogOut, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface PendingApprovalScreenProps {
  user: User;
  profile: UserProfile | null;
  approvalStatus: ApprovalStatus;
  approvalStatusVerified: boolean;
  authNotice: string | null;
  onSignOut: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  profile,
  approvalStatus,
  approvalStatusVerified,
  authNotice,
  onSignOut
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const isPending = approvalStatus === 'pending';
  const isRejected = approvalStatus === 'rejected';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 relative overflow-hidden selection:bg-sky-500 selection:text-slate-950">
      
      {/* Background Ambience & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      {isPending ? (
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      ) : (
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Main Status Container */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden my-4 sm:my-8">
        
        {/* Brand Banner Header */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950/70">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-amber-400 p-[2px] shadow-xl shadow-sky-500/20 mb-3 animate-fadeIn">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BikeIcon className="w-7 h-7 text-sky-400 transform -rotate-12" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Sales POS</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Vehicle Dealership & Sales Management System
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Status Icon & Title */}
          <div className="text-center space-y-2">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border ${
              isPending 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isPending ? (
                <Clock className="w-8 h-8 animate-pulse" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>

            <h2 className="text-xl font-black text-white pt-1">
              {isPending
                ? 'Account Pending Approval'
                : isRejected
                  ? 'Registration Request Rejected'
                  : 'Account Approval Required'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {authNotice || (
                isPending
                  ? 'Your account registration has been received and is waiting for administrator review.'
                  : isRejected
                    ? 'Your account registration request was not approved by the administrator.'
                    : 'A verified administrator approval is required to access the dealership workspace.'
              )}
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800/80 flex items-center justify-between">
              <span>Registration Details</span>
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Pending Review
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Rejected
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  Applicant Name:
                </span>
                <strong className="text-white font-medium">{profile?.name || user.displayName || '—'}</strong>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Dealership / Business:
                </span>
                <span className="text-sky-300 font-semibold">{profile?.businessName || '—'}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address:
                </span>
                <span className="text-slate-300 font-mono text-[11px]">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Explanatory Callout */}
          <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
            isPending 
              ? 'bg-amber-500/5 border-amber-500/20 text-slate-300' 
              : 'bg-rose-500/5 border-rose-500/20 text-slate-300'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
              isPending ? 'text-amber-400' : 'text-rose-400'
            }`} />
            <div>
              {isPending ? (
                <span>
                  For data security and multi-user privacy, each business account must be verified by an administrator. Once approved, this terminal will automatically open your private dashboard.
                </span>
              ) : (
                <span>
                  Your registration request was not approved. You cannot access this dealership terminal. If you need assistance, please contact your dealership administrator.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {isPending && (
              <button
                type="button"
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className={`w-full ${isPending ? 'sm:w-auto' : 'flex-1'} py-3 px-5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-2 active:scale-95`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>

      <div className="text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Sales POS • All rights reserved
      </div>
    </div>
  );
};
