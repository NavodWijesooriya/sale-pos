import React from 'react';
import { useDealership } from '../context/DealershipContext';
import { 
  Warehouse, 
  CheckCircle, 
  Wrench, 
  Landmark, 
  Percent, 
  ArrowUpRight, 
  DollarSign, 
  Plus, 
  ChevronRight, 
  Calendar,
  Calculator,
  Bike as BikeIcon,
  Sparkles,
  RefreshCw,
  BarChart3,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatNumber, calculateTotalOtherCosts } from '../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const DashboardView: React.FC = () => {
  const { profile } = useAuth();
  const { 
    bikes, 
    settings, 
    summary, 
    setActiveTab, 
    setIsAddBikeModalOpen, 
    openSaleModalForBike,
    openDetailModalForBike,
    resetToDefaultData,
    updateSettings
  } = useDealership();

  const inStockBikes = bikes.filter((b) => b.status === 'In Stock');
  const symbol = settings.currencySymbol;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Welcome / Dealership Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-4 sm:p-7 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-300">Welcome to Sales POS</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{profile?.businessName || 'Loading...'}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
                Dealership Operations Active (LKR)
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline" aria-hidden="true">•</span>
              <span className="text-slate-300 text-xs">
                Finance Commission: <strong className="text-amber-400">3.0%</strong>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Vehicle Sales & <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">Profit Command</span>
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Manage motorcycle inventory, cost prices, other repair and transport costs, selling prices, and automatic 3% finance commission calculations in Sri Lankan Rupees (LKR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setIsAddBikeModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex-1 sm:flex-initial"
              aria-label="Add new vehicle"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>Add Vehicle</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 font-bold text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
              aria-label="View Monthly Summary"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Monthly Summary</span>
            </button>

            <button
              type="button"
              onClick={() => void updateSettings({
                hideDashboardPriceCards: !settings.hideDashboardPriceCards
              }).catch(() => undefined)}
              aria-pressed={settings.hideDashboardPriceCards}
              aria-label={settings.hideDashboardPriceCards ? 'Show price cards' : 'Hide price cards'}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 font-bold text-xs sm:text-sm transition-all flex-1 sm:flex-initial"
            >
              {settings.hideDashboardPriceCards
                ? <Eye className="w-4 h-4 text-sky-400" aria-hidden="true" />
                : <EyeOff className="w-4 h-4 text-sky-400" aria-hidden="true" />}
              <span>{settings.hideDashboardPriceCards ? 'Show Price Cards' : 'Hide Price Cards'}</span>
            </button>
          </div>
        </div>

        {/* Highlight ticker with responsive wrapping */}
        {!settings.hideDashboardPriceCards && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-800/60 inline-flex flex-col min-w-[240px]">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Showroom Inventory Cost</div>
            <div className="text-sm sm:text-base lg:text-lg font-black text-white mt-0.5 font-mono truncate">
              {formatCurrency(summary.totalInventoryCost, symbol)}
            </div>
          </div>
        </div>
        )}
      </div>


      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
        
        {/* Total In Stock */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('inventory')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('inventory')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 focus-visible:border-sky-400 p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between h-full"
          aria-label={`View Bikes Inventory: ${summary.totalBikesInStock} in stock`}
        >
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Warehouse className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span>View Inventory</span> <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bikes In Stock</span>
              <div className="flex items-baseline gap-2 mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">{summary.totalBikesInStock}</span>
                <span className="text-xs text-slate-400 font-medium">units available</span>
              </div>
            </div>
            {!settings.hideDashboardPriceCards && (
              <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
                Asset Value: {formatCurrency(summary.totalInventoryCost, symbol)}
              </div>
            )}
          </div>
        </div>

        {/* Total Bikes Sold */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('sales')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('sales')}
          className="group cursor-pointer rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 focus-visible:border-emerald-400 p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between h-full"
          aria-label={`View Sales Ledger: ${summary.totalBikesSold} sold`}
        >
          <div className="flex items-center justify-between h-11 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span>Sales Ledger</span> <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bikes Sold</span>
              <div className="flex items-baseline gap-2 mt-1 h-9">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight leading-none">{summary.totalBikesSold}</span>
                <span className="text-xs text-slate-400 font-medium">completed transactions</span>
              </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono min-h-[30px] flex items-center">
              Cash: {summary.cashSalesCount} • Finance: {summary.financeSalesCount}
            </div>
          </div>
        </div>

      </div>




      {/* When Empty: Show Welcome & Action Card */}
      {bikes.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <BikeIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-black text-white">Welcome to Your Dealership Management System</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Start adding vehicles (cars or bikes) with purchase cost price, repair/transport expenses, and record cash or finance sales in Sri Lankan Rupees.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsAddBikeModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Vehicle</span>
            </button>

            <button
              onClick={() => void resetToDefaultData().catch(() => undefined)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 transition-transform active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <span>Load Sample Dealership Records</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Stock Showroom Vehicle Cards */}
      {bikes.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Warehouse className="w-5 h-5 text-sky-400" />
                <span>Vehicles in Stock ({inStockBikes.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Showroom inventory ready for sale with purchase cost, other costs, and profit targets
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 text-xs font-bold transition-all self-start sm:self-auto"
            >
              <span>All Inventory</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {inStockBikes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {inStockBikes.map((bike) => {
                const costPrice = Number(bike.purchasePrice) || 0;
                const otherCostsTotal = calculateTotalOtherCosts(bike.repairCosts);
                const totalCost = costPrice + otherCostsTotal;
                const targetPrice = Number(bike.targetSalePrice) || 0;
                const potentialProfit = targetPrice - totalCost;
                const potentialMargin = targetPrice > 0 ? (potentialProfit / targetPrice) * 100 : 0;

                return (
                  <div 
                    key={bike.id} 
                    className="group rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Image Section */}
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                      <img 
                        src={bike.imageUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'} 
                        alt={`${bike.make} ${bike.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide shadow-md bg-sky-500 text-slate-950">
                          IN STOCK
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700">
                          {bike.category}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-medium">
                        <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-slate-300 text-[11px] font-mono">
                          {bike.engineCapacityCc} cc
                        </span>
                        <span className="bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800 text-amber-300 text-[11px] font-bold">
                          {bike.condition}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 
                          onClick={() => openDetailModalForBike(bike)}
                          className="text-base font-black text-white hover:text-sky-400 cursor-pointer transition-colors leading-tight truncate"
                          title={`${bike.year} ${bike.make} ${bike.model}`}
                        >
                          {bike.year} {bike.make} {bike.model}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                          <span>Plate: <strong className="text-slate-200">{bike.regPlate}</strong></span>
                          {bike.mileage > 0 && (
                            <>
                              <span>•</span>
                              <span>{formatNumber(bike.mileage)} km</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Financial Breakdown Card with Cost Price, Other Costs, and Target Profit */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Cost Price:</span>
                          <span className="font-semibold text-slate-200 font-mono">{formatCurrency(costPrice, symbol)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-400">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-amber-400" />
                            Other Costs ({bike.repairCosts?.length || 0}):
                          </span>
                          <span className="font-semibold text-amber-400 font-mono">+{formatCurrency(otherCostsTotal, symbol)}</span>
                        </div>

                        <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center font-bold">
                          <span className="text-slate-300">Total Cost:</span>
                          <span className="text-white font-black font-mono">{formatCurrency(totalCost, symbol)}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Target Selling Price:</span>
                            <span className="font-black text-sky-400 font-mono">{formatCurrency(targetPrice, symbol)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-black pt-1 border-t border-slate-800/60">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Target Profit:
                            </span>
                            <span className="text-emerald-400 font-mono">
                              +{formatCurrency(potentialProfit, symbol)} ({potentialMargin.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => openDetailModalForBike(bike)}
                          className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-400"
                          aria-label={`View details for ${bike.make} ${bike.model}`}
                        >
                          <Eye className="w-4 h-4 text-sky-400" aria-hidden="true" />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openSaleModalForBike(bike)}
                          className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
                          aria-label={`Record sale for ${bike.make} ${bike.model}`}
                        >
                          <DollarSign className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                          <span>Sell</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <p className="text-sm font-bold text-slate-400">
                No vehicles currently in stock.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All vehicles have been sold. Click &quot;Add Vehicle&quot; to replenish stock.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
