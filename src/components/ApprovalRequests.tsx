import React, { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { 
  Check, 
  Clock3, 
  UserRound, 
  X, 
  Building, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useDealership } from '../context/DealershipContext';

export interface RegistrationRequest {
  id: string;
  name?: string;
  businessName?: string;
  email: string;
  role?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  reviewedBy?: string;
  reviewedAt?: Timestamp | null;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

interface ConfirmDialogState {
  isOpen: boolean;
  request: RegistrationRequest;
  action: 'approved' | 'rejected';
}

export const ApprovalRequests: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useDealership();
  
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    const usersCollection = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersCollection,
      (snapshot) => {
        const loaded: RegistrationRequest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: typeof data.name === 'string' ? data.name : undefined,
            businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
            email: typeof data.email === 'string' ? data.email : 'Unknown email',
            role: typeof data.role === 'string' ? data.role : 'user',
            approvalStatus: data.approvalStatus === 'approved' || data.approvalStatus === 'rejected' 
              ? data.approvalStatus 
              : 'pending',
            submittedAt: data.submittedAt instanceof Timestamp 
              ? data.submittedAt 
              : (data.createdAt instanceof Timestamp ? data.createdAt : null),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
            reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : undefined,
            reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt : null
          };
        });

        // Sort: newest first
        loaded.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis() || a.createdAt?.toMillis() || 0;
          const timeB = b.submittedAt?.toMillis() || b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setRequests(loaded);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load registration requests', error);
        setErrorMessage('Registration requests could not be loaded. Please verify your administrator credentials.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Counts for each tab
  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.approvalStatus === 'pending').length,
      approved: requests.filter((r) => r.approvalStatus === 'approved').length,
      rejected: requests.filter((r) => r.approvalStatus === 'rejected').length,
      all: requests.length
    };
  }, [requests]);

  // Filtered requests by tab and search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Tab filter
      if (activeTab === 'pending' && req.approvalStatus !== 'pending') return false;
      if (activeTab === 'approved' && req.approvalStatus !== 'approved') return false;
      if (activeTab === 'rejected' && req.approvalStatus !== 'rejected') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = req.name?.toLowerCase().includes(query) ?? false;
        const matchBusiness = req.businessName?.toLowerCase().includes(query) ?? false;
        const matchEmail = req.email.toLowerCase().includes(query);
        return matchName || matchBusiness || matchEmail;
      }
      return true;
    });
  }, [requests, activeTab, searchQuery]);

  const handleOpenConfirm = (request: RegistrationRequest, action: 'approved' | 'rejected') => {
    setErrorMessage('');
    setConfirmDialog({
      isOpen: true,
      request,
      action
    });
  };

  const handleExecuteReview = async () => {
    if (!confirmDialog) return;
    const { request, action } = confirmDialog;
    const adminUid = auth.currentUser?.uid;

    if (!adminUid) {
      setErrorMessage('Your administrator session has expired. Sign in again to review requests.');
      setConfirmDialog(null);
      return;
    }

    setProcessingUid(request.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateDoc(doc(db, 'users', request.id), {
        approvalStatus: action,
        reviewedBy: adminUid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const applicantDisplayName = request.name || request.email;
      const successText = action === 'approved'
        ? `Account for "${applicantDisplayName}" (${request.businessName || request.email}) was successfully approved.`
        : `Account for "${applicantDisplayName}" was rejected.`;

      setSuccessMessage(successText);
      showToast(
        action === 'approved' ? 'Account Approved' : 'Account Rejected',
        successText,
        action === 'approved' ? 'success' : 'info'
      );
    } catch (error) {
      console.error(`Failed to ${action} registration request`, error);
      const errText = `The request could not be ${action}. Check your connection and administrator permissions.`;
      setErrorMessage(errText);
      showToast('Action Failed', errText, 'error');
    } finally {
      setProcessingUid(null);
      setConfirmDialog(null);
    }
  };

  const formatTimestamp = (ts: Timestamp | null): string => {
    if (!ts) return 'Date unavailable';
    const date = ts.toDate();
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserRound className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>Pending Approvals & User Accounts</span>
            {counts.pending > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-black animate-pulse">
                {counts.pending} Pending
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Review new dealership registration requests. Approved users can access their own private vehicle POS workspace.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
              {counts.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
              {counts.rejected}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
              {counts.all}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div role="alert" className="flex items-start justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-white p-1 text-xs"
            aria-label="Dismiss error notification"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-start justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-white p-1 text-xs"
            aria-label="Dismiss success notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Input if multiple requests */}
      {requests.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, business, or email..."
            aria-label="Search user accounts"
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 rounded-xl pl-10 pr-8 py-2 min-h-[38px] text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* List Content */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading registration requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-400">
          {searchQuery ? (
            <p>No account requests match "{searchQuery}".</p>
          ) : activeTab === 'pending' ? (
            <p>There are currently no pending registration requests.</p>
          ) : activeTab === 'approved' ? (
            <p>No approved accounts to display.</p>
          ) : activeTab === 'rejected' ? (
            <p>No rejected registration requests.</p>
          ) : (
            <p>No user accounts found.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isProcessing = processingUid === request.id;
            const isPending = request.approvalStatus === 'pending';
            const isApproved = request.approvalStatus === 'approved';
            const isRejected = request.approvalStatus === 'rejected';

            return (
              <div
                key={request.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-950/70 hover:border-slate-700/80 transition-all"
              >
                {/* Applicant Info */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  
                  {/* Row 1: Name and Status Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-white flex items-center gap-1.5">
                      <UserRound className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                      {request.name || 'Unnamed Applicant'}
                    </span>

                    {/* Status Pill */}
                    {isPending && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending Approval
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <X className="w-3 h-3 stroke-[3]" />
                        Rejected
                      </span>
                    )}

                    {request.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Row 2: Business & Email */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      {request.businessName || 'Business Name not specified'}
                    </span>

                    <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      {request.email}
                    </span>
                  </div>

                  {/* Row 3: Timestamps */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3 h-3 text-slate-500 shrink-0" aria-hidden="true" />
                      Submitted: {formatTimestamp(request.submittedAt)}
                    </span>
                    {request.reviewedAt && (
                      <span className="text-slate-400">
                        • Reviewed: {formatTimestamp(request.reviewedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t border-slate-800/60 lg:border-t-0">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing || processingUid !== null}
                        onClick={() => handleOpenConfirm(request, 'rejected')}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
                        title="Reject registration request"
                        aria-label={`Reject registration for ${request.name || request.email}`}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing || processingUid !== null}
                        onClick={() => handleOpenConfirm(request, 'approved')}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-4 py-2 text-xs font-black text-slate-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        title="Approve registration request"
                        aria-label={`Approve registration for ${request.name || request.email}`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                        <span>Approve</span>
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      disabled={isProcessing || processingUid !== null}
                      onClick={() => handleOpenConfirm(request, 'approved')}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-all active:scale-95 disabled:opacity-50"
                      title="Re-approve previously rejected account"
                      aria-label={`Re-approve registration for ${request.name || request.email}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Re-approve</span>
                    </button>
                  )}

                  {isApproved && (
                    <button
                      type="button"
                      disabled={isProcessing || processingUid !== null}
                      onClick={() => handleOpenConfirm(request, 'rejected')}
                      className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-xs font-medium text-rose-300/80 hover:text-rose-300 transition-all active:scale-95 disabled:opacity-50"
                      title="Revoke access and reject account"
                      aria-label={`Revoke access for ${request.name || request.email}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            
            {/* Modal Icon and Title */}
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmDialog.action === 'approved' 
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
              }`}>
                {confirmDialog.action === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                )}
              </div>

              <div>
                <h3 id="confirm-dialog-title" className="text-base font-black text-white">
                  {confirmDialog.action === 'approved' ? 'Confirm Account Approval' : 'Confirm Account Rejection'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {confirmDialog.action === 'approved'
                    ? 'Grant system and private workspace access to this applicant.'
                    : 'Block this applicant from accessing the vehicle POS terminal.'}
                </p>
              </div>
            </div>

            {/* Applicant Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Applicant:</span>
                <strong className="text-white">{confirmDialog.request.name || 'Unnamed Applicant'}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Business Name:</span>
                <span className="text-sky-300 font-semibold">{confirmDialog.request.businessName || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Email:</span>
                <span className="text-slate-200 font-mono text-[11px]">{confirmDialog.request.email}</span>
              </div>
            </div>

            {/* Explanation Note */}
            <p className="text-xs text-slate-400 leading-relaxed">
              {confirmDialog.action === 'approved'
                ? 'The applicant will be able to log in, manage their private showroom inventory, record sales, and view analytics securely.'
                : 'The applicant will not be allowed to enter the dashboard. Their account will remain restricted until re-approved.'}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={processingUid !== null}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={processingUid !== null}
                onClick={handleExecuteReview}
                className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                  confirmDialog.action === 'approved'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/25'
                }`}
              >
                {processingUid !== null ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : confirmDialog.action === 'approved' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <X className="w-4 h-4 stroke-[3]" />
                )}
                <span>
                  {confirmDialog.action === 'approved' ? 'Yes, Approve Account' : 'Yes, Reject Account'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export const PendingApprovals = ApprovalRequests;
