// Hand-written to match supabase/migrations/*.sql. Once `supabase start` is running,
// regenerate the authoritative version with `npm run db:types` from the repo root.

export type VehicleType = 'car' | 'truck' | 'bike' | 'scooter';
export type TripStatus = 'active' | 'completed' | 'cancelled';
export type PricingMode = 'fixed' | 'auction';
export type RequestStatus = 'open' | 'matched' | 'cancelled';
export type BidStatus = 'active' | 'outbid' | 'accepted' | 'rejected';
export type DeliveryStatus = 'pending_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'disputed';
export type TransactionStatus = 'held' | 'released' | 'refunded';

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  vehicle_type: VehicleType | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export type DriverSummary = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'vehicle_type' | 'rating_avg' | 'rating_count'>;

export type Connection = {
  follower_id: string;
  following_id: string;
  traded: boolean;
  created_at: string;
}

export type Trip = {
  id: string;
  driver_id: string;
  origin_text: string;
  origin_lat: number;
  origin_lng: number;
  destination_text: string;
  destination_lat: number;
  destination_lng: number;
  depart_at: string;
  vehicle_type: VehicleType;
  capacity_weight_kg: number;
  capacity_size: string;
  notes: string | null;
  status: TripStatus;
  created_at: string;
}

export type DeliveryRequest = {
  id: string;
  sender_id: string;
  item_description: string;
  item_size: string;
  item_weight_kg: number;
  pickup_text: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_text: string;
  dropoff_lat: number;
  dropoff_lng: number;
  needed_by: string;
  pricing_mode: PricingMode;
  fixed_price: number | null;
  starting_price: number | null;
  current_price: number | null;
  bidding_ends_at: string | null;
  extend_on_bid: boolean;
  extend_seconds: number;
  legal_declaration_accepted: boolean;
  status: RequestStatus;
  matched_trip_id: string | null;
  matched_driver_id: string | null;
  created_at: string;
}

export type Bid = {
  id: string;
  request_id: string;
  driver_id: string;
  amount: number;
  status: BidStatus;
  created_at: string;
}

export type Delivery = {
  id: string;
  request_id: string;
  trip_id: string | null;
  driver_id: string;
  sender_id: string;
  agreed_price: number;
  status: DeliveryStatus;
  pickup_photo_url: string | null;
  pickup_photo_at: string | null;
  dropoff_photo_url: string | null;
  dropoff_photo_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export type Transaction = {
  id: string;
  delivery_id: string;
  amount: number;
  platform_fee: number;
  status: TransactionStatus;
  created_at: string;
  released_at: string | null;
}

export type Message = {
  id: string;
  delivery_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export type LocationPing = {
  id: string;
  delivery_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
}

export type Review = {
  id: string;
  delivery_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type PanicAlert = {
  id: string;
  user_id: string;
  delivery_id: string | null;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
  created_at: string;
}

type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; full_name: string }; Update: Partial<Profile> } & NoRelationships;
      connections: { Row: Connection; Insert: Partial<Connection> & { follower_id: string; following_id: string }; Update: Partial<Connection> } & NoRelationships;
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> } & NoRelationships;
      delivery_requests: { Row: DeliveryRequest; Insert: Partial<DeliveryRequest>; Update: Partial<DeliveryRequest> } & NoRelationships;
      bids: { Row: Bid; Insert: Partial<Bid>; Update: Partial<Bid> } & NoRelationships;
      deliveries: { Row: Delivery; Insert: Partial<Delivery>; Update: Partial<Delivery> } & NoRelationships;
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> } & NoRelationships;
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> } & NoRelationships;
      location_pings: { Row: LocationPing; Insert: Partial<LocationPing>; Update: Partial<LocationPing> } & NoRelationships;
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> } & NoRelationships;
      panic_alerts: { Row: PanicAlert; Insert: Partial<PanicAlert>; Update: Partial<PanicAlert> } & NoRelationships;
    };
    Views: {};
    Functions: {
      place_bid: { Args: { p_request_id: string; p_amount: number }; Returns: Bid };
      accept_bid: { Args: { p_bid_id: string }; Returns: Delivery };
      accept_fixed_price_request: { Args: { p_request_id: string }; Returns: Delivery };
      fund_escrow: { Args: { p_delivery_id: string }; Returns: Transaction };
      confirm_delivery: { Args: { p_delivery_id: string }; Returns: Delivery };
      refund_escrow: { Args: { p_delivery_id: string }; Returns: Transaction };
      trigger_panic_alert: {
        Args: { p_delivery_id: string | null; p_lat: number | null; p_lng: number | null };
        Returns: PanicAlert;
      };
    };
  };
}
