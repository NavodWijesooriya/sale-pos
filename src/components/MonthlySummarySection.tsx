import React, { useState, useMemo } from 'react';
import { useDealership } from '../context/DealershipContext';
import { MonthlySummary } from '../types';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Layers,
  CheckCircle,
  DollarSign,
  Wrench
} from 'lucide-react';
import { 
  formatCurrency, 
  calculateMonthlySummary, 
  generateMonthByMonthComparison 
} from '../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlySummarySection: React.FC = () => {
  const { bikes, settings } = useDealership();
  const symbol = settings.currencySymbol;

  // Current date initialization
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Month-by-month comparative data across all recorded months (for quick month selector badges)
  const monthlyComparisons = useMemo(() => {
    return generateMonthByMonthComparison(bikes, 12);
  }, [bikes]);

  // Extract all distinct years available in records, plus current & adjacent years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([now.getFullYear(), now.getFullYear() - 1, 2026]);
    bikes.forEach((b) => {
      if (b.sale?.saleDate) {
        const y = new Date(b.sale.saleDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [bikes, now]);

  // Compute selected month's 12 exact metric definitions
  const currentMonthSummary: MonthlySummary = useMemo(() => {
    return calculateMonthlySummary(bikes, selectedYear, selectedMonth);
  }, [bikes, selectedYear, selectedMonth]);

  // Quick navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Check if selected month is the active current calendar month
  const isCurrentCalendarMonth = 
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  return (
    <section className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-sky-500/20 to-emerald-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Monthly Summary & Internal P&L
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Internal Business Reporting Only (Cost Figures Hidden From Customer Documents)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{currentMonthSummary.monthLabel}</span>
            <span className="text-slate-500 text-lg font-normal font-sans">Performance</span>
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            All figures calculated strictly based on transactions recorded within <strong className="text-slate-200">{currentMonthSummary.monthLabel}</strong>.
          </p>
        </div>

        {/* Date Selector Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 p-2 sm:p-2.5 rounded-2xl border border-slate-800 self-start lg:self-center">
          
          {/* Previous Month */}
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Selector Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer font-mono"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Next Month */}
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Current Month Quick Jump */}
          {!isCurrentCalendarMonth && (
            <button
              onClick={handleJumpToCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Quick Month Badges Selector (Fast-switching between recorded months) */}
      {monthlyComparisons.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Months:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {monthlyComparisons.map((m) => {
              const isSelected = m.year === selectedYear && m.month === selectedMonth;
              return (
                <button
                  key={m.monthKey}
                  onClick={() => {
                    setSelectedYear(m.year);
                    setSelectedMonth(m.month);
                  }}
                  className={`px-3 py-1 rounded-xl font-bold text-xs shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20 font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {m.shortMonthLabel}
                  {m.totalVehiclesSold > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.totalVehiclesSold} sold
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12 METRIC DEFINITIONS CARDS GRID                                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Section Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              {currentMonthSummary.monthLabel} Metric Definitions
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {currentMonthSummary.totalVehiclesSold} transactions recorded
          </span>
        </div>

        {/* 1. Core Volume & High-Level Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Metric 1: Total Vehicles Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 h-8 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Vehicles Sold</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="my-3 flex items-center gap-2 h-9 shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
                {currentMonthSummary.totalVehiclesSold}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">units sold</span>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  🚗 Cars: <strong className="text-white">{currentMonthSummary.carsSold}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  🏍️ Bikes: <strong className="text-white">{currentMonthSummary.bikesSold}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Total Sales Revenue */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 h-8 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Sales Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="my-3 flex items-center h-9 shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none truncate">
                {formatCurrency(currentMonthSummary.totalSalesRevenue, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                Full selling price before deducting costs or expenses
              </p>
            </div>
          </div>

          {/* Metric 3: Total Expenses */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2 h-8 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 truncate">Total Expenses</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Wrench className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="my-3 flex items-center h-9 shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight leading-none truncate">
                {formatCurrency(currentMonthSummary.totalExpenses, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-800/80 min-h-[46px] flex items-center shrink-0">
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                Transport, repairs, registration, commissions & other expenses
              </p>
            </div>
          </div>
        </div>

        {/* 2. Primary Profitability Equations Ribbon (Gross Profit & Net Profit) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Metric 7: Gross Profit (Total Sales Revenue − Total Vehicle Cost) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 border border-sky-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between h-8 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Gross Profit Metric
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  Gross Profit
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                  Margin: {currentMonthSummary.grossMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="my-3 flex items-center h-10 shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-sky-300 font-mono tracking-tight leading-none truncate">
                {formatCurrency(currentMonthSummary.grossProfit, symbol)}
              </span>
            </div>

            {/* Formula Callout */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono min-h-[38px] shrink-0">
              <span>Formula:</span>
              <span className="font-bold text-slate-100 truncate ml-2">
                Revenue ({formatCurrency(currentMonthSummary.totalSalesRevenue, symbol)}) − Vehicle Cost ({formatCurrency(currentMonthSummary.totalVehicleCost, symbol)})
              </span>
            </div>
          </div>

          {/* Metric 8: Net Profit (Gross Profit − Total Expenses) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-5 shadow-xl flex flex-col justify-between h-full">
            <div className="flex items-center justify-between h-8 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Net Profit Metric
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  Net Profit
                </h4>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  currentMonthSummary.netProfit >= 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  Margin: {currentMonthSummary.netMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="my-3 flex items-center h-10 shrink-0">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none truncate ${
                currentMonthSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(currentMonthSummary.netProfit, symbol)}
              </span>
            </div>

            {/* Formula Callout */}
            <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono min-h-[38px] shrink-0">
              <span>Formula:</span>
              <span className="font-bold text-slate-100 truncate ml-2">
                Gross Profit ({formatCurrency(currentMonthSummary.grossProfit, symbol)}) − Total Expenses ({formatCurrency(currentMonthSummary.totalExpenses, symbol)})
              </span>
            </div>
          </div>
        </div>

        {/* 3. Sales Breakdown & Financing Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Metric 9: Cash Sales */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider h-5 flex items-center shrink-0">Cash Sales</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono truncate">
                {formatCurrency(currentMonthSummary.cashSales, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              {currentMonthSummary.cashSalesCount} cash deals
            </div>
          </div>

          {/* Metric 10: Finance Sales */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-amber-400 h-5 flex items-center shrink-0">Finance Sales</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.financeSales, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              {currentMonthSummary.financeSalesCount} finance deals
            </div>
          </div>

          {/* Metric 4: Total Down Payments */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-teal-400 h-5 flex items-center shrink-0">Total Down Payments</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-teal-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.totalDownPayments, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Collected from buyers
            </div>
          </div>

          {/* Metric 5: Total Finance Amount */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-sky-400 h-5 flex items-center shrink-0">Total Finance Amount</div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-sky-400 font-mono truncate">
                {formatCurrency(currentMonthSummary.totalFinanceAmount, symbol)}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Financed via providers
            </div>
          </div>

          {/* Metric 11: Cars Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 h-5 shrink-0">
              <span>🚗</span> Cars Sold
            </div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {currentMonthSummary.carsSold}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Four-wheeler cars
            </div>
          </div>

          {/* Metric 12: Bikes Sold */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between h-full">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 h-5 shrink-0">
              <span>🏍️</span> Bikes Sold
            </div>
            <div className="my-1.5 flex items-center h-7 shrink-0">
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {currentMonthSummary.bikesSold}
              </span>
            </div>
            <div className="mt-auto pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500 min-h-[26px] flex items-center shrink-0">
              Two-wheeler bikes
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
