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
