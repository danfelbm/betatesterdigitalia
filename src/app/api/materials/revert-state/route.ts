import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para revertir el estado de un material.
 * Usado por sendBeacon cuando se cierra/recarga la página.
 *
 * IMPORTANTE: Usa cliente admin (service role) porque sendBeacon
 * puede no incluir cookies de autenticación correctamente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { materialId, previousStateId } = body

    if (!materialId) {
      return NextResponse.json({ error: 'materialId requerido' }, { status: 400 })
    }

    // Usar cliente admin para bypass RLS (sendBeacon no tiene cookies)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Si previousStateId es el ID del estado "En progreso", buscar "Pendiente" en su lugar
    let stateIdToSet = previousStateId

    if (previousStateId) {
      // Verificar si previousStateId es "En progreso"
      const { data: prevState } = await supabase
        .from('analysis_states')
        .select('name')
        .eq('id', previousStateId)
        .single()

      if (prevState?.name?.toLowerCase() === 'en progreso') {
        // Buscar el estado "Pendiente" en su lugar
        const { data: pendingState } = await supabase
          .from('analysis_states')
          .select('id')
          .ilike('name', 'pendiente')
          .single()

        if (pendingState) {
          stateIdToSet = pendingState.id
        }
      }
    }

    const { error } = await supabase
      .from('materials')
      .update({
        analysis_state_id: stateIdToSet,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
