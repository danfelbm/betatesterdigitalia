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

// ============================================
// GRUPOS DE ETIQUETAS
// ============================================

export interface TagGroup {
  id: string
  name: string
  description: string | null
  display_order: number
  user_id: string
  created_at: string
  // Datos relacionados (JOINs)
  tags?: Tag[]
}

export interface TagGroupInsert {
  name: string
  description?: string | null
  display_order?: number
}

export interface TagGroupUpdate {
  name?: string
  description?: string | null
  display_order?: number
}

// ============================================
// ETIQUETAS
// ============================================

export interface Tag {
  id: string
  group_id: string
  name: string
  color: string
  description: string | null
  display_order: number
  created_at: string
  // Datos relacionados (JOINs)
  tag_group?: TagGroup | null
}

export interface TagInsert {
  group_id: string
  name: string
  color?: string
  description?: string | null
  display_order?: number
}

export interface TagUpdate {
  name?: string
  color?: string
  description?: string | null
  display_order?: number
}

// ============================================
// COMENTARIOS DE ANÁLISIS (INMUTABLES)
// ============================================

export interface Comment {
  id: string
  material_id: string
  content: string
  analysis_state_id: string | null
  user_id: string
  created_at: string
  // Datos relacionados (JOINs)
  analysis_state?: AnalysisState | null
}

export interface CommentInsert {
  material_id: string
  content: string
  analysis_state_id?: string | null
}

// Nota: No hay CommentUpdate - los comentarios son inmutables

// ============================================
// RELACIÓN MATERIAL-ETIQUETA
// ============================================

export interface MaterialTag {
  id: string
  material_id: string
  tag_id: string
  created_at: string
  // Datos relacionados (JOINs)
  tag?: Tag | null
}

export interface MaterialTagInsert {
  material_id: string
  tag_id: string
}

// ============================================
// DATOS PARA MODAL DE ANÁLISIS
// ============================================

export interface SubmitAnalysisData {
  comment: string
  analysis_state_id: string | null
  tag_ids: string[]
}

export interface SubmitAnalysisResult {
  comment: Comment | null
  material: Material | null
}

// Grupos con etiquetas para selector
export interface TagGroupWithTags extends TagGroup {
  tags: Tag[]
}

export interface Material {
  id: string
  url: string
  format: MaterialFormat
  expected_category: ExpectedCategory
  source: string
  description: string | null
  subcategory: string | null
  analysis_notes: string | null  // DEPRECADO: usar tabla comments
  analysis_state_id: string | null
  user_id: string
  created_at: string
  updated_at: string
  // Datos relacionados (JOINs)
  analysis_state?: AnalysisState | null
  tags?: Tag[]
  comments_count?: number
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
      tag_groups: {
        Row: TagGroup
        Insert: TagGroupInsert & { user_id: string }
        Update: TagGroupUpdate
      }
      tags: {
        Row: Tag
        Insert: TagInsert
        Update: TagUpdate
      }
      comments: {
        Row: Comment
        Insert: CommentInsert & { user_id: string }
        Update: never  // Comentarios son inmutables
      }
      material_tags: {
        Row: MaterialTag
        Insert: MaterialTagInsert
        Update: never  // Solo insert/delete
      }
    }
    Enums: {
      material_format: MaterialFormat
      expected_category: ExpectedCategory
    }
  }
}
