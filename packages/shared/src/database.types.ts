export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bids: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          request_id: string
          status: Database["public"]["Enums"]["bid_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bids_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          traded: boolean
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          traded?: boolean
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          traded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "connections_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          agreed_price: number
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_photo_at: string | null
          dropoff_photo_url: string | null
          id: string
          pickup_photo_at: string | null
          pickup_photo_url: string | null
          request_id: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
        }
        Insert: {
          agreed_price: number
          completed_at?: string | null
          created_at?: string
          driver_id: string
          dropoff_photo_at?: string | null
          dropoff_photo_url?: string | null
          id?: string
          pickup_photo_at?: string | null
          pickup_photo_url?: string | null
          request_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          trip_id?: string | null
        }
        Update: {
          agreed_price?: number
          completed_at?: string | null
          created_at?: string
          driver_id?: string
          dropoff_photo_at?: string | null
          dropoff_photo_url?: string | null
          id?: string
          pickup_photo_at?: string | null
          pickup_photo_url?: string | null
          request_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          bidding_ends_at: string | null
          created_at: string
          current_price: number | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_text: string
          extend_on_bid: boolean
          extend_seconds: number
          fixed_price: number | null
          id: string
          item_description: string
          item_size: string
          item_weight_kg: number
          legal_declaration_accepted: boolean
          matched_driver_id: string | null
          matched_trip_id: string | null
          needed_by: string
          pickup_lat: number
          pickup_lng: number
          pickup_text: string
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          sender_id: string
          starting_price: number | null
          status: Database["public"]["Enums"]["request_status"]
          deliver_by: string | null
          dropoff_handoff: string
          fragile: boolean
          handling_notes: string | null
          pickup_from: string | null
          pickup_handoff: string
          pickup_until: string | null
        }
        Insert: {
          bidding_ends_at?: string | null
          created_at?: string
          current_price?: number | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_text: string
          extend_on_bid?: boolean
          extend_seconds?: number
          fixed_price?: number | null
          id?: string
          item_description: string
          item_size: string
          item_weight_kg: number
          legal_declaration_accepted?: boolean
          matched_driver_id?: string | null
          matched_trip_id?: string | null
          needed_by: string
          pickup_lat: number
          pickup_lng: number
          pickup_text: string
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          sender_id: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          deliver_by?: string | null
          dropoff_handoff?: string
          fragile?: boolean
          handling_notes?: string | null
          pickup_from?: string | null
          pickup_handoff?: string
          pickup_until?: string | null
        }
        Update: {
          bidding_ends_at?: string | null
          created_at?: string
          current_price?: number | null
          dropoff_lat?: number
          dropoff_lng?: number
          dropoff_text?: string
          extend_on_bid?: boolean
          extend_seconds?: number
          fixed_price?: number | null
          id?: string
          item_description?: string
          item_size?: string
          item_weight_kg?: number
          legal_declaration_accepted?: boolean
          matched_driver_id?: string | null
          matched_trip_id?: string | null
          needed_by?: string
          pickup_lat?: number
          pickup_lng?: number
          pickup_text?: string
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          sender_id?: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          deliver_by?: string | null
          dropoff_handoff?: string
          fragile?: boolean
          handling_notes?: string | null
          pickup_from?: string | null
          pickup_handoff?: string
          pickup_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_matched_driver_id_fkey"
            columns: ["matched_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_matched_trip_id_fkey"
            columns: ["matched_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          delivery_id: string
          id: string
          lat: number
          lng: number
          recorded_at: string
        }
        Insert: {
          delivery_id: string
          id?: string
          lat: number
          lng: number
          recorded_at?: string
        }
        Update: {
          delivery_id?: string
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          delivery_id: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          delivery_id: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          delivery_id?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_alerts: {
        Row: {
          created_at: string
          delivery_id: string | null
          id: string
          lat: number | null
          lng: number | null
          resolved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          resolved?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          resolved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panic_alerts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panic_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          rating_avg: number
          rating_count: number
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: []
      }
      request_contact_details: {
        Row: {
          created_at: string
          dropoff_contact_name: string | null
          dropoff_contact_phone: string | null
          dropoff_instructions: string | null
          dropoff_line2: string | null
          dropoff_postcode: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_instructions: string | null
          pickup_line2: string | null
          pickup_postcode: string | null
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dropoff_contact_name?: string | null
          dropoff_contact_phone?: string | null
          dropoff_instructions?: string | null
          dropoff_line2?: string | null
          dropoff_postcode?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_instructions?: string | null
          pickup_line2?: string | null
          pickup_postcode?: string | null
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dropoff_contact_name?: string | null
          dropoff_contact_phone?: string | null
          dropoff_instructions?: string | null
          dropoff_line2?: string | null
          dropoff_postcode?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_instructions?: string | null
          pickup_line2?: string | null
          pickup_postcode?: string | null
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_contact_details_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          delivery_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          delivery_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          delivery_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          delivery_id: string
          id: string
          platform_fee: number
          released_at: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          delivery_id: string
          id?: string
          platform_fee?: number
          released_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_id?: string
          id?: string
          platform_fee?: number
          released_at?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          capacity_size: string
          capacity_weight_kg: number
          created_at: string
          depart_at: string
          destination_lat: number
          destination_lng: number
          destination_text: string
          driver_id: string
          id: string
          notes: string | null
          origin_lat: number
          origin_lng: number
          origin_text: string
          status: Database["public"]["Enums"]["trip_status"]
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          capacity_size: string
          capacity_weight_kg: number
          created_at?: string
          depart_at: string
          destination_lat: number
          destination_lng: number
          destination_text: string
          driver_id: string
          id?: string
          notes?: string | null
          origin_lat: number
          origin_lng: number
          origin_text: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          capacity_size?: string
          capacity_weight_kg?: number
          created_at?: string
          depart_at?: string
          destination_lat?: number
          destination_lng?: number
          destination_text?: string
          driver_id?: string
          id?: string
          notes?: string | null
          origin_lat?: number
          origin_lng?: number
          origin_text?: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_bid: {
        Args: { p_bid_id: string }
        Returns: {
          agreed_price: number
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_photo_at: string | null
          dropoff_photo_url: string | null
          id: string
          pickup_photo_at: string | null
          pickup_photo_url: string | null
          request_id: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_fixed_price_request: {
        Args: { p_request_id: string }
        Returns: {
          agreed_price: number
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_photo_at: string | null
          dropoff_photo_url: string | null
          id: string
          pickup_photo_at: string | null
          pickup_photo_url: string | null
          request_id: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      close_expired_auctions: { Args: never; Returns: undefined }
      confirm_delivery: {
        Args: { p_delivery_id: string }
        Returns: {
          agreed_price: number
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_photo_at: string | null
          dropoff_photo_url: string | null
          id: string
          pickup_photo_at: string | null
          pickup_photo_url: string | null
          request_id: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_delivery_for_request: {
        Args: {
          p_driver_id: string
          p_price: number
          p_request: Database["public"]["Tables"]["delivery_requests"]["Row"]
        }
        Returns: {
          agreed_price: number
          completed_at: string | null
          created_at: string
          driver_id: string
          dropoff_photo_at: string | null
          dropoff_photo_url: string | null
          id: string
          pickup_photo_at: string | null
          pickup_photo_url: string | null
          request_id: string
          sender_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fund_escrow: {
        Args: { p_delivery_id: string }
        Returns: {
          amount: number
          created_at: string
          delivery_id: string
          id: string
          platform_fee: number
          released_at: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      place_bid: {
        Args: { p_amount: number; p_request_id: string }
        Returns: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          request_id: string
          status: Database["public"]["Enums"]["bid_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refund_escrow: {
        Args: { p_delivery_id: string }
        Returns: {
          amount: number
          created_at: string
          delivery_id: string
          id: string
          platform_fee: number
          released_at: string | null
          status: Database["public"]["Enums"]["transaction_status"]
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trigger_panic_alert: {
        Args: { p_delivery_id: string; p_lat: number; p_lng: number }
        Returns: {
          created_at: string
          delivery_id: string | null
          id: string
          lat: number | null
          lng: number | null
          resolved: boolean
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "panic_alerts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      bid_status: "active" | "outbid" | "accepted" | "rejected"
      delivery_status:
        | "pending_pickup"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "completed"
        | "disputed"
      pricing_mode: "fixed" | "auction"
      request_status: "open" | "matched" | "cancelled"
      transaction_status: "held" | "released" | "refunded"
      trip_status: "active" | "completed" | "cancelled"
      vehicle_type: "car" | "truck" | "bike" | "scooter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bid_status: ["active", "outbid", "accepted", "rejected"],
      delivery_status: [
        "pending_pickup",
        "picked_up",
        "in_transit",
        "delivered",
        "completed",
        "disputed",
      ],
      pricing_mode: ["fixed", "auction"],
      request_status: ["open", "matched", "cancelled"],
      transaction_status: ["held", "released", "refunded"],
      trip_status: ["active", "completed", "cancelled"],
      vehicle_type: ["car", "truck", "bike", "scooter"],
    },
  },
} as const

