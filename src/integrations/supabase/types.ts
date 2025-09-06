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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          match_id: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          match_id?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          match_id?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          is_mutual: boolean | null
          sport: Database["public"]["Enums"]["sport_type"]
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_mutual?: boolean | null
          sport: Database["public"]["Enums"]["sport_type"]
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_mutual?: boolean | null
          sport?: Database["public"]["Enums"]["sport_type"]
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          profile_photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          created_at?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          profile_photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          created_at?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          profile_photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          created_at: string | null
          frequency: Database["public"]["Enums"]["frequency"] | null
          gender_preference: Database["public"]["Enums"]["gender_type"][] | null
          id: string
          max_travel_distance: number | null
          preferred_days: number[] | null
          preferred_time_slots:
            | Database["public"]["Enums"]["time_slot"][]
            | null
          updated_at: string | null
          user_id: string | null
          venue_types: Database["public"]["Enums"]["venue_type"][] | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency"] | null
          gender_preference?:
            | Database["public"]["Enums"]["gender_type"][]
            | null
          id?: string
          max_travel_distance?: number | null
          preferred_days?: number[] | null
          preferred_time_slots?:
            | Database["public"]["Enums"]["time_slot"][]
            | null
          updated_at?: string | null
          user_id?: string | null
          venue_types?: Database["public"]["Enums"]["venue_type"][] | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency"] | null
          gender_preference?:
            | Database["public"]["Enums"]["gender_type"][]
            | null
          id?: string
          max_travel_distance?: number | null
          preferred_days?: number[] | null
          preferred_time_slots?:
            | Database["public"]["Enums"]["time_slot"][]
            | null
          updated_at?: string | null
          user_id?: string | null
          venue_types?: Database["public"]["Enums"]["venue_type"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sports: {
        Row: {
          created_at: string | null
          id: string
          skill_level: Database["public"]["Enums"]["skill_level"]
          sport: Database["public"]["Enums"]["sport_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          skill_level: Database["public"]["Enums"]["skill_level"]
          sport: Database["public"]["Enums"]["sport_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          sport?: Database["public"]["Enums"]["sport_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sports_user_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      frequency: "1_2_per_week" | "3_4_per_week" | "daily" | "flexible"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      skill_level: "beginner" | "intermediate" | "advanced" | "expert"
      sport_type:
        | "tennis"
        | "pickleball"
        | "basketball"
        | "badminton"
        | "squash"
        | "racquetball"
      time_slot: "morning" | "afternoon" | "evening"
      venue_type:
        | "public_free"
        | "private_club"
        | "paid_facility"
        | "home_court"
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
      frequency: ["1_2_per_week", "3_4_per_week", "daily", "flexible"],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      skill_level: ["beginner", "intermediate", "advanced", "expert"],
      sport_type: [
        "tennis",
        "pickleball",
        "basketball",
        "badminton",
        "squash",
        "racquetball",
      ],
      time_slot: ["morning", "afternoon", "evening"],
      venue_type: [
        "public_free",
        "private_club",
        "paid_facility",
        "home_court",
      ],
    },
  },
} as const
