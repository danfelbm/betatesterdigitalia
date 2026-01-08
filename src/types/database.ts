export type MaterialFormat = 'texto' | 'imagen' | 'video'

export type ExpectedCategory =
  | 'sin_alteraciones'
  | 'manipulado_digitalmente'
  | 'generado_por_ia'
  | 'deepfake'
  | 'desinformacion_textual'

export interface AnalysisState {
  id: string
  name: string
  color: string
  display_order: number
  user_id: string
  is_default: boolean
  created_at: string
}

export interface Material {
  id: string
  url: string
  format: MaterialFormat
  expected_category: ExpectedCategory
  source: string
  description: string | null
  subcategory: string | null
  analysis_notes: string | null
  analysis_state_id: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Joined data
  analysis_state?: AnalysisState | null
}

export interface MaterialInsert {
  url: string
  format: MaterialFormat
  expected_category: ExpectedCategory
  source: string
  description?: string | null
  subcategory?: string | null
  analysis_notes?: string | null
  analysis_state_id?: string | null
}

export interface MaterialUpdate {
  url?: string
  format?: MaterialFormat
  expected_category?: ExpectedCategory
  source?: string
  description?: string | null
  subcategory?: string | null
  analysis_notes?: string | null
  analysis_state_id?: string | null
}

export interface AnalysisStateInsert {
  name: string
  color?: string
  display_order?: number
  is_default?: boolean
}

export interface AnalysisStateUpdate {
  name?: string
  color?: string
  display_order?: number
  is_default?: boolean
}

// Database response types
export interface Database {
  public: {
    Tables: {
      materials: {
        Row: Material
        Insert: MaterialInsert & { user_id: string }
        Update: MaterialUpdate
      }
      analysis_states: {
        Row: AnalysisState
        Insert: AnalysisStateInsert & { user_id: string }
        Update: AnalysisStateUpdate
      }
    }
    Enums: {
      material_format: MaterialFormat
      expected_category: ExpectedCategory
    }
  }
}
