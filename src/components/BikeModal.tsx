import React, { useState, useEffect, useRef } from 'react';
import { useDealership } from '../context/DealershipContext';
import { useAuth } from '../../context/AuthContext';
import { BikeCategory, BikeCondition, OtherCostItem, OtherCostCategory, VehicleType } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Wrench, 
  Check, 
  TrendingUp, 
  FileText, 
  Truck, 
  ShieldCheck, 
  SlidersHorizontal,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Phone,
  MapPin,
  UserCheck,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency, calculateTotalOtherCosts } from '../utils/formatters';
import { uploadVehiclePhoto, validateImageFile } from '../utils/imageUpload';

interface BikeModalProps {
  isEdit?: boolean;
}

const BIKE_MAKES = ['Honda', 'Yamaha', 'Bajaj', 'TVS', 'Hero', 'Suzuki', 'Kawasaki', 'KTM', 'Royal Enfield'];
const CAR_MAKES = ['Toyota', 'Suzuki', 'Nissan', 'Honda', 'Hyundai', 'Mitsubishi', 'Kia', 'Daihatsu', 'Mazda', 'Mercedes-Benz'];
const VEHICLE_TYPES: VehicleType[] = ['Light Vehicle', 'Bike', 'Three-Wheeler', 'Heavy Vehicle'];

const OTHER_COST_CATEGORIES: { label: string; category: OtherCostCategory; icon: any }[] = [
  { label: 'Repair', category: 'Repair', icon: Wrench },
  { label: 'Spare Parts', category: 'Spare Parts', icon: SlidersHorizontal },
  { label: 'Transport', category: 'Transport', icon: Truck },
  { label: 'Documentation', category: 'Documentation', icon: FileText },
  { label: 'Service', category: 'Service', icon: ShieldCheck },
  { label: 'Paint/Polish', category: 'Paint/Polish', icon: Sparkles },
];

