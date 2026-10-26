import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Calculator, 
  Percent, 
  Calendar, 
  Coins, 
  RotateCcw, 
  TrendingUp, 
  Sparkles, 
  Check, 
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Car
} from 'lucide-react';
import { formatCurrency, calculateFinanceInstallment } from '../utils/formatters';

interface FinanceInstallmentCalculatorProps {
  className?: string;
  defaultAmount?: number;
}

const COMMON_PERIOD_MONTHS = [12, 24, 36, 48, 60, 72];
const COMMON_RATES = [10, 12, 14, 16, 18, 20];

export const FinanceInstallmentCalculator: React.FC<FinanceInstallmentCalculatorProps> = ({ 
  className = '',
  defaultAmount
}) => {
  const { bikes, settings } = useDealership();
  const symbol = settings.currencySymbol;
  const inStockBikes = useMemo(() => bikes.filter(b => b.status === 'In Stock'), [bikes]);

  // State
  const [financeAmount, setFinanceAmount] = useState<number | ''>(defaultAmount ?? 0);
  const [annualInterestRate, setAnnualInterestRate] = useState<number | ''>(14);
  const [periodMonths, setPeriodMonths] = useState<number | ''>(36);
  const [calculationMethod, setCalculationMethod] = useState<'reducing' | 'flat'>('reducing');
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');

  // Auto calculate results
  const calculationResult = useMemo(() => {
    return calculateFinanceInstallment({
      financeAmount: Number(financeAmount) || 0,
      annualInterestRate: Number(annualInterestRate) || 0,
      periodMonths: Number(periodMonths) || 1,
      calculationMethod
    });
  }, [financeAmount, annualInterestRate, periodMonths, calculationMethod]);

  const { monthlyInstallment, totalAmountPayable, totalInterest, principalAmount } = calculationResult;

  // Percentage shares for visual bar
  const principalSharePercent = totalAmountPayable > 0 
    ? Math.min(100, Math.max(0, (principalAmount / totalAmountPayable) * 100))
    : 100;
  const interestSharePercent = totalAmountPayable > 0
    ? Math.min(100, Math.max(0, (totalInterest / totalAmountPayable) * 100))
    : 0;

  // Handler when selecting an in-stock vehicle
  const handleSelectBike = (bikeId: string) => {
    setSelectedBikeId(bikeId);
    if (!bikeId) return;
    const bike = bikes.find(b => b.id === bikeId);
    if (bike) {
      // Default to 80% financing of target price or total cost
      const target = Number(bike.targetSalePrice) || Number(bike.totalCost) || 0;
      setFinanceAmount(Math.round(target * 0.8));
    }
  };

  const handleReset = () => {
    setFinanceAmount(0);
    setAnnualInterestRate(14);
    setPeriodMonths(36);
    setCalculationMethod('reducing');
    setSelectedBikeId('');
  };

  return (
    <section 
      aria-label="Vehicle Financing Monthly Installment Calculator"
      className={`rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Background ambient accents */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/10 text-sky-400 border border-sky-500/25 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Vehicle Financing Tool</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Live Real-Time Calculations
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Monthly Installment & <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">Finance Calculator</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Estimate monthly installments and total repayment schedules for vehicle loans, bank financing, and lease facilities in Sri Lankan Rupees.
          </p>
        </div>

        {/* Quick action controls */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Reset calculator to default values"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Vehicle pre-fill selector (if vehicles in stock exist) */}
      {inStockBikes.length > 0 && (
        <div className="relative z-10 mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Car className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <span className="font-bold text-slate-200">Load from Showroom Stock:</span>
            <span className="text-slate-400 hidden md:inline">Select a vehicle to auto-fill 80% financing amount</span>
          </div>

          <div className="relative w-full sm:w-72">
            <select
              value={selectedBikeId}
              onChange={(e) => handleSelectBike(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 text-xs text-white rounded-xl px-3 py-2 pr-8 outline-none appearance-none transition-colors"
              aria-label="Select in-stock vehicle to populate finance amount"
            >
              <option value="">-- Choose In-Stock Vehicle (Optional) --</option>
              {inStockBikes.map((bike) => (
                <option key={bike.id} value={bike.id}>
                  {bike.year} {bike.make} {bike.model} ({formatCurrency(bike.targetSalePrice, symbol)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Main Grid: Inputs Column & Results Column */}
      <div className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Input Fields                                                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 sm:p-6">
          
          {/* Method Selector: Reducing Balance vs Flat Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                Interest Method
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {calculationMethod === 'reducing' ? 'Amortized Monthly EMI' : 'Leasing Flat Interest'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800" role="radiogroup" aria-label="Interest Calculation Method">
              <button
                type="button"
                role="radio"
                aria-checked={calculationMethod === 'reducing'}
                onClick={() => setCalculationMethod('reducing')}
                className={`py-2 px-3 min-h-[40px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  calculationMethod === 'reducing'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Reducing Balance (EMI)</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={calculationMethod === 'flat'}
                onClick={() => setCalculationMethod('flat')}
                className={`py-2 px-3 min-h-[40px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  calculationMethod === 'flat'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Flat Rate (Lease)</span>
              </button>
            </div>
          </div>

          {/* Field 1: Total Finance Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="calculator-finance-amount" className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                Total Finance Amount ({symbol})
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatCurrency(Number(financeAmount) || 0, symbol)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm select-none">
                {symbol}
              </span>
              <input
                id="calculator-finance-amount"
                type="number"
                min="0"
                step="5000"
                value={financeAmount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                  setFinanceAmount(val);
                }}
                placeholder="e.g. 1,000,000"
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl pl-12 pr-4 py-2.5 min-h-[46px] text-white font-mono text-base outline-none transition-all"
              />
            </div>

            {/* Quick amount presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Quick Add:</span>
              {[500000, 1000000, 1500000, 2000000, 3000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFinanceAmount(amt)}
                  className={`px-2.5 py-1 min-h-[30px] rounded-lg text-[11px] font-mono shrink-0 transition-colors border ${
                    financeAmount === amt 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {formatCurrency(amt, symbol)}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Annual Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="calculator-interest-rate" className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                Annual Interest Rate (% Per Annum)
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {Number(annualInterestRate) || 0}% p.a.
              </span>
            </div>

            <div className="relative">
              <input
                id="calculator-interest-rate"
                type="number"
                min="0"
                max="100"
                step="0.25"
                value={annualInterestRate}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                  setAnnualInterestRate(val);
                }}
                placeholder="e.g. 14"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-4 pr-10 py-2.5 min-h-[46px] text-white font-mono text-base outline-none transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm select-none">
                %
              </span>
            </div>

            {/* Quick rate presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Presets:</span>
              {COMMON_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setAnnualInterestRate(rate)}
                  className={`px-2.5 py-1 min-h-[30px] rounded-lg text-[11px] font-mono shrink-0 transition-colors border ${
                    annualInterestRate === rate
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Repayment Period in Months */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="calculator-period-months" className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                Repayment Period in Months
              </label>
              <span className="text-xs font-mono font-bold text-sky-400">
                {Number(periodMonths) || 0} Months ({((Number(periodMonths) || 0) / 12).toFixed(1)} Yrs)
              </span>
            </div>

            <div className="relative">
              <input
                id="calculator-period-months"
                type="number"
                min="1"
                max="120"
                step="1"
                value={periodMonths}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.max(1, Math.round(Number(e.target.value)));
                  setPeriodMonths(val);
                }}
                placeholder="e.g. 36"
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 rounded-xl pl-4 pr-20 py-2.5 min-h-[46px] text-white font-mono text-base outline-none transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs select-none">
                Months
              </span>
            </div>

            {/* Quick month presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Tenure:</span>
              {COMMON_PERIOD_MONTHS.map((m) => {
                const years = m / 12;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPeriodMonths(m)}
                    className={`px-2.5 py-1 min-h-[30px] rounded-lg text-[11px] font-mono shrink-0 transition-colors border ${
                      periodMonths === m
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {m}m ({years}y)
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Auto-Calculated Results & Outputs Display                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: Monthly Installment (HERO DISPLAY) */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                Monthly Installment
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {Number(periodMonths) || 1} monthly payments
              </span>
            </div>

            <div className="my-3">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 font-mono tracking-tight leading-none break-words">
                {formatCurrency(monthlyInstallment, symbol)}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Payable every month for {Number(periodMonths) || 1} months at {Number(annualInterestRate) || 0}% interest
              </p>
            </div>

            <div className="pt-3 border-t border-emerald-500/20 text-xs text-slate-300 flex items-center justify-between font-mono">
              <span>Per Day Equivalent:</span>
              <span className="text-emerald-300 font-bold">
                ~{formatCurrency(monthlyInstallment / 30, symbol)} / day
              </span>
            </div>
          </div>

          {/* Card 2: Total Amount Payable & Interest Breakdown */}
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            
            {/* Total Amount Payable */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Amount Payable
                </span>
                <span className="text-[11px] text-slate-500">
                  Principal + Total Interest
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {formatCurrency(totalAmountPayable, symbol)}
                </span>
              </div>
            </div>

            {/* Principal & Interest Detailed Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Finance (Principal)</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 block truncate">
                  {formatCurrency(principalAmount, symbol)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  {principalSharePercent.toFixed(1)}% of total
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-amber-500/20">
                <span className="text-[11px] text-amber-300 uppercase font-semibold block">Total Interest</span>
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5 block truncate">
                  +{formatCurrency(totalInterest, symbol)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                  {interestSharePercent.toFixed(1)}% of total
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar: Principal vs Interest */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Principal ({principalSharePercent.toFixed(0)}%)</span>
                <span className="text-amber-400">Interest ({interestSharePercent.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
                <div 
                  className="h-full bg-sky-500 transition-all duration-300" 
                  style={{ width: `${principalSharePercent}%` }} 
                  title={`Principal: ${principalSharePercent.toFixed(1)}%`}
                />
                <div 
                  className="h-full bg-amber-400 transition-all duration-300" 
                  style={{ width: `${interestSharePercent}%` }} 
                  title={`Interest: ${interestSharePercent.toFixed(1)}%`}
                />
              </div>
            </div>

            {/* Footer Summary Note */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Computed using <strong>{calculationMethod === 'reducing' ? 'standard reducing balance amortization (EMI)' : 'flat rate leasing schedule'}</strong>. Final quotations may vary based on lender documentation, insurance, and fees.
              </span>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
