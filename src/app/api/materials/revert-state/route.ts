import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para revertir el estado de un material.
 * Usado por sendBeacon cuando se cierra/recarga la página.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { materialId, previousStateId } = body

    console.log('[API revert-state] Recibido:', { materialId, previousStateId })

    if (!materialId) {
      return NextResponse.json({ error: 'materialId requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('materials')
      .update({
        analysis_state_id: previousStateId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (error) {
      console.error('[API revert-state] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API revert-state] Éxito - material revertido:', materialId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API revert-state] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