export const BikeModal: React.FC<BikeModalProps> = ({ isEdit = false }) => {
  const { user } = useAuth();
  const { 
    isAddBikeModalOpen, 
    setIsAddBikeModalOpen, 
    isEditBikeModalOpen, 
    setIsEditBikeModalOpen, 
    selectedBike, 
    addBike, 
    updateBike,
    setActiveTab,
    settings 
  } = useDealership();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = isEdit ? isEditBikeModalOpen : isAddBikeModalOpen;
  const onClose = () => (isEdit ? setIsEditBikeModalOpen(false) : setIsAddBikeModalOpen(false));

  const symbol = settings.currencySymbol;

  // Basic Details
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bike');
  const [make, setMake] = useState('Honda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [category, setCategory] = useState<BikeCategory>('Manual');
  const [condition, setCondition] = useState<BikeCondition>('Used');
  const [regPlate, setRegPlate] = useState('');
  const [isUnregistered, setIsUnregistered] = useState(false);

  // Supplier Details (Required Name & Phone, Optional Address)
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  // Vehicle Photos (Multi-photo upload + preview)
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);

  // Financial fields
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [targetSalePrice, setTargetSalePrice] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Other Costs
  const [otherCosts, setOtherCosts] = useState<OtherCostItem[]>([]);
  const [newCostCategory, setNewCostCategory] = useState<OtherCostCategory>('Repair');
  const [newCostDesc, setNewCostDesc] = useState('');
  const [newCostAmount, setNewCostAmount] = useState<number | ''>('');
  const [newCostInvoice, setNewCostInvoice] = useState('');

  // Optional Extra Specs (Collapsible)
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState(false);
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [color, setColor] = useState('Black');
  const [engineCapacityCc, setEngineCapacityCc] = useState<number | ''>(125);
  const [notes, setNotes] = useState('');

  // Error & Saving States
  const [formError, setFormError] = useState('');
  const [costError, setCostError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEdit && selectedBike) {
      setVehicleType(selectedBike.vehicleType || 'Bike');
      setMake(selectedBike.make);
      setModel(selectedBike.model);
      setYear(selectedBike.year);
      setCategory(selectedBike.category);
      setVin(selectedBike.vin);
      setRegPlate(selectedBike.regPlate);
      setIsUnregistered(selectedBike.regPlate.toUpperCase() === 'UNREGISTERED' || selectedBike.regPlate === 'UNREG');
      setMileage(selectedBike.mileage || '');
      setColor(selectedBike.color);
      setEngineCapacityCc(selectedBike.engineCapacityCc || '');
      setCondition(selectedBike.condition);
      setCostPrice(selectedBike.purchasePrice);
      setPurchaseDate(selectedBike.purchaseDate);
      setTargetSalePrice(selectedBike.targetSalePrice);
      
      // Supplier info
      setSupplierName(selectedBike.supplierName || selectedBike.supplierOrSeller || '');
      setSupplierAddress(selectedBike.supplierAddress || '');
      setSupplierPhone(selectedBike.supplierPhone || '');

      // Photos
      const existingPhotos = selectedBike.imageUrls && selectedBike.imageUrls.length > 0
        ? selectedBike.imageUrls
        : (selectedBike.imageUrl ? [selectedBike.imageUrl] : []);
      setPhotos(existingPhotos);
      setPhotoError('');
      setCustomPhotoUrl('');
      setShowPhotoUrlInput(false);

      setNotes(selectedBike.notes || '');
      setOtherCosts(selectedBike.repairCosts || []);
      setShowAdvancedSpecs(!!(selectedBike.vin || selectedBike.notes));
    } else if (!isEdit) {
      setVehicleType('Bike');
      setMake('Honda');
      setModel('');
      setYear(new Date().getFullYear());
      setCategory('Manual');
      setVin('');
      setRegPlate('');
      setIsUnregistered(false);
      setMileage('');
      setColor('Black');
      setEngineCapacityCc(125);
      setCondition('Used');
      setCostPrice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setSupplierName('');
      setSupplierAddress('');
      setSupplierPhone('');
      setPhotos([]);
      setPhotoError('');
      setCustomPhotoUrl('');
      setShowPhotoUrlInput(false);
      setTargetSalePrice('');
      setNotes('');
      setOtherCosts([]);
      setShowAdvancedSpecs(false);
      setNewCostDesc('');
      setNewCostAmount('');
    }
    setFormError('');
    setCostError('');
  }, [isEdit, selectedBike, isOpen]);

  if (!isOpen) return null;

  // Real-time Profit Calculation Feature
  const numCostPrice = Number(costPrice) || 0;
  const totalOtherCosts = calculateTotalOtherCosts(otherCosts);
  const totalCost = numCostPrice + totalOtherCosts;
  const numSalePrice = Number(targetSalePrice) || 0;
  const netProfit = numSalePrice - totalCost;
  const profitMarginPercent = numSalePrice > 0 ? (netProfit / numSalePrice) * 100 : 0;
  const isProfitable = netProfit > 0;
  const isBreakEven = netProfit === 0;

  // Phone Validation helper
  const validatePhone = (phoneStr: string): boolean => {
    const cleaned = phoneStr.replace(/[\s\-\(\)]/g, '');
    return /^(\+?\d{9,15})$/.test(cleaned);
  };

  // Handle Photo File Pick
  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setPhotoError('');
    setIsUploadingPhoto(true);
    const files = Array.from(e.target.files);
    const newUploaded: string[] = [];

    try {
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setPhotoError(validation.error || 'Invalid photo file.');
          continue;
        }
        const uploadedUrl = await uploadVehiclePhoto(file, user?.uid || 'guest');
        newUploaded.push(uploadedUrl);
      }
      if (newUploaded.length > 0) {
        setPhotos((prev) => [...prev, ...newUploaded]);
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add custom URL photo
  const handleAddCustomPhotoUrl = () => {
    if (!customPhotoUrl.trim()) return;
    try {
      new URL(customPhotoUrl.trim());
      setPhotos((prev) => [...prev, customPhotoUrl.trim()]);
      setCustomPhotoUrl('');
      setShowPhotoUrlInput(false);
      setPhotoError('');
    } catch {
      setPhotoError('Please enter a valid image URL starting with http:// or https://');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryPhoto = (index: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });
  };

  const handleAddOtherCost = () => {
    setCostError('');
    if (!newCostAmount || Number(newCostAmount) <= 0) {
      setCostError('Please enter a valid expense amount in Sri Lankan Rupees.');
      return;
    }
    const description = newCostDesc.trim() || `${newCostCategory} Expense`;
    const newItem: OtherCostItem = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      category: newCostCategory,
      description,
      cost: Number(newCostAmount),
      date: new Date().toISOString().split('T')[0],
      ...(newCostInvoice.trim() ? { invoiceRef: newCostInvoice.trim() } : {})
    };

    setOtherCosts([...otherCosts, newItem]);
    setNewCostDesc('');
    setNewCostAmount('');
    setNewCostInvoice('');
  };

  const handleRemoveOtherCost = (id: string) => {
    setOtherCosts(otherCosts.filter(c => c.id !== id));
  };

  const handleQuickCategorySelect = (cat: OtherCostCategory) => {
    setCostError('');
    setNewCostCategory(cat);
    if (!newCostDesc) {
      setNewCostDesc(`${cat}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setFormError('');

    // Vehicle details validation
    if (!model.trim()) {
      setFormError('Please enter the vehicle or model name.');
      return;
    }
    if (year === '' || year < 1980 || year > new Date().getFullYear() + 1) {
      setFormError(`Please enter a model year between 1980 and ${new Date().getFullYear() + 1}.`);
      return;
    }

    // Supplier details validation (Required Name & Phone)
    if (!supplierName.trim()) {
      setFormError('Please enter the Supplier Name in the Supplier Information section.');
      return;
    }
    if (!supplierPhone.trim()) {
      setFormError('Please enter the Supplier Phone Number in the Supplier Information section.');
      return;
    }
    if (!validatePhone(supplierPhone)) {
      setFormError('Please enter a valid Supplier Phone Number (e.g. 0771234567 or +94771234567).');
      return;
    }

    // Financial validation
    if (numCostPrice <= 0) {
      setFormError('Please enter a valid purchase / cost price for the vehicle.');
      return;
    }

    const finalRegPlate = isUnregistered
      ? 'UNREGISTERED'
      : (regPlate.trim() ? regPlate.trim().toUpperCase() : 'UNREG');

    const defaultImg = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
    const primaryImg = photos[0] || defaultImg;
    const finalSalePrice = numSalePrice > 0 ? numSalePrice : Math.round(totalCost * 1.2);

    const bikePayload = {
      vehicleType,
      make: make.trim(),
      model: model.trim(),
      year: Number(year) || new Date().getFullYear(),
      category,
      vin: vin.trim() || (isEdit && selectedBike ? selectedBike.vin : `VIN-${Date.now().toString().slice(-8)}`),
      regPlate: finalRegPlate,
      mileage: Number(mileage) || 0,
      color: color.trim() || 'Black',
      engineCapacityCc: Number(engineCapacityCc) || 125,
      condition,
      purchasePrice: numCostPrice,
      purchaseDate,
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim(),
      supplierPhone: supplierPhone.trim(),
      supplierOrSeller: supplierName.trim(),
      targetSalePrice: finalSalePrice,
      imageUrl: primaryImg,
      imageUrls: photos.length > 0 ? photos : [primaryImg],
      notes: notes.trim(),
      repairCosts: otherCosts
    };

    if (isEdit && selectedBike) {
      setIsSaving(true);
      try {
        await updateBike(selectedBike.id, bikePayload);
        onClose();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Vehicle could not be updated. Check your connection and try again.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      await addBike(bikePayload);
      setActiveTab('dashboard');
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Vehicle could not be saved. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bike-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30">
                {isEdit ? 'Update Vehicle' : 'New Vehicle Entry'}
              </span>
              <span className="text-[11px] text-slate-400">
                Currency: <strong className="text-white">{symbol} (LKR)</strong>
              </span>
            </div>
            <h2 id="bike-modal-title" className="text-lg sm:text-xl font-black text-white mt-1">
              {isEdit ? `Edit ${selectedBike?.make} ${selectedBike?.model}` : 'Add Vehicle, Photos & Supplier Details'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : 'Save Vehicle'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Close vehicle dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">

          {/* Form Error Banner */}
          {formError && (
            <div 
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                <X className="w-4 h-4 text-rose-400" aria-hidden="true" />
              </div>
              <span className="font-semibold">{formError}</span>
            </div>
          )}

          {/* Section 1: Vehicle Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">1</span>
                Vehicle Classification & Details
              </h3>
              <span className="text-[11px] text-slate-400">Basic Info</span>
            </div>

            {/* Vehicle Type Switcher */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Vehicle Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleType(type)}
                    className={`flex items-center justify-center py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                      vehicleType === type
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Brand selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Brand / Make *</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(vehicleType === 'Bike' ? BIKE_MAKES : CAR_MAKES).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMake(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      make === m 
                        ? 'bg-sky-500 text-slate-950 shadow-sm' 
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                placeholder="Or type custom brand..."
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Model Name & Variant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pulsar 150, FZ-S V3, Activa 6G, Dio, Wagon R, Alto"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Model Year *</label>
                <input
                  type="number"
                  required
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vehicle Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BikeCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="Auto">Auto</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400">Registration Plate</label>
                  <label className="text-[10px] text-sky-400 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnregistered}
                      onChange={(e) => {
                        setIsUnregistered(e.target.checked);
                        if (e.target.checked) setRegPlate('');
                      }}
                      className="rounded accent-sky-500"
                    />
                    <span>Unregistered</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={isUnregistered}
                  placeholder={isUnregistered ? 'UNREGISTERED' : 'e.g. WP CA-1234, 65-4321'}
                  value={isUnregistered ? 'UNREGISTERED' : regPlate}
                  onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                  className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono font-bold uppercase ${
                    isUnregistered ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as BikeCondition)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
                >
                  <option value="Used">Used / Registered</option>
                  <option value="Brand New">Brand New</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Photos (Multi-photo upload & preview) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  Vehicle Photos
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload one or more photos. The first photo will be used as the primary showcase image.
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
                {photos.length} Photo{photos.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Photo Error Banner */}
            {photoError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Upload Action Area */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePhotoFilesSelected}
                className="hidden"
                id="vehicle-photo-input"
              />
              <label
                htmlFor="vehicle-photo-input"
                className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl border-2 border-dashed transition-all cursor-pointer text-xs font-bold ${
                  isUploadingPhoto
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 cursor-wait'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800/80 hover:border-indigo-400 text-slate-200'
                }`}
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Compressing & Uploading Photos...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload Vehicle Photos (JPEG, PNG, WebP &lt; 5MB)</span>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowPhotoUrlInput(!showPhotoUrlInput)}
                className="px-3.5 py-3 min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors shrink-0"
              >
                {showPhotoUrlInput ? 'Hide URL Input' : 'Add via URL'}
              </button>
            </div>

            {/* Optional URL input */}
            {showPhotoUrlInput && (
              <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or direct image link"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPhotoUrl}
                  className="px-4 py-2.5 min-h-[40px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shrink-0"
                >
                  Add Photo
                </button>
              </div>
            )}

            {/* Thumbnails Preview Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {photos.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between shadow-md"
                  >
                    <img
                      src={url}
                      alt={`Vehicle view ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Primary Badge */}
                    <div className="absolute top-1.5 left-1.5">
                      {idx === 0 ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase shadow">
                          <Star className="w-2.5 h-2.5 fill-current" /> Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(idx)}
                          className="px-1.5 py-0.5 rounded bg-slate-900/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 text-[9px] font-bold border border-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                          title="Set as primary showcase photo"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>

                    {/* Remove Action */}
                    <div className="absolute top-1.5 right-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 rounded-lg bg-rose-500/90 hover:bg-rose-600 text-white shadow transition-all opacity-0 group-hover:opacity-100"
                        title="Remove photo"
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-1 right-1.5 text-[9px] text-slate-400 font-mono bg-slate-950/70 px-1 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-1">
                <ImageIcon className="w-7 h-7 mx-auto text-slate-600" />
                <p>No vehicle photos uploaded yet.</p>
                <p className="text-[10px] text-slate-600">A default vehicle silhouette will be used if no photo is provided.</p>
              </div>
            )}
          </div>

          {/* Section 3: Supplier Information */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">3</span>
                  Supplier Information
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record vehicle source, seller/supplier name, address, and contact number.
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Required Fields *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Supplier Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  Supplier / Seller Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Motors, Sunil Perera, Ceylon Auctions"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white font-medium outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/30"
                />
              </div>

              {/* Supplier Phone Number */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Supplier Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0771234567 or +94771234567"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white font-mono font-medium outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                />
              </div>

              {/* Supplier Address */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Supplier Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. No. 45, Kandy Road, Kadawatha"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/30"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cost Price & Target Selling Price */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">4</span>
                Cost Price & Target Selling Price
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold">Base Financials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cost Price */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-200">
                    Cost Price ({symbol}) *
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Vehicle purchase cost</span>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="e.g. 750000"
                    value={costPrice}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-2.5 text-sm text-white font-mono font-black outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                  <span>Formatted:</span>
                  <strong className="text-slate-200 font-mono">{formatCurrency(numCostPrice, symbol)}</strong>
                </div>
              </div>

              {/* Selling Price */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-200">
                    Selling Price / Target Price ({symbol}) *
                  </label>
                  <span className="text-[10px] text-sky-400 font-medium">Expected showroom price</span>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 950000"
                    value={targetSalePrice}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => setTargetSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3 py-2.5 text-sm text-white font-mono font-black outline-none focus:border-sky-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                  <span>Formatted:</span>
                  <strong className="text-sky-300 font-mono">{formatCurrency(numSalePrice, symbol)}</strong>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Acquisition / Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full sm:w-60 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Section 5: Other Costs (Additional Expenses) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">5</span>
                  Other Costs (Additional Expenses)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record repair, spare parts, transport, documentation, transfer fees, or service expenses.
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Total Other Costs: +{formatCurrency(totalOtherCosts, symbol)}
              </span>
            </div>

            {/* Quick Category Chips */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Category:
              </span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Expense categories">
                {OTHER_COST_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = newCostCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => handleQuickCategorySelect(cat.category)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Expense Error */}
            {costError && (
              <div 
                role="alert"
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn"
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                </div>
                <span>{costError}</span>
              </div>
            )}

            {/* Input Row for New Expense */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-800/80">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  aria-label="Expense description"
                  placeholder="Expense description (e.g. New Battery, Buffing)"
                  value={newCostDesc}
                  onChange={(e) => {
                    setNewCostDesc(e.target.value);
                    setCostError('');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-4 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">{symbol}</span>
                <input
                  type="number"
                  aria-label="Cost amount"
                  placeholder="Cost Amount"
                  min="0"
                  step="any"
                  value={newCostAmount}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => {
                    setNewCostAmount(e.target.value === '' ? '' : Number(e.target.value));
                    setCostError('');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm text-white font-mono font-bold outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddOtherCost}
                  className="w-full py-2.5 px-3 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* List of Other Costs */}
            {otherCosts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {otherCosts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 text-xs"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                        {item.category || 'Expense'}
                      </span>
                      <span className="font-semibold text-white truncate">{item.description}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-amber-400">
                        +{formatCurrency(item.cost, symbol)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherCost(item.id)}
                        className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
                        title="Remove expense"
                        aria-label={`Remove expense ${item.description}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2.5 text-[11px] text-slate-500 italic bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                No additional expenses recorded yet. Use the inputs above to add repairs, parts, or transport.
              </div>
            )}
          </div>

          {/* Section 6: Real-time Profit Feature */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Profit & Cost Calculation Feature
              </h3>
              <span className="text-[10px] text-slate-400">Live Breakdown</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cost Price</span>
                <div className="text-sm sm:text-base font-bold text-slate-200 mt-1 font-mono">
                  {formatCurrency(numCostPrice, symbol)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-amber-400 uppercase font-semibold">+ Other Costs</span>
                <div className="text-sm sm:text-base font-bold text-amber-400 mt-1 font-mono">
                  +{formatCurrency(totalOtherCosts, symbol)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-white uppercase font-black">= Total Cost</span>
                <div className="text-sm sm:text-base font-black text-white mt-1 font-mono">
                  {formatCurrency(totalCost, symbol)}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Cost + Other Expenses</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-sky-400 uppercase font-semibold">Selling Price</span>
                <div className="text-sm sm:text-base font-black text-sky-400 mt-1 font-mono">
                  {formatCurrency(numSalePrice, symbol)}
                </div>
              </div>
            </div>

            {/* Calculated Profit Badge */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isProfitable 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : isBreakEven
                ? 'bg-slate-900 border-slate-700 text-slate-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {isProfitable ? 'Projected Net Profit' : isBreakEven ? 'Break Even' : 'Projected Deficit'}
                </span>
                <div className="text-xl sm:text-2xl font-black mt-0.5 font-mono flex items-baseline gap-2">
                  <span className={isProfitable ? 'text-emerald-400' : isBreakEven ? 'text-white' : 'text-rose-400'}>
                    {isProfitable ? '+' : ''}{formatCurrency(netProfit, symbol)}
                  </span>
                  {numSalePrice > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950/60 font-bold border border-current">
                      {profitMarginPercent.toFixed(1)}% margin
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 max-w-xs leading-tight sm:text-right">
                <span>Calculated as: </span>
                <strong className="text-slate-200">Selling Price − (Cost Price + Other Costs)</strong>.
                <div className="text-[10px] text-amber-400/90 mt-0.5">
                  ★ Finance sales automatically earn an extra 3% commission on finance amount.
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Optional Advanced Specs (Collapsible) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
              className="w-full flex items-center justify-between p-3.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span className="font-semibold flex items-center gap-2">
                <span>Optional Specifications (VIN, Mileage, Color, Engine CC, Notes)</span>
              </span>
              {showAdvancedSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedSpecs && (
              <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/70 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Chassis / VIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. MC21-1002345"
                      value={vin}
                      onChange={(e) => setVin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Odometer Mileage (km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 24500"
                      value={mileage}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Pearl White, Matte Black"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Engine Capacity (CC)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={engineCapacityCc}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => setEngineCapacityCc(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Vehicle Notes & Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Documentation notes, accessories included, ownership details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 sticky bottom-0 bg-slate-900/95 py-2.5 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Check className="w-5 h-5 stroke-[3]" aria-hidden="true" />
              <span>{isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Vehicle to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
