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
      exams: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          subject?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          archived: boolean
          content: string
          created_at: string
          id: string
          label: string
          pinned: boolean
          subject: string | null
          summary: string | null
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          content?: string
          created_at?: string
          id?: string
          label?: string
          pinned?: boolean
          subject?: string | null
          summary?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          content?: string
          created_at?: string
          id?: string
          label?: string
          pinned?: boolean
          subject?: string | null
          summary?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          board: string
          created_at: string
          daily_hours: number
          full_name: string
          id: string
          language: string
          onboarded: boolean
          reminders: Json
          strong_subjects: string[]
          student_class: string
          study_goal: string
          theme: string
          updated_at: string
          weak_subjects: string[]
        }
        Insert: {
          avatar_url?: string
          board?: string
          created_at?: string
          daily_hours?: number
          full_name?: string
          id: string
          language?: string
          onboarded?: boolean
          reminders?: Json
          strong_subjects?: string[]
          student_class?: string
          study_goal?: string
          theme?: string
          updated_at?: string
          weak_subjects?: string[]
        }
        Update: {
          avatar_url?: string
          board?: string
          created_at?: string
          daily_hours?: number
          full_name?: string
          id?: string
          language?: string
          onboarded?: boolean
          reminders?: Json
          strong_subjects?: string[]
          student_class?: string
          study_goal?: string
          theme?: string
          updated_at?: string
          weak_subjects?: string[]
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          questions: Json
          score: number | null
          subject: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions: Json
          score?: number | null
          subject: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          questions?: Json
          score?: number | null
          subject?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          id: string
          plan: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan: Json
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          session_date: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          session_date?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          session_date?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          completed_chapters: number
          created_at: string
          icon: string
          id: string
          name: string
          priority: string
          strength: string
          total_chapters: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          completed_chapters?: number
          created_at?: string
          icon?: string
          id?: string
          name: string
          priority?: string
          strength?: string
          total_chapters?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          completed_chapters?: number
          created_at?: string
          icon?: string
          id?: string
          name?: string
          priority?: string
          strength?: string
          total_chapters?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_history: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          quiz_score: number
          quiz_total: number
          study_minutes: number
          subject: string | null
          task_id: string | null
          title: string
          topic: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          quiz_score?: number
          quiz_total?: number
          study_minutes?: number
          subject?: string | null
          task_id?: string | null
          title: string
          topic?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          quiz_score?: number
          quiz_total?: number
          study_minutes?: number
          subject?: string | null
          task_id?: string | null
          title?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          chapter: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string
          difficulty: string
          due_date: string | null
          estimated_minutes: number
          id: string
          kind: string
          material: string
          objective: string
          priority: string
          quiz_score: number | null
          started_at: string | null
          status: string
          study_minutes: number
          subject: string | null
          subject_id: string | null
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          due_date?: string | null
          estimated_minutes?: number
          id?: string
          kind?: string
          material?: string
          objective?: string
          priority?: string
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          study_minutes?: number
          subject?: string | null
          subject_id?: string | null
          title: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          due_date?: string | null
          estimated_minutes?: number
          id?: string
          kind?: string
          material?: string
          objective?: string
          priority?: string
          quiz_score?: number | null
          started_at?: string | null
          status?: string
          study_minutes?: number
          subject?: string | null
          subject_id?: string | null
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
