export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      budget_events: {
        Row: {
          cost_usd: number;
          cumulative_usd: number;
          event_time: string;
          id: string;
          model: string | null;
          threshold_reached: boolean;
          tokens_used: number | null;
          user_id: string | null;
        };
        Insert: {
          cost_usd: number;
          cumulative_usd: number;
          event_time?: string;
          id?: string;
          model?: string | null;
          threshold_reached?: boolean;
          tokens_used?: number | null;
          user_id?: string | null;
        };
        Update: {
          cost_usd?: number;
          cumulative_usd?: number;
          event_time?: string;
          id?: string;
          model?: string | null;
          threshold_reached?: boolean;
          tokens_used?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          is_deleted: boolean;
          name: string;
          owner_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean;
          name: string;
          owner_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          is_deleted?: boolean;
          name?: string;
          owner_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          answer: string;
          box: Database["public"]["Enums"]["leitner_box_enum"];
          created_at: string;
          deck_id: string;
          id: string;
          model: string | null;
          next_due_date: string;
          price_usd: number | null;
          question: string;
          status: Database["public"]["Enums"]["flashcard_status_enum"];
          tokens_used: number | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          answer: string;
          box?: Database["public"]["Enums"]["leitner_box_enum"];
          created_at?: string;
          deck_id: string;
          id?: string;
          model?: string | null;
          next_due_date?: string;
          price_usd?: number | null;
          question: string;
          status?: Database["public"]["Enums"]["flashcard_status_enum"];
          tokens_used?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          answer?: string;
          box?: Database["public"]["Enums"]["leitner_box_enum"];
          created_at?: string;
          deck_id?: string;
          id?: string;
          model?: string | null;
          next_due_date?: string;
          price_usd?: number | null;
          question?: string;
          status?: Database["public"]["Enums"]["flashcard_status_enum"];
          tokens_used?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "decks";
            referencedColumns: ["id"];
          },
        ];
      };
      kpi_daily: {
        Row: {
          accepted_count: number;
          accepted_pct: number | null;
          active_users: number;
          ai_generated_count: number;
          ai_share_pct: number | null;
          cost_usd: number;
          date: string;
          manual_created_count: number;
          rejected_count: number;
          retention_pct: number | null;
          tokens_used: number;
          total_users: number;
        };
        Insert: {
          accepted_count?: number;
          accepted_pct?: number | null;
          active_users?: number;
          ai_generated_count?: number;
          ai_share_pct?: number | null;
          cost_usd?: number;
          date: string;
          manual_created_count?: number;
          rejected_count?: number;
          retention_pct?: number | null;
          tokens_used?: number;
          total_users?: number;
        };
        Update: {
          accepted_count?: number;
          accepted_pct?: number | null;
          active_users?: number;
          ai_generated_count?: number;
          ai_share_pct?: number | null;
          cost_usd?: number;
          date?: string;
          manual_created_count?: number;
          rejected_count?: number;
          retention_pct?: number | null;
          tokens_used?: number;
          total_users?: number;
        };
        Relationships: [];
      };
      kpi_monthly: {
        Row: {
          accepted_count: number;
          accepted_pct: number | null;
          ai_generated_count: number;
          ai_share_pct: number | null;
          cost_usd: number;
          manual_created_count: number;
          mau: number;
          mau_retention_pct: number | null;
          rejected_count: number;
          tokens_used: number;
          year_month: string;
        };
        Insert: {
          accepted_count?: number;
          accepted_pct?: number | null;
          ai_generated_count?: number;
          ai_share_pct?: number | null;
          cost_usd?: number;
          manual_created_count?: number;
          mau?: number;
          mau_retention_pct?: number | null;
          rejected_count?: number;
          tokens_used?: number;
          year_month: string;
        };
        Update: {
          accepted_count?: number;
          accepted_pct?: number | null;
          ai_generated_count?: number;
          ai_share_pct?: number | null;
          cost_usd?: number;
          manual_created_count?: number;
          mau?: number;
          mau_retention_pct?: number | null;
          rejected_count?: number;
          tokens_used?: number;
          year_month?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          created_at: string;
          flashcard_id: string;
          id: string;
          is_correct: boolean;
          response_time_ms: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          flashcard_id: string;
          id?: string;
          is_correct: boolean;
          response_time_ms: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          flashcard_id?: string;
          id?: string;
          is_correct?: boolean;
          response_time_ms?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      update_pending_flashcards: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      flashcard_status_enum: "pending" | "accepted" | "rejected";
      leitner_box_enum: "box1" | "box2" | "box3" | "graduated";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      flashcard_status_enum: ["pending", "accepted", "rejected"],
      leitner_box_enum: ["box1", "box2", "box3", "graduated"],
    },
  },
} as const;
