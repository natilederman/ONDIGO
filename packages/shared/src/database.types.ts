export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
      consents: {
        Row: {
          accepted_at: string
          context: Json
          id: string
          policy_key: string
          policy_version: number
          user_id: string
        }
        Insert: {
          accepted_at?: string
          context?: Json
          id?: string
          policy_key: string
          policy_version: number
          user_id: string
        }
        Update: {
          accepted_at?: string
          context?: Json
          id?: string
          policy_key?: string
          policy_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_policy_key_policy_version_fkey"
            columns: ["policy_key", "policy_version"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["key", "version"]
          },
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
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
          contents: string | null
          created_at: string
          current_price: number | null
          declared_category: Database["public"]["Enums"]["item_category"] | null
          declared_value: number | null
          deliver_by: string | null
          dropoff_handoff: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_text: string
          extend_on_bid: boolean
          extend_seconds: number
          fixed_price: number | null
          fragile: boolean
          handling_notes: string | null
          id: string
          item_description: string
          item_size: string
          item_weight_kg: number
          legal_declaration_accepted: boolean
          legal_declaration_accepted_at: string | null
          matched_driver_id: string | null
          matched_trip_id: string | null
          needed_by: string
          open_box_required: boolean
          pickup_from: string | null
          pickup_handoff: string
          pickup_lat: number
          pickup_lng: number
          pickup_text: string
          pickup_until: string | null
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          prohibited_items_version: number | null
          sender_id: string
          starting_price: number | null
          status: Database["public"]["Enums"]["request_status"]
          vehicle_type_required:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
        }
        Insert: {
          bidding_ends_at?: string | null
          contents?: string | null
          created_at?: string
          current_price?: number | null
          declared_category?:
            | Database["public"]["Enums"]["item_category"]
            | null
          declared_value?: number | null
          deliver_by?: string | null
          dropoff_handoff?: string
          dropoff_lat: number
          dropoff_lng: number
          dropoff_text: string
          extend_on_bid?: boolean
          extend_seconds?: number
          fixed_price?: number | null
          fragile?: boolean
          handling_notes?: string | null
          id?: string
          item_description: string
          item_size: string
          item_weight_kg: number
          legal_declaration_accepted?: boolean
          legal_declaration_accepted_at?: string | null
          matched_driver_id?: string | null
          matched_trip_id?: string | null
          needed_by: string
          open_box_required?: boolean
          pickup_from?: string | null
          pickup_handoff?: string
          pickup_lat: number
          pickup_lng: number
          pickup_text: string
          pickup_until?: string | null
          pricing_mode: Database["public"]["Enums"]["pricing_mode"]
          prohibited_items_version?: number | null
          sender_id: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          vehicle_type_required?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
        }
        Update: {
          bidding_ends_at?: string | null
          contents?: string | null
          created_at?: string
          current_price?: number | null
          declared_category?:
            | Database["public"]["Enums"]["item_category"]
            | null
          declared_value?: number | null
          deliver_by?: string | null
          dropoff_handoff?: string
          dropoff_lat?: number
          dropoff_lng?: number
          dropoff_text?: string
          extend_on_bid?: boolean
          extend_seconds?: number
          fixed_price?: number | null
          fragile?: boolean
          handling_notes?: string | null
          id?: string
          item_description?: string
          item_size?: string
          item_weight_kg?: number
          legal_declaration_accepted?: boolean
          legal_declaration_accepted_at?: string | null
          matched_driver_id?: string | null
          matched_trip_id?: string | null
          needed_by?: string
          open_box_required?: boolean
          pickup_from?: string | null
          pickup_handoff?: string
          pickup_lat?: number
          pickup_lng?: number
          pickup_text?: string
          pickup_until?: string | null
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"]
          prohibited_items_version?: number | null
          sender_id?: string
          starting_price?: number | null
          status?: Database["public"]["Enums"]["request_status"]
          vehicle_type_required?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
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
      demo_drivers: {
        Row: {
          capacity_kg: number
          capacity_size: string
          driver_id: string
          vehicle: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          capacity_kg: number
          capacity_size: string
          driver_id: string
          vehicle: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          capacity_kg?: number
          capacity_size?: string
          driver_id?: string
          vehicle?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: [
          {
            foreignKeyName: "demo_drivers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          fragile: boolean
          id: number
          item: string
          size: string
          value: number
          weight_kg: number
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          fragile?: boolean
          id?: number
          item: string
          size: string
          value: number
          weight_kg: number
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          fragile?: boolean
          id?: number
          item?: string
          size?: string
          value?: number
          weight_kg?: number
        }
        Relationships: []
      }
      demo_metros: {
        Row: {
          city: string
          state: string
          weight: number
        }
        Insert: {
          city: string
          state: string
          weight: number
        }
        Update: {
          city?: string
          state?: string
          weight?: number
        }
        Relationships: []
      }
      demo_places: {
        Row: {
          block: string
          city: string
          id: number
          lat: number
          line1: string
          lng: number
          state: string
        }
        Insert: {
          block: string
          city: string
          id?: number
          lat: number
          line1: string
          lng: number
          state: string
        }
        Update: {
          block?: string
          city?: string
          id?: number
          lat?: number
          line1?: string
          lng?: number
          state?: string
        }
        Relationships: []
      }
      demo_routes: {
        Row: {
          from_city: string
          from_lat: number
          from_lng: number
          from_state: string
          id: number
          to_city: string
          to_lat: number
          to_lng: number
          to_state: string
        }
        Insert: {
          from_city: string
          from_lat: number
          from_lng: number
          from_state: string
          id?: number
          to_city: string
          to_lat: number
          to_lng: number
          to_state: string
        }
        Update: {
          from_city?: string
          from_lat?: number
          from_lng?: number
          from_state?: string
          id?: number
          to_city?: string
          to_lat?: number
          to_lng?: number
          to_state?: string
        }
        Relationships: []
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
      onboarding_events: {
        Row: {
          created_at: string
          event: string
          id: number
          meta: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: number
          meta?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: number
          meta?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_user_id_fkey"
            columns: ["user_id"]
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
      platform_settings: {
        Row: {
          key: string
          note: string | null
          value: Json
        }
        Insert: {
          key: string
          note?: string | null
          value: Json
        }
        Update: {
          key?: string
          note?: string | null
          value?: Json
        }
        Relationships: []
      }
      policy_documents: {
        Row: {
          body: string
          key: string
          published_at: string
          title: string
          version: number
        }
        Insert: {
          body: string
          key: string
          published_at?: string
          title: string
          version: number
        }
        Update: {
          body?: string
          key?: string
          published_at?: string
          title?: string
          version?: number
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          date_of_birth: string | null
          email_verified_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          date_of_birth?: string | null
          email_verified_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          date_of_birth?: string | null
          email_verified_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          is_admin: boolean
          rating_avg: number
          rating_count: number
          suspended_at: string | null
          suspension_reason: string | null
          tier_updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          verification_tier: Database["public"]["Enums"]["verification_tier"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id: string
          is_admin?: boolean
          rating_avg?: number
          rating_count?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          tier_updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          rating_avg?: number
          rating_count?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          tier_updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
        }
        Relationships: []
      }
      prohibited_item_rules: {
        Row: {
          grp: string
          id: number
          label: string
          note: string | null
          sort: number
        }
        Insert: {
          grp: string
          id?: number
          label: string
          note?: string | null
          sort?: number
        }
        Update: {
          grp?: string
          id?: number
          label?: string
          note?: string | null
          sort?: number
        }
        Relationships: []
      }
      request_contact_details: {
        Row: {
          created_at: string
          dropoff_contact_name: string | null
          dropoff_contact_phone: string | null
          dropoff_instructions: string | null
          dropoff_line1: string | null
          dropoff_line2: string | null
          dropoff_postcode: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_instructions: string | null
          pickup_line1: string | null
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
          dropoff_line1?: string | null
          dropoff_line2?: string | null
          dropoff_postcode?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_instructions?: string | null
          pickup_line1?: string | null
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
          dropoff_line1?: string | null
          dropoff_line2?: string | null
          dropoff_postcode?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: string | null
          pickup_instructions?: string | null
          pickup_line1?: string | null
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
      vehicles: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          insurance_expires_on: string | null
          insurance_named_insured: string | null
          licence_expires_on: string | null
          make: string | null
          model: string | null
          model_year: number | null
          plate: string
          plate_state: string | null
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_id: string | null
          vin_last6: string | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          insurance_expires_on?: string | null
          insurance_named_insured?: string | null
          licence_expires_on?: string | null
          make?: string | null
          model?: string | null
          model_year?: number | null
          plate: string
          plate_state?: string | null
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_id?: string | null
          vin_last6?: string | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          insurance_expires_on?: string | null
          insurance_named_insured?: string | null
          licence_expires_on?: string | null
          make?: string | null
          model?: string | null
          model_year?: number | null
          plate?: string
          plate_state?: string | null
          user_id?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          verification_id?: string | null
          vin_last6?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          delete_after: string
          id: string
          label: string
          storage_path: string
          uploaded_at: string
          user_id: string
          verification_id: string
        }
        Insert: {
          delete_after?: string
          id?: string
          label: string
          storage_path: string
          uploaded_at?: string
          user_id: string
          verification_id: string
        }
        Update: {
          delete_after?: string
          id?: string
          label?: string
          storage_path?: string
          uploaded_at?: string
          user_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string
          decided_at: string | null
          decision_reason: string | null
          details: Json
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider: string
          provider_ref: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decision_reason?: string | null
          details?: Json
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider?: string
          provider_ref?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decision_reason?: string | null
          details?: Json
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          provider?: string
          provider_ref?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_user_id_fkey"
            columns: ["user_id"]
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
      accept_policy: {
        Args: { p_context?: Json; p_key: string }
        Returns: {
          accepted_at: string
          context: Json
          id: string
          policy_key: string
          policy_version: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "consents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      age_years: { Args: { p_dob: string }; Returns: number }
      assert_can_take: {
        Args: {
          p_request: Database["public"]["Tables"]["delivery_requests"]["Row"]
          p_user: string
        }
        Returns: undefined
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
      decide_verification: {
        Args: {
          p_expires_at?: string
          p_id: string
          p_reason: string
          p_status: Database["public"]["Enums"]["verification_status"]
        }
        Returns: {
          created_at: string
          decided_at: string | null
          decision_reason: string | null
          details: Json
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider: string
          provider_ref: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      demo_km: {
        Args: { a_lat: number; a_lng: number; b_lat: number; b_lng: number }
        Returns: number
      }
      demo_price: {
        Args: { p_band: string; p_kg: number; p_km: number; p_size: string }
        Returns: number
      }
      demo_refill: { Args: never; Returns: Json }
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
      get_public_trust: {
        Args: { p_ids: string[] }
        Returns: {
          driving_record_checked_at: string
          identity_checked_at: string
          insurance_checked_at: string
          licence_checked_at: string
          liveness_checked_at: string
          providers: string
          records_checked_at: string
          suspended: boolean
          user_id: string
          vehicle_checked_at: string
          vehicle_classes: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
        }[]
      }
      has_check: {
        Args: {
          p_kind: Database["public"]["Enums"]["verification_kind"]
          p_user: string
        }
        Returns: boolean
      }
      has_consent: { Args: { p_key: string; p_user: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      log_onboarding_event: {
        Args: { p_event: string; p_meta?: Json }
        Returns: undefined
      }
      map_public_activity: { Args: never; Returns: Json }
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
      public_delivery_record: {
        Args: { p_user: string }
        Returns: {
          category: Database["public"]["Enums"]["item_category"]
          completed_at: string
          delivery_id: string
          dlat: number
          dlng: number
          plat: number
          plng: number
          rating: number
          role: string
        }[]
      }
      purge_expired_verification_documents: { Args: never; Returns: number }
      recompute_verification_tier: {
        Args: { p_user: string }
        Returns: Database["public"]["Enums"]["verification_tier"]
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
      request_requires: {
        Args: {
          p_request: Database["public"]["Tables"]["delivery_requests"]["Row"]
        }
        Returns: Json
      }
      set_suspension: {
        Args: { p_reason: string; p_user: string }
        Returns: undefined
      }
      setting_num: { Args: { p_key: string }; Returns: number }
      submit_verification: {
        Args: {
          p_details?: Json
          p_kind: Database["public"]["Enums"]["verification_kind"]
        }
        Returns: {
          created_at: string
          decided_at: string | null
          decision_reason: string | null
          details: Json
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider: string
          provider_ref: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "verifications"
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
      vehicle_class_for_weight: {
        Args: { p_kg: number }
        Returns: Database["public"]["Enums"]["vehicle_type"]
      }
      vehicle_rank: { Args: { p_user: string }; Returns: number }
      why_cannot_take: {
        Args: {
          p_request: Database["public"]["Tables"]["delivery_requests"]["Row"]
          p_user: string
        }
        Returns: string
      }
      why_cannot_take_request: {
        Args: { p_request_id: string }
        Returns: string
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
      item_category:
        | "boxes_parcels"
        | "furniture"
        | "appliances"
        | "electronics"
        | "sports_outdoor"
        | "instruments"
        | "art_fragile"
        | "documents"
        | "vehicle_parts"
        | "plants_garden"
        | "other"
        | "household_move"
      pricing_mode: "fixed" | "auction"
      request_status: "open" | "matched" | "cancelled"
      transaction_status: "held" | "released" | "refunded"
      trip_status: "active" | "completed" | "cancelled"
      vehicle_type: "car" | "truck" | "bike" | "scooter"
      verification_kind:
        | "phone"
        | "identity_document"
        | "liveness"
        | "driving_licence"
        | "insurance"
        | "vehicle"
        | "criminal_records"
        | "motor_vehicle_record"
        | "payout_account"
      verification_status:
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "pre_adverse_hold"
        | "expired"
        | "withdrawn"
      verification_tier:
        | "none"
        | "contactable"
        | "identified"
        | "road_ready"
        | "screened"
        | "payable"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      item_category: [
        "boxes_parcels",
        "furniture",
        "appliances",
        "electronics",
        "sports_outdoor",
        "instruments",
        "art_fragile",
        "documents",
        "vehicle_parts",
        "plants_garden",
        "other",
        "household_move",
      ],
      pricing_mode: ["fixed", "auction"],
      request_status: ["open", "matched", "cancelled"],
      transaction_status: ["held", "released", "refunded"],
      trip_status: ["active", "completed", "cancelled"],
      vehicle_type: ["car", "truck", "bike", "scooter"],
      verification_kind: [
        "phone",
        "identity_document",
        "liveness",
        "driving_licence",
        "insurance",
        "vehicle",
        "criminal_records",
        "motor_vehicle_record",
        "payout_account",
      ],
      verification_status: [
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "pre_adverse_hold",
        "expired",
        "withdrawn",
      ],
      verification_tier: [
        "none",
        "contactable",
        "identified",
        "road_ready",
        "screened",
        "payable",
      ],
    },
  },
} as const
