export const MATERIAL_FORMATS = [
  { value: 'texto', label: 'Texto', icon: 'FileText' },
  { value: 'imagen', label: 'Imagen', icon: 'Image' },
  { value: 'video', label: 'Video', icon: 'Video' },
] as const

export const EXPECTED_CATEGORIES = [
  {
    value: 'sin_alteraciones',
    label: 'Sin alteraciones',
    color: '#10B981',
    icon: 'CheckCircle',
    description: 'Material auténtico sin modificaciones',
  },
  {
    value: 'manipulado_digitalmente',
    label: 'Manipulado digitalmente',
    color: '#F59E0B',
    icon: 'Scissors',
    description: 'Editado con software (Photoshop, etc.)',
  },
  {
    value: 'generado_por_ia',
    label: 'Generado por IA',
    color: '#8B5CF6',
    icon: 'Bot',
    description: 'Creado completamente con inteligencia artificial',
  },
  {
    value: 'deepfake',
    label: 'Deepfake',
    color: '#EF4444',
    icon: 'UserX',
    description: 'Rostro o voz sintética/reemplazada',
  },
  {
    value: 'desinformacion_textual',
    label: 'Desinformación textual',
    color: '#EC4899',
    icon: 'AlertTriangle',
    description: 'Fake news, hoaxes, cadenas falsas',
  },
] as const

export const DEFAULT_ANALYSIS_STATES = [
  { name: 'Pendiente', color: '#FCD34D', order: 1, isDefault: true },
  { name: 'En progreso', color: '#60A5FA', order: 2, isDefault: false },
  { name: 'Analizado', color: '#34D399', order: 3, isDefault: false },
  { name: 'Incompleto', color: '#F87171', order: 4, isDefault: false },
  { name: 'Requiere revisión', color: '#A78BFA', order: 5, isDefault: false },
] as const

export type MaterialFormatValue = (typeof MATERIAL_FORMATS)[number]['value']
export type ExpectedCategoryValue = (typeof EXPECTED_CATEGORIES)[number]['value']
