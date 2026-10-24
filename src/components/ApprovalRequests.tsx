import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  AlertCircle, 
  Check, 
  Clock3, 
  UserRound, 
  X, 
  Building, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  UserX
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

export interface UserRegistrationRecord {
  id: string;
  name?: string;
  businessName?: string;
  email: string;
  role?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp | null;
  createdAt: Timestamp | null;
  reviewedBy?: string;
  reviewedAt?: Timestamp | null;
}

type TabFilter = 'pending' | 'approved' | 'rejected' | 'all';

export const ApprovalRequests: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    user: UserRegistrationRecord;
    action: 'approved' | 'rejected';
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    const usersQuery = query(collection(db, 'users'));

    return onSnapshot(
      usersQuery,
      (snapshot) => {
        const records: UserRegistrationRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = data.approvalStatus;
          const approvalStatus: 'pending' | 'approved' | 'rejected' = 
            rawStatus === 'pending' || rawStatus === 'rejected' ? rawStatus : 'approved';

          return {
            id: docSnap.id,
            name: typeof data.name === 'string' ? data.name : undefined,
            businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
            email: typeof data.email === 'string' ? data.email : 'No email',
            role: typeof data.role === 'string' ? data.role : 'user',
            approvalStatus,
            submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt : null,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
            reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt : null
          };
        });

        // Sort: newest first
        records.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis() || a.createdAt?.toMillis() || 0;
          const timeB = b.submittedAt?.toMillis() || b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setUsers(records);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load user registration requests', error);
        setErrorMessage('User registrations could not be loaded. Please verify administrator permissions and security rules.');
        setIsLoading(false);
      }
    );
  }, [isAdmin]);

  const handleActionClick = (user: UserRegistrationRecord, action: 'approved' | 'rejected') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmModal({ user, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { user, action } = confirmModal;
    const currentAdminUid = auth.currentUser?.uid;

    if (!currentAdminUid) {
      setErrorMessage('Your administrator session has expired. Please sign in again.');
      setConfirmModal(null);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        approvalStatus: action,
        reviewedBy: currentAdminUid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const targetName = user.name || user.businessName || user.email;
      setSuccessMessage(
        action === 'approved'
          ? `Successfully approved ${targetName}. Access has been granted.`
          : `Registration for ${targetName} was rejected.`
      );
      setConfirmModal(null);

      // Auto-clear success message after 4s
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error(`Failed to ${action} user`, error);
      setErrorMessage(
        `Failed to update registration status. Ensure your account is authorized in userRoles.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  // Filter calculations
  const pendingUsers = users.filter((u) => u.approvalStatus === 'pending');
  const approvedUsers = users.filter((u) => u.approvalStatus === 'approved');
  const rejectedUsers = users.filter((u) => u.approvalStatus === 'rejected');

  const filteredByTab = activeTab === 'all'
    ? users
    : activeTab === 'pending'
      ? pendingUsers
      : activeTab === 'approved'
        ? approvedUsers
        : rejectedUsers;

  const displayUsers = filteredByTab.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.businessName && u.businessName.toLowerCase().includes(q))
    );
  });

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return 'Date unavailable';
    return ts.toDate().toLocaleString();
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl animate-fadeIn">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 tracking-tight">
              <UserRound className="w-5 h-5 text-sky-400" />
              <span>Pending Approvals & User Access</span>
            </h2>
            {pendingUsers.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                {pendingUsers.length} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review new dealership registrations. Only approved users can sign in and manage their inventory.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Active</span>
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div 
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div 
          role="alert"
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'pending' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {pendingUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Approved</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'approved' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {approvedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Rejected</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'rejected' ? 'bg-white/20 text-white font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {rejectedUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All Users</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'all' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {users.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicants..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

      </div>

      {/* User Records List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          <span className="inline-block w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading dealership registrations...</p>
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
          <UserRound className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">
            {activeTab === 'pending'
              ? 'No pending registration requests at this time.'
              : activeTab === 'approved'
                ? 'No approved users found.'
                : activeTab === 'rejected'
                  ? 'No rejected registration requests.'
                  : 'No users found matching your search.'}
          </p>
          <p className="text-[11px] text-slate-500">
            When new users register through the login page, their applications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayUsers.map((applicant) => {
            const isSelf = applicant.id === auth.currentUser?.uid;
            const isUserAdmin = applicant.role === 'admin';
            const submittedDateStr = formatDate(applicant.submittedAt || applicant.createdAt);

            return (
              <div
                key={applicant.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Applicant Summary */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-sky-400 shrink-0">
                    {(applicant.name || applicant.businessName || applicant.email || '?')[0].toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white truncate">
                        {applicant.name || 'Unnamed Applicant'}
                      </h3>

                      {/* Status Badges */}
                      {applicant.approvalStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" />
                          Pending Approval
                        </span>
                      )}
                      {applicant.approvalStatus === 'approved' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {applicant.approvalStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Rejected
                        </span>
                      )}

                      {isUserAdmin && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          Administrator
                        </span>
                      )}

                      {isSelf && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-white font-bold">{applicant.businessName || 'No business specified'}</span>
                      </span>

                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{applicant.email}</span>
                      </span>

                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>{submittedDateStr}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 pt-2 lg:pt-0 border-t border-slate-900 lg:border-t-0 w-full lg:w-auto justify-end">
                  {isSelf ? (
                    <span className="text-xs text-slate-500 italic">Current Admin Account</span>
                  ) : (
                    <>
                      {/* Approve button: shown for pending or rejected */}
                      {applicant.approvalStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(applicant, 'approved')}
                          className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                          title={`Approve account for ${applicant.name || applicant.email}`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* Reject button: shown for pending */}
                      {applicant.approvalStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(applicant, 'rejected')}
                          className="px-3.5 py-2 min-h-[38px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                          title={`Reject registration for ${applicant.name || applicant.email}`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Revoke / Reject button: shown for approved non-admin users */}
                      {applicant.approvalStatus === 'approved' && !isUserAdmin && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(applicant, 'rejected')}
                          className="px-3 py-1.5 min-h-[36px] rounded-xl bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 font-medium text-xs transition-colors flex items-center gap-1.5"
                          title="Revoke access"
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-400" />
                          <span>Revoke Access</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.action === 'approved'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}>
                {confirmModal.action === 'approved' ? (
                  <UserCheck className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <UserX className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>

              <div>
                <h3 id="confirm-modal-title" className="text-base sm:text-lg font-black text-white">
                  {confirmModal.action === 'approved'
                    ? 'Approve Dealership Account?'
                    : 'Reject Registration Request?'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {confirmModal.action === 'approved'
                    ? 'This user will be granted immediate access to log in and manage their own dealership inventory.'
                    : 'This user will be blocked from accessing the system dashboard.'}
                </p>
              </div>
            </div>

            {/* Applicant Summary Pill */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Applicant:</span>
                <span className="font-bold text-white">{confirmModal.user.name || 'Unnamed'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Business:</span>
                <span className="font-bold text-amber-300">{confirmModal.user.businessName || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Email:</span>
                <span className="font-mono text-slate-200">{confirmModal.user.email}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50 ${
                  confirmModal.action === 'approved'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                }`}
              >
                {isProcessing ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : confirmModal.action === 'approved' ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>
                  {isProcessing
                    ? 'Updating...'
                    : confirmModal.action === 'approved'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
