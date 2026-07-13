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
      disputes: {
        Row: {
          created_at: string
          description: string
          id: string
          opened_by: string
          raffle_id: string | null
          resolution: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          opened_by: string
          raffle_id?: string | null
          resolution?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          raffle_id?: string | null
          resolution?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          commit_hash: string
          drawn_at: string
          id: string
          proof: Json
          public_input: string
          public_input_source: string
          raffle_id: string
          seed_revealed: string
          winner_user_id: string | null
          winning_ticket_number: number
        }
        Insert: {
          commit_hash: string
          drawn_at?: string
          id?: string
          proof: Json
          public_input: string
          public_input_source: string
          raffle_id: string
          seed_revealed: string
          winner_user_id?: string | null
          winning_ticket_number: number
        }
        Update: {
          commit_hash?: string
          drawn_at?: string
          id?: string
          proof?: Json
          public_input?: string
          public_input_source?: string
          raffle_id?: string
          seed_revealed?: string
          winner_user_id?: string | null
          winning_ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "draws_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: true
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          payload: Json | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          raffle_id: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          raffle_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          raffle_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          kyc_status: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          age_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          kyc_status?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          age_verified?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          kyc_status?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      raffle_images: {
        Row: {
          id: string
          position: number
          raffle_id: string
          url: string
        }
        Insert: {
          id?: string
          position?: number
          raffle_id: string
          url: string
        }
        Update: {
          id?: string
          position?: number
          raffle_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_images_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          category: string
          commit_hash: string
          created_at: string
          deadline: string
          description: string
          hero_image: string | null
          id: string
          min_tickets_threshold: number
          seed_encrypted: string
          seller_id: string
          sellout_policy: Database["public"]["Enums"]["sellout_policy"]
          serial_number: string | null
          status: Database["public"]["Enums"]["raffle_status"]
          target_value: number
          ticket_price: number
          tickets_sold: number
          title: string
          total_tickets: number
          updated_at: string
        }
        Insert: {
          category: string
          commit_hash: string
          created_at?: string
          deadline: string
          description: string
          hero_image?: string | null
          id?: string
          min_tickets_threshold?: number
          seed_encrypted: string
          seller_id: string
          sellout_policy?: Database["public"]["Enums"]["sellout_policy"]
          serial_number?: string | null
          status?: Database["public"]["Enums"]["raffle_status"]
          target_value: number
          ticket_price: number
          tickets_sold?: number
          title: string
          total_tickets: number
          updated_at?: string
        }
        Update: {
          category?: string
          commit_hash?: string
          created_at?: string
          deadline?: string
          description?: string
          hero_image?: string | null
          id?: string
          min_tickets_threshold?: number
          seed_encrypted?: string
          seller_id?: string
          sellout_policy?: Database["public"]["Enums"]["sellout_policy"]
          serial_number?: string | null
          status?: Database["public"]["Enums"]["raffle_status"]
          target_value?: number
          ticket_price?: number
          tickets_sold?: number
          title?: string
          total_tickets?: number
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          buyer_id: string
          id: string
          payment_id: string | null
          purchased_at: string
          raffle_id: string
          ticket_number: number
        }
        Insert: {
          buyer_id: string
          id?: string
          payment_id?: string | null
          purchased_at?: string
          raffle_id: string
          ticket_number: number
        }
        Update: {
          buyer_id?: string
          id?: string
          payment_id?: string | null
          purchased_at?: string
          raffle_id?: string
          ticket_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          notes: string | null
          photo_url: string | null
          raffle_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          raffle_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          raffle_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verifications_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_tickets: {
        Args: {
          _buyer_id: string
          _payment_id: string
          _qty: number
          _raffle_id: string
        }
        Returns: number[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
      dispute_status: "open" | "under_review" | "resolved" | "rejected"
      payment_status: "pending" | "held" | "released" | "refunded" | "failed"
      payment_type: "ticket_purchase" | "payout" | "refund"
      raffle_status:
        | "pending_verification"
        | "live"
        | "drawing"
        | "completed"
        | "refunded"
        | "cancelled"
      sellout_policy: "extend" | "proportional" | "refund"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["buyer", "seller", "admin"],
      dispute_status: ["open", "under_review", "resolved", "rejected"],
      payment_status: ["pending", "held", "released", "refunded", "failed"],
      payment_type: ["ticket_purchase", "payout", "refund"],
      raffle_status: [
        "pending_verification",
        "live",
        "drawing",
        "completed",
        "refunded",
        "cancelled",
      ],
      sellout_policy: ["extend", "proportional", "refund"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
