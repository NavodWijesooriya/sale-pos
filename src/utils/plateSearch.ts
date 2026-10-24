/**
 * Vehicle Registration Number search utilities.
 * Handles case-insensitive and whitespace/hyphen-insensitive searches
 * for Sri Lankan and standard vehicle registration numbers.
 * e.g., 'WP CA-1234', 'ca 1234', 'ca1234', '65-4321', 'BCC-5678', 'UNREGISTERED'
 */

export const normalizePlate = (str?: string | null): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const matchesVehicleNumber = (regPlate: string | undefined | null, searchInput: string): boolean => {
  if (!searchInput || !searchInput.trim()) return true;
  const normalizedPlate = normalizePlate(regPlate);
  const normalizedSearch = normalizePlate(searchInput);
  if (!normalizedSearch) return true;
  return normalizedPlate.includes(normalizedSearch);
};
