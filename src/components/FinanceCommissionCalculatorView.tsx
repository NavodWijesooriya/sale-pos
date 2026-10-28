import React, { useState, useEffect, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Calculator, 
  Percent, 
  RotateCcw, 
  Copy, 
  Check, 
  Coins, 
  Building2, 
  User, 
  FileText, 
  Sparkles, 
  Clock, 
  Trash2, 
  ArrowUpRight,
  Printer,
  ChevronDown,
  Info,
  Cloud,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { SavedCommissionCalculation } from '../types';

const DEFAULT_PRESET_RATES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];

const COMMON_FINANCE_COMPANIES = [
  'Commercial Bank',
  'LB Finance',
  'LOLC Finance',
  'People\'s Leasing',
  'Vallibel Finance',
  'Singer Finance',
  'Central Finance',
  'HNB Finance',
  'Seylan Bank',
  'Sampath Bank',
  'Assetline Leasing',
  'CDB Finance'
];

export const FinanceCommissionCalculatorView: React.FC = () => {
  const { 
    settings, 
    showToast,
    updateSettings,
    financeCommissionCalculations,
    isFinanceCalculationsLoading,
    saveFinanceCommissionCalculation,
    deleteFinanceCommissionCalculation,
    clearFinanceCommissionCalculations
  } = useDealership();

  const symbol = settings.currencySymbol || 'Rs.';
  const defaultRatePct = Number((settings.defaultFinanceCommissionRate ? settings.defaultFinanceCommissionRate * 100 : 3.0).toFixed(2));

  // Calculator State
  const [financeAmount, setFinanceAmount] = useState<number>(1000000);
  const [financeAmountInput, setFinanceAmountInput] = useState<string>('1000000');
  const [commissionRate, setCommissionRate] = useState<number>(defaultRatePct);
  const [commissionRateInput, setCommissionRateInput] = useState<string>(defaultRatePct.toString());
  
  // Optional arrangement details
  const [applicantName, setApplicantName] = useState<string>('');
  const [lenderName, setLenderName] = useState<string>('');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'separate' | 'deducted'>('separate');
  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(true);

  // Status states
  const [copied, setCopied] = useState<boolean>(false);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);
  const [isUpdatingDefaultRate, setIsUpdatingDefaultRate] = useState<boolean>(false);

  // Sync default rate from settings if changed externally
  useEffect(() => {
    if (settings.defaultFinanceCommissionRate !== undefined) {
      const pct = Number((settings.defaultFinanceCommissionRate * 100).toFixed(2));
      // Only sync if user hasn't typed a different value yet
      if (commissionRateInput === '3.0' || commissionRateInput === '3') {
        setCommissionRate(pct);
        setCommissionRateInput(pct.toString());
      }
    }
  }, [settings.defaultFinanceCommissionRate]);

  // Sync inputs with state
  const handleAmountChange = (valStr: string) => {
    setFinanceAmountInput(valStr);
    const cleaned = valStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    setFinanceAmount(isNaN(num) || num < 0 ? 0 : num);
  };

  const handleRateChange = (valStr: string) => {
    setCommissionRateInput(valStr);
    const cleaned = valStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    setCommissionRate(isNaN(num) || num < 0 ? 0 : num);
  };

  const handleSetPresetRate = (rate: number) => {
    setCommissionRate(rate);
    setCommissionRateInput(rate.toString());
  };

  const handleAddAmount = (addVal: number) => {
    const newAmount = (financeAmount || 0) + addVal;
    setFinanceAmount(newAmount);
    setFinanceAmountInput(newAmount.toString());
  };

  // Computations
  const commissionAmount = useMemo(() => {
    return Math.round((financeAmount * (commissionRate / 100)) * 100) / 100;
  }, [financeAmount, commissionRate]);

  const netDisbursedAmount = useMemo(() => {
    return Math.max(0, financeAmount - commissionAmount);
  }, [financeAmount, commissionAmount]);

  // Reset all fields to defaults
  const handleReset = () => {
    setFinanceAmount(1000000);
    setFinanceAmountInput('1000000');
    setCommissionRate(defaultRatePct);
    setCommissionRateInput(defaultRatePct.toString());
    setApplicantName('');
    setLenderName('');
    setReferenceNote('');
    setPayoutMethod('separate');
    showToast('Calculator Reset', 'All fields restored to defaults', 'info');
  };

  // Save current commission rate as default rate in Firestore
  const handleSaveDefaultRate = async () => {
    if (commissionRate < 0 || commissionRate > 100) {
      showToast('Invalid Rate', 'Please enter a commission rate between 0% and 100%', 'error');
      return;
    }
    setIsUpdatingDefaultRate(true);
    try {
      await updateSettings({
        defaultFinanceCommissionRate: commissionRate / 100
      });
      showToast('Default Rate Saved', `Default commission rate set to ${commissionRate}% in Firestore`, 'success');
    } catch {
      showToast('Update Failed', 'Could not save default rate to Firestore', 'error');
    } finally {
      setIsUpdatingDefaultRate(false);
    }
  };

  // Copy breakdown to clipboard
  const handleCopyBreakdown = () => {
    const lines = [
      '=======================================',
      '     FINANCE COMMISSION BREAKDOWN      ',
      '=======================================',
      applicantName ? `Applicant: ${applicantName}` : null,
      lenderName ? `Lender / Bank: ${lenderName}` : null,
      referenceNote ? `Reference: ${referenceNote}` : null,
      `Finance Amount Arranged: ${formatCurrency(financeAmount, symbol)}`,
      `Commission Rate: ${commissionRate}%`,
      `Commission Earned: ${formatCurrency(commissionAmount, symbol)}`,
      payoutMethod === 'deducted' 
        ? `Net Disbursed to Client (Commission Deducted): ${formatCurrency(netDisbursedAmount, symbol)}`
        : `Gross Disbursed to Client: ${formatCurrency(financeAmount, symbol)} (Commission paid separately)`,
      '=======================================',
      `Calculated via ${settings.dealershipName || 'Vehicle POS'}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      showToast('Copied to Clipboard', 'Commission summary breakdown copied successfully', 'success');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      showToast('Copy Failed', 'Please manually select and copy the text', 'error');
    });
  };

  // Save calculation to Firestore
  const handleSaveToHistory = async () => {
    if (financeAmount <= 0) {
      showToast('Invalid Amount', 'Please enter a valid finance amount', 'error');
      return;
    }

    setIsSavingRecord(true);
    try {
      await saveFinanceCommissionCalculation({
        applicantName: applicantName.trim() || 'Client Financing',
        lenderName: lenderName.trim() || 'General Lender',
        referenceNote: referenceNote.trim(),
        financeAmount,
        commissionRate,
        commissionAmount,
        payoutMethod,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Could not save calculation to Firestore', 'error');
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Delete an item from Firestore
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await deleteFinanceCommissionCalculation(id);
    } catch (err: any) {
      showToast('Delete Failed', err?.message || 'Could not delete calculation', 'error');
    }
  };

  // Clear all history from Firestore
  const handleClearHistory = async () => {
    if (window.confirm('Clear all saved commission calculations from Firestore? This cannot be undone.')) {
      try {
        await clearFinanceCommissionCalculations();
      } catch (err: any) {
        showToast('Clear Failed', err?.message || 'Could not clear history', 'error');
      }
    }
  };

  // Load a calculation from history
  const handleLoadHistory = (item: SavedCommissionCalculation) => {
    setFinanceAmount(item.financeAmount);
    setFinanceAmountInput(item.financeAmount.toString());
    setCommissionRate(item.commissionRate);
    setCommissionRateInput(item.commissionRate.toString());
    setApplicantName(item.applicantName === 'Client Financing' ? '' : (item.applicantName || ''));
    setLenderName(item.lenderName === 'General Lender' ? '' : (item.lenderName || ''));
    setReferenceNote(item.referenceNote || '');
    setPayoutMethod(item.payoutMethod || 'separate');
    showToast('Calculation Loaded', `Loaded ${formatCurrency(item.financeAmount, symbol)} at ${item.commissionRate}%`, 'info');
  };

  // Print summary card
  const handlePrint = () => {
    window.print();
  };

  const isCurrentRateDefault = Math.abs(commissionRate - defaultRatePct) < 0.001;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Third-Party Financing Service</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Firestore Cloud Synced</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Finance Commission <span className="text-amber-400">Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Calculate commissions earned by arranging vehicle financing, leasing, or loan facilities for clients. All rates and calculation records are securely saved to your isolated Firestore account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 min-h-[44px]"
            title="Reset calculator inputs to default values"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95 min-h-[44px]"
            title="Print or export calculation"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Calculation Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card 1: Core Finance & Commission Inputs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white">Finance Parameters</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Step 1 & 2</span>
            </div>

            {/* Input 1: Finance Amount */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="financeAmount" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Finance Amount Arranged</span>
                  <span className="text-rose-400">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {formatCurrency(financeAmount, symbol)}
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  {symbol}
                </div>
                <input
                  id="financeAmount"
                  type="text"
                  inputMode="decimal"
                  value={financeAmountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white font-mono text-base font-bold transition-colors outline-none"
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Quick Add:</span>
                {[50000, 100000, 500000, 1000000].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleAddAmount(step)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-medium transition-colors border border-slate-700/50"
                  >
                    +{step >= 1000000 ? `${step / 1000000}M` : `${step / 1000}k`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFinanceAmount(0);
                    setFinanceAmountInput('');
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors border border-rose-500/30"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Input 2: Commission Rate (%) with Firestore Default Rate support */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label htmlFor="commissionRate" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Commission Rate</span>
                  <span className="text-rose-400">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {commissionRate}%
                  </span>

                  {!isCurrentRateDefault && (
                    <button
                      type="button"
                      disabled={isUpdatingDefaultRate}
                      onClick={handleSaveDefaultRate}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all disabled:opacity-50"
                      title="Save this rate as your default in Firestore"
                    >
                      <BookmarkPlus className="w-3 h-3 text-amber-400" />
                      <span>{isUpdatingDefaultRate ? 'Saving...' : 'Set as Default Rate'}</span>
                    </button>
                  )}

                  {isCurrentRateDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Account Default</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={commissionRateInput}
                  onChange={(e) => handleRateChange(e.target.value)}
                  placeholder="e.g. 3.0"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-mono text-base font-bold transition-colors outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  %
                </div>
              </div>

              {/* Commission Rate Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-500">Quick Select Rate:</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {DEFAULT_PRESET_RATES.map((rate) => {
                    const isSelected = Math.abs(commissionRate - rate) < 0.001;
                    return (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSetPresetRate(rate)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 scale-[1.03]'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                        }`}
                      >
                        {rate.toFixed(1)}%
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payout Mechanism Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <label className="text-xs font-bold text-slate-300">Commission Settlement Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('separate')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    payoutMethod === 'separate'
                      ? 'bg-sky-500/10 border-sky-500/50 text-white ring-1 ring-sky-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    payoutMethod === 'separate' ? 'border-sky-400 bg-sky-500' : 'border-slate-600'
                  }`}>
                    {payoutMethod === 'separate' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Paid Separately by Bank</div>
                    <div className="text-[10px] text-slate-400">Lender disburses full loan and pays commission to you</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('deducted')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    payoutMethod === 'deducted'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    payoutMethod === 'deducted' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
                  }`}>
                    {payoutMethod === 'deducted' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Deducted from Loan</div>
                    <div className="text-[10px] text-slate-400">Commission is retained from client loan disbursement</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Card 2: Optional Client & Institution Reference */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Optional Client & Lender Details (For Quotes & Receipts)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showOptionalDetails ? 'rotate-180' : ''}`} />
            </button>

            {showOptionalDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/80 animate-fadeIn">
                <div className="space-y-1.5">
                  <label htmlFor="applicantName" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Client / Applicant Name</span>
                  </label>
                  <input
                    id="applicantName"
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Kasun Perera"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-sky-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lenderName" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Finance Company / Bank</span>
                  </label>
                  <input
                    id="lenderName"
                    list="financeCompaniesList"
                    type="text"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="e.g. LB Finance"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-sky-500 outline-none"
                  />
                  <datalist id="financeCompaniesList">
                    {COMMON_FINANCE_COMPANIES.map(company => (
                      <option key={company} value={company} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="referenceNote" className="text-xs font-semibold text-slate-300">
                    Vehicle / Arrangement Note
                  </label>
                  <input
                    id="referenceNote"
                    type="text"
                    value={referenceNote}
                    onChange={(e) => setReferenceNote(e.target.value)}
                    placeholder="e.g. Third-party car WP CA-5582 / Loan Ref #9021"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Rate Comparison Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">Rate Comparison Matrix</h3>
              </div>
              <span className="text-[11px] text-slate-400">Click any row to apply rate</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 px-2.5">Rate</th>
                    <th className="py-2 px-2.5">Commission Earned</th>
                    <th className="py-2 px-2.5">Net Disbursed</th>
                    <th className="py-2 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {DEFAULT_PRESET_RATES.map((rate) => {
                    const rowCommission = Math.round((financeAmount * (rate / 100)) * 100) / 100;
                    const rowNet = Math.max(0, financeAmount - rowCommission);
                    const isSelected = Math.abs(commissionRate - rate) < 0.001;

                    return (
                      <tr 
                        key={rate}
                        onClick={() => handleSetPresetRate(rate)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-amber-500/15 text-amber-200 font-bold' 
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-emerald-400 font-bold">
                          {formatCurrency(rowCommission, symbol)}
                        </td>
                        <td className="py-2 px-2.5 text-slate-300">
                          {formatCurrency(rowNet, symbol)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-sans">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 hover:text-sky-400 font-semibold">
                              Select
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Live Commission Result & Action Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          
          {/* Main Hero Card: Commission Earned */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-5">
              
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Your Commission Payout
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {commissionRate}% Rate
                </span>
              </div>

              {/* Large Hero Amount */}
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-mono text-emerald-400">
                  {formatCurrency(commissionAmount, symbol)}
                </div>
                <div className="text-xs text-slate-400">
                  Earned on finance arrangement of <strong className="text-slate-200">{formatCurrency(financeAmount, symbol)}</strong>
                </div>
              </div>

              {/* Detailed Breakdown Box */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-sans">Gross Finance Amount</span>
                  <span className="font-bold text-white">{formatCurrency(financeAmount, symbol)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-sans">Commission Rate</span>
                  <span className="font-bold text-amber-400">{commissionRate}%</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <span className="font-sans font-bold text-emerald-400">Commission Earned</span>
                  <span className="font-bold text-emerald-400 text-sm">{formatCurrency(commissionAmount, symbol)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <span className="font-sans">
                    {payoutMethod === 'deducted' ? 'Net Payout to Client (Deducted)' : 'Total Disbursed by Lender'}
                  </span>
                  <span className="font-bold text-sky-300">
                    {payoutMethod === 'deducted' 
                      ? formatCurrency(netDisbursedAmount, symbol) 
                      : formatCurrency(financeAmount, symbol)
                    }
                  </span>
                </div>
              </div>

              {/* Client & Bank Tag if filled */}
              {(applicantName || lenderName) && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs space-y-1">
                  {applicantName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Client:</span>
                      <span className="font-bold text-white">{applicantName}</span>
                    </div>
                  )}
                  {lenderName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Financing Partner:</span>
                      <span className="font-bold text-sky-400">{lenderName}</span>
                    </div>
                  )}
                  {referenceNote && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ref:</span>
                      <span className="text-slate-300 text-[11px] truncate max-w-[200px]">{referenceNote}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions: Copy & Save to Firestore */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyBreakdown}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copied Breakdown!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Breakdown for Client / WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSavingRecord}
                  onClick={handleSaveToHistory}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-bold text-xs border border-sky-500/40 transition-colors min-h-[40px] disabled:opacity-50"
                >
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>{isSavingRecord ? 'Saving to Firestore...' : 'Save Record to Firestore Cloud'}</span>
                </button>
              </div>

              {/* Informative Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Calculation records and custom default rates are preserved in Firestore and remain accessible whenever you log in.
                </span>
              </div>

            </div>
          </div>

          {/* Recent Calculations History Card (Firestore Powered) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">Firestore Saved Calculations</h3>
                {financeCommissionCalculations.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold font-mono">
                    {financeCommissionCalculations.length}
                  </span>
                )}
              </div>
              {financeCommissionCalculations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {isFinanceCalculationsLoading ? (
              <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                Loading saved calculations from Firestore...
              </div>
            ) : financeCommissionCalculations.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
                No calculations saved yet. Click &quot;Save Record to Firestore Cloud&quot; above to store records.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {financeCommissionCalculations.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div 
                      onClick={() => handleLoadHistory(item)}
                      className="min-w-0 flex-1 cursor-pointer"
                      title="Click to load into calculator"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-white truncate">
                        <span>{item.applicantName || 'Client Financing'}</span>
                        {item.lenderName && (
                          <span className="text-[10px] text-sky-400 font-normal">({item.lenderName})</span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatCurrency(item.financeAmount, symbol)} @ {item.commissionRate}%</span>
                        <span className="text-emerald-400 font-bold">
                          = {formatCurrency(item.commissionAmount, symbol)}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{item.date}</span>
                        {item.referenceNote && <span className="truncate max-w-[150px]">Ref: {item.referenceNote}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                      title="Remove from Firestore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
