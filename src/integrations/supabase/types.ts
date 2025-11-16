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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      degree: {
        Row: {
          birth_date: string | null
          certificate_number: string | null
          created_at: string | null
          degree_date: string | null
          degree_level: string | null
          degree_type: string
          gender: string | null
          id: string
          major: string | null
          name: string
          photo: string | null
          school: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          degree_date?: string | null
          degree_level?: string | null
          degree_type: string
          gender?: string | null
          id?: string
          major?: string | null
          name: string
          photo?: string | null
          school: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          degree_date?: string | null
          degree_level?: string | null
          degree_type?: string
          gender?: string | null
          id?: string
          major?: string | null
          name?: string
          photo?: string | null
          school?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "degree_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          birth_date: string | null
          certificate_number: string | null
          created_at: string | null
          degree_level: string | null
          duration: string | null
          education_type: string | null
          enrollment_date: string | null
          gender: string | null
          graduation_date: string | null
          graduation_status: string | null
          id: string
          major: string
          name: string
          photo: string | null
          principal_name: string | null
          school: string
          study_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          degree_level?: string | null
          duration?: string | null
          education_type?: string | null
          enrollment_date?: string | null
          gender?: string | null
          graduation_date?: string | null
          graduation_status?: string | null
          id?: string
          major: string
          name: string
          photo?: string | null
          principal_name?: string | null
          school: string
          study_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          degree_level?: string | null
          duration?: string | null
          education_type?: string | null
          enrollment_date?: string | null
          gender?: string | null
          graduation_date?: string | null
          graduation_status?: string | null
          id?: string
          major?: string
          name?: string
          photo?: string | null
          principal_name?: string | null
          school?: string
          study_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exam: {
        Row: {
          admission_major: string | null
          admission_unit: string | null
          business_course1_name: string | null
          business_course1_score: string | null
          business_course2_name: string | null
          business_course2_score: string | null
          created_at: string | null
          department: string | null
          exam_location: string | null
          exam_type: string | null
          exam_unit: string | null
          foreign_language_name: string | null
          foreign_language_score: string | null
          id: string
          major: string | null
          name: string
          note: string | null
          photo: string | null
          politics_name: string | null
          politics_score: string | null
          registration_number: string | null
          research_direction: string | null
          school: string
          special_program: string | null
          total_score: string | null
          updated_at: string | null
          user_id: string
          year: string | null
        }
        Insert: {
          admission_major?: string | null
          admission_unit?: string | null
          business_course1_name?: string | null
          business_course1_score?: string | null
          business_course2_name?: string | null
          business_course2_score?: string | null
          created_at?: string | null
          department?: string | null
          exam_location?: string | null
          exam_type?: string | null
          exam_unit?: string | null
          foreign_language_name?: string | null
          foreign_language_score?: string | null
          id?: string
          major?: string | null
          name: string
          note?: string | null
          photo?: string | null
          politics_name?: string | null
          politics_score?: string | null
          registration_number?: string | null
          research_direction?: string | null
          school: string
          special_program?: string | null
          total_score?: string | null
          updated_at?: string | null
          user_id: string
          year?: string | null
        }
        Update: {
          admission_major?: string | null
          admission_unit?: string | null
          business_course1_name?: string | null
          business_course1_score?: string | null
          business_course2_name?: string | null
          business_course2_score?: string | null
          created_at?: string | null
          department?: string | null
          exam_location?: string | null
          exam_type?: string | null
          exam_unit?: string | null
          foreign_language_name?: string | null
          foreign_language_score?: string | null
          id?: string
          major?: string | null
          name?: string
          note?: string | null
          photo?: string | null
          politics_name?: string | null
          politics_score?: string | null
          registration_number?: string | null
          research_direction?: string | null
          school?: string
          special_program?: string | null
          total_score?: string | null
          updated_at?: string | null
          user_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status: {
        Row: {
          admission_photo: string | null
          birth_date: string | null
          branch: string | null
          class: string | null
          created_at: string | null
          degree_level: string | null
          degree_photo: string | null
          department: string | null
          duration: string | null
          education_type: string | null
          enrollment_date: string | null
          gender: string | null
          graduation_date: string | null
          id: string
          id_number: string | null
          major: string
          name: string
          nationality: string | null
          personal_info: string | null
          school: string
          status: string | null
          student_id: string | null
          study_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admission_photo?: string | null
          birth_date?: string | null
          branch?: string | null
          class?: string | null
          created_at?: string | null
          degree_level?: string | null
          degree_photo?: string | null
          department?: string | null
          duration?: string | null
          education_type?: string | null
          enrollment_date?: string | null
          gender?: string | null
          graduation_date?: string | null
          id?: string
          id_number?: string | null
          major: string
          name: string
          nationality?: string | null
          personal_info?: string | null
          school: string
          status?: string | null
          student_id?: string | null
          study_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admission_photo?: string | null
          birth_date?: string | null
          branch?: string | null
          class?: string | null
          created_at?: string | null
          degree_level?: string | null
          degree_photo?: string | null
          department?: string | null
          duration?: string | null
          education_type?: string | null
          enrollment_date?: string | null
          gender?: string | null
          graduation_date?: string | null
          id?: string
          id_number?: string | null
          major?: string
          name?: string
          nationality?: string | null
          personal_info?: string | null
          school?: string
          status?: string | null
          student_id?: string | null
          study_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          password: string
          remaining_logins: number
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password: string
          remaining_logins?: number
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password?: string
          remaining_logins?: number
          updated_at?: string | null
          username?: string
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
