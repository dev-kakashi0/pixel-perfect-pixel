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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      book_assignments: {
        Row: {
          annee_integration: number | null
          book_id: string
          created_at: string
          id: string
          ordre_lecture: number
          student_id: string
        }
        Insert: {
          annee_integration?: number | null
          book_id: string
          created_at?: string
          id?: string
          ordre_lecture?: number
          student_id: string
        }
        Update: {
          annee_integration?: number | null
          book_id?: string
          created_at?: string
          id?: string
          ordre_lecture?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_assignments_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          auteur: string | null
          couverture_url: string | null
          created_at: string
          id: string
          pages_total: number
          titre: string
        }
        Insert: {
          auteur?: string | null
          couverture_url?: string | null
          created_at?: string
          id?: string
          pages_total?: number
          titre: string
        }
        Update: {
          auteur?: string | null
          couverture_url?: string | null
          created_at?: string
          id?: string
          pages_total?: number
          titre?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          coche_le: string | null
          coche_par: string | null
          created_at: string
          id: string
          mois: string
          montant: number
          paye: boolean
          student_id: string
        }
        Insert: {
          coche_le?: string | null
          coche_par?: string | null
          created_at?: string
          id?: string
          mois: string
          montant?: number
          paye?: boolean
          student_id: string
        }
        Update: {
          coche_le?: string | null
          coche_par?: string | null
          created_at?: string
          id?: string
          mois?: string
          montant?: number
          paye?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_assignments: {
        Row: {
          annee_academique: string
          created_at: string
          house_id: string
          id: string
          profile_id: string
        }
        Insert: {
          annee_academique: string
          created_at?: string
          house_id: string
          id?: string
          profile_id: string
        }
        Update: {
          annee_academique?: string
          created_at?: string
          house_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_assignments_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          capacite: number
          created_at: string
          genre: Database["public"]["Enums"]["house_gender"]
          id: string
          nom: string
          ville: string
        }
        Insert: {
          capacite?: number
          created_at?: string
          genre: Database["public"]["Enums"]["house_gender"]
          id?: string
          nom: string
          ville: string
        }
        Update: {
          capacite?: number
          created_at?: string
          genre?: Database["public"]["Enums"]["house_gender"]
          id?: string
          nom?: string
          ville?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          annee_etude: string | null
          annee_integration: number | null
          created_at: string
          email: string | null
          faculte: string | null
          house_id: string | null
          id: string
          nom: string
          origine: string | null
          prenom: string
          statut: Database["public"]["Enums"]["profile_status"]
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          age?: number | null
          annee_etude?: string | null
          annee_integration?: number | null
          created_at?: string
          email?: string | null
          faculte?: string | null
          house_id?: string | null
          id: string
          nom?: string
          origine?: string | null
          prenom?: string
          statut?: Database["public"]["Enums"]["profile_status"]
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          age?: number | null
          annee_etude?: string | null
          annee_integration?: number | null
          created_at?: string
          email?: string | null
          faculte?: string | null
          house_id?: string | null
          id?: string
          nom?: string
          origine?: string | null
          prenom?: string
          statut?: Database["public"]["Enums"]["profile_status"]
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_logs: {
        Row: {
          book_id: string | null
          created_at: string
          date: string
          id: string
          motif_non_lecture: string | null
          pages_lues: number
          student_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          date?: string
          id?: string
          motif_non_lecture?: string | null
          pages_lues?: number
          student_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          date?: string
          id?: string
          motif_non_lecture?: string | null
          pages_lues?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_logs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          house_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          house_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          house_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manages_house: {
        Args: { _house_id: string; _user_id: string }
        Returns: boolean
      }
      manages_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      my_house_id: { Args: { _user_id: string }; Returns: string }
      my_ville: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "responsable" | "etudiant"
      house_gender: "garcons" | "filles"
      profile_status: "en_attente" | "valide" | "refuse"
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
      app_role: ["admin", "responsable", "etudiant"],
      house_gender: ["garcons", "filles"],
      profile_status: ["en_attente", "valide", "refuse"],
    },
  },
} as const
