/**
 * Hand-written aliases over the generated schema.
 *
 * These used to live inside database.types.ts, which `npm run db:types`
 * overwrites wholesale, so regenerating types silently deleted them and broke
 * every import. They live here instead: this file is never generated.
 */
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type VehicleType = Enums['vehicle_type'];
export type TripStatus = Enums['trip_status'];
export type RequestStatus = Enums['request_status'];
export type PricingMode = Enums['pricing_mode'];
export type BidStatus = Enums['bid_status'];
export type DeliveryStatus = Enums['delivery_status'];
export type TransactionStatus = Enums['transaction_status'];

export type Profile = Tables['profiles']['Row'];
export type Trip = Tables['trips']['Row'];
export type DeliveryRequest = Tables['delivery_requests']['Row'];
export type Bid = Tables['bids']['Row'];
export type Delivery = Tables['deliveries']['Row'];
export type Transaction = Tables['transactions']['Row'];
export type Message = Tables['messages']['Row'];
export type LocationPing = Tables['location_pings']['Row'];
export type Review = Tables['reviews']['Row'];
export type PanicAlert = Tables['panic_alerts']['Row'];
export type Connection = Tables['connections']['Row'];

/** The precise address and contact fields, released only to the matched driver. */
export type RequestContactDetails = Tables['request_contact_details']['Row'];
export type NewRequestContactDetails = Tables['request_contact_details']['Insert'];

/** The slice of a profile joined onto trips and bids. */
export type DriverSummary = Pick<
  Profile,
  'id' | 'full_name' | 'avatar_url' | 'vehicle_type' | 'rating_avg' | 'rating_count'
>;

// ---- trust ladder (migration 11) ----
export type VerificationTier = Enums['verification_tier'];
export type VerificationKind = Enums['verification_kind'];
export type VerificationStatus = Enums['verification_status'];
export type ItemCategory = Enums['item_category'];
export type Verification = Tables['verifications']['Row'];
export type VerificationDocument = Tables['verification_documents']['Row'];
export type Vehicle = Tables['vehicles']['Row'];
export type ProfilePrivate = Tables['profile_private']['Row'];
export type PolicyDocument = Tables['policy_documents']['Row'];
export type ProhibitedItemRule = Tables['prohibited_item_rules']['Row'];
export type Consent = Tables['consents']['Row'];
export type DriverPublicTrust = Database['public']['Functions']['get_public_trust']['Returns'][number];
