import type { VehicleType } from './types';

export const VEHICLE_TYPES: { value: VehicleType; label: string; maxWeightKg: number; maxSize: string }[] = [
  { value: 'scooter', label: 'Scooter', maxWeightKg: 5, maxSize: 'Small (backpack-sized)' },
  { value: 'bike', label: 'Bike', maxWeightKg: 10, maxSize: 'Small–medium (pannier-sized)' },
  { value: 'car', label: 'Car', maxWeightKg: 50, maxSize: 'Medium (trunk-sized)' },
  { value: 'truck', label: 'Truck', maxWeightKg: 500, maxSize: 'Large (furniture-sized)' },
];

export const PLATFORM_FEE_RATE = 0.1;

export const EMERGENCY_CONTACT = {
  label: 'ONDIGO Trust & Safety',
  phone: '+18005550142',
  note: 'If you are in immediate danger, call your local emergency number first (911 in the US).',
};

export const LEGAL_DECLARATION_TEXT =
  'I confirm this item is not illegal, hazardous, or a prohibited good, and I accept full liability for its contents.';

/** Plain words for each rung of the trust ladder, in order. */
export const TIER_LABELS: Record<string, { label: string; unlocks: string }> = {
  none: { label: 'Account', unlocks: 'Browse requests, trips and profiles' },
  contactable: { label: 'Contactable', unlocks: 'Post a trip or a request, message on a delivery' },
  identified: { label: 'Identified', unlocks: 'Bid and carry items up to 10 kg' },
  road_ready: { label: 'Road ready', unlocks: 'Bid on car and truck jobs' },
  screened: { label: 'Screened', unlocks: 'Jobs above the value threshold' },
  payable: { label: 'Payable', unlocks: 'Receive payouts' },
};

export const ITEM_CATEGORIES: { value: string; label: string }[] = [
  { value: 'boxes_parcels', label: 'Boxes and parcels' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'sports_outdoor', label: 'Sports and outdoor' },
  { value: 'instruments', label: 'Musical instruments' },
  { value: 'art_fragile', label: 'Art and fragile pieces' },
  { value: 'documents', label: 'Documents' },
  { value: 'vehicle_parts', label: 'Vehicle parts and tyres' },
  { value: 'plants_garden', label: 'Plants and garden' },
  { value: 'other', label: 'Something else' },
  { value: 'household_move', label: 'A whole-household move' },
];

/** Which drivers may take an item of this weight: any courier, a car, or a truck. */
export function vehicleClassForWeight(kg: number): 'bike' | 'car' | 'truck' {
  return kg <= 10 ? 'bike' : kg <= 50 ? 'car' : 'truck';
}
