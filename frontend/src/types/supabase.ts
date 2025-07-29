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
      followers: {
        Row: {
          created_at: string | null
          followed_user_id: string
          follower_user_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          followed_user_id: string
          follower_user_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          followed_user_id?: string
          follower_user_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followers_followed_user_id_fkey"
            columns: ["followed_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_followed_user_id_fkey"
            columns: ["followed_user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "followers_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      market_analysis: {
        Row: {
          analysis_timestamp: string
          asset_name: string
          asset_type: string
          chart_image_url: string | null
          confidence: number
          created_at: string | null
          description: string
          id: string
          indicators: Json
          pattern_name: string
          price_targets: Json
          recommendation: string
          recommendation_reason: string
          risk_reward: number | null
          sentiment: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_timestamp: string
          asset_name: string
          asset_type: string
          chart_image_url?: string | null
          confidence: number
          created_at?: string | null
          description: string
          id?: string
          indicators?: Json
          pattern_name: string
          price_targets?: Json
          recommendation: string
          recommendation_reason: string
          risk_reward?: number | null
          sentiment: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_timestamp?: string
          asset_name?: string
          asset_type?: string
          chart_image_url?: string | null
          confidence?: number
          created_at?: string | null
          description?: string
          id?: string
          indicators?: Json
          pattern_name?: string
          price_targets?: Json
          recommendation?: string
          recommendation_reason?: string
          risk_reward?: number | null
          sentiment?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "market_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_name: string
          asset_type: string
          closed_at: string | null
          created_at: string | null
          creator_image_url: string | null
          creator_name: string | null
          current_price: number | null
          duration_minutes: number | null
          entry_price: number
          exit_price: number | null
          exit_reason: string | null
          fees: number | null
          id: string
          net_pnl: number | null
          opened_at: string
          pnl: number | null
          pnl_percentage: number | null
          quantity: number
          signal_id: string | null
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          trade_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_type: string
          closed_at?: string | null
          created_at?: string | null
          creator_image_url?: string | null
          creator_name?: string | null
          current_price?: number | null
          duration_minutes?: number | null
          entry_price: number
          exit_price?: number | null
          exit_reason?: string | null
          fees?: number | null
          id?: string
          net_pnl?: number | null
          opened_at: string
          pnl?: number | null
          pnl_percentage?: number | null
          quantity: number
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          trade_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          closed_at?: string | null
          created_at?: string | null
          creator_image_url?: string | null
          creator_name?: string | null
          current_price?: number | null
          duration_minutes?: number | null
          entry_price?: number
          exit_price?: number | null
          exit_reason?: string | null
          fees?: number | null
          id?: string
          net_pnl?: number | null
          opened_at?: string
          pnl?: number | null
          pnl_percentage?: number | null
          quantity?: number
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          trade_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals_with_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trading_signals: {
        Row: {
          actual_closed_price: number | null
          actual_return_percentage: number | null
          analysis_id: string | null
          asset_name: string
          asset_type: string
          confidence: number
          created_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          pattern_name: string
          reason: string
          recommendation: string
          sentiment: string
          signal_closed_at: string | null
          signal_created_at: string
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_closed_price?: number | null
          actual_return_percentage?: number | null
          analysis_id?: string | null
          asset_name: string
          asset_type: string
          confidence: number
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          pattern_name: string
          reason: string
          recommendation: string
          sentiment: string
          signal_closed_at?: string | null
          signal_created_at: string
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_closed_price?: number | null
          actual_return_percentage?: number | null
          analysis_id?: string | null
          asset_name?: string
          asset_type?: string
          confidence?: number
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          pattern_name?: string
          reason?: string
          recommendation?: string
          sentiment?: string
          signal_closed_at?: string | null
          signal_created_at?: string
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_signals_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "market_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          app_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          joined_at: string | null
          location: string | null
          name: string
          notification_preferences: Json | null
          phone: string | null
          privacy_settings: Json | null
          referral_code: string
          tier: string | null
          updated_at: string | null
          user_id: string
          username: string
          verified: boolean | null
        }
        Insert: {
          app_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          joined_at?: string | null
          location?: string | null
          name: string
          notification_preferences?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          referral_code?: string
          tier?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          verified?: boolean | null
        }
        Update: {
          app_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          joined_at?: string | null
          location?: string | null
          name?: string
          notification_preferences?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          referral_code?: string
          tier?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      signals_with_analysis: {
        Row: {
          actual_closed_price: number | null
          actual_return_percentage: number | null
          analysis_description: string | null
          analysis_id: string | null
          asset_name: string | null
          asset_type: string | null
          chart_image_url: string | null
          confidence: number | null
          created_at: string | null
          entry_price: number | null
          exit_price: number | null
          id: string | null
          indicators: Json | null
          pattern_name: string | null
          price_targets: Json | null
          reason: string | null
          recommendation: string | null
          sentiment: string | null
          signal_closed_at: string | null
          signal_created_at: string | null
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_signals_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "market_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_signal_stats: {
        Row: {
          avg_confidence: number | null
          avg_return_percentage: number | null
          best_return_percentage: number | null
          closed_signals: number | null
          last_signal_date: string | null
          losing_signals: number | null
          open_signals: number | null
          total_signals: number | null
          user_id: string | null
          win_rate_percentage: number | null
          winning_signals: number | null
          worst_return_percentage: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trading_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_social_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_social_stats: {
        Row: {
          followers_count: number | null
          following_count: number | null
          name: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          followers_count?: never
          following_count?: never
          name?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          followers_count?: never
          following_count?: never
          name?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      format_trade_duration: {
        Args: { duration_mins: number }
        Returns: string
      }
      get_follower_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_analysis_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_signal_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_trade_stats: {
        Args: { target_user_id: string }
        Returns: {
          total_trades: number
          open_trades: number
          closed_trades: number
          winning_trades: number
          losing_trades: number
          total_pnl: number
          total_fees: number
          net_pnl: number
          win_rate: number
          avg_trade_duration_hours: number
        }[]
      }
      get_user_win_rate: {
        Args: { target_user_id: string }
        Returns: number
      }
      is_following: {
        Args: { follower_id: string; followed_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
