// lib/actions.ts
'use server'

import { supabase } from '@/lib/supabase'
import { Equipment, MaintenanceRequest, MaintenanceLog, User } from '@/types/database'
import { revalidatePath } from 'next/cache'

// ====================================
// EQUIPAMENTOS
// ====================================

export async function getEquipmentsByUser(userId: string, userRole: string, campusId?: string) {
  try {
    let query = supabase.from('equipment').select(`
      *,
      campus:campus_id (name),
      responsible:responsible_id (name)
    `)

    // Filtrar por role
    if (userRole === 'lider_midia' || userRole === 'pastor') {
      query = query.eq('campus_id', campusId)
    } else if (userRole === 'lider_regional') {
      // Líderes regionais veem equipamentos de sua região
      const { data: userRegion } = await supabase
        .from('users')
        .select('region_id')
        .eq('id', userId)
        .single()

      if (userRegion?.region_id) {
        const { data: campuses } = await supabase
          .from('campus')
          .select('id')
          .eq('region_id', userRegion.region_id)

        const campusIds = campuses?.map(c => c.id) || []
        query = query.in('campus_id', campusIds)
      }
    }
    // Admin vê tudo

    const { data, error } = await query

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error)
    return { data: [], error }
  }
}

export async function createEquipment(equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .insert([equipment])
      .select()

    if (error) throw error

    revalidatePath('/equipamentos')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Erro ao criar equipamento:', error)
    return { data: null, error }
  }
}

export async function updateEquipment(id: string, updates: Partial<Equipment>) {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    revalidatePath('/equipamentos')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error)
    return { data: null, error }
  }
}

export async function deleteEquipment(id: string) {
  try {
    const { error } = await supabase.from('equipment').delete().eq('id', id)

    if (error) throw error

    revalidatePath('/equipamentos')
    return { error: null }
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error)
    return { error }
  }
}

// ====================================
// MANUTENÇÕES
// ====================================

export async function getMaintenanceRequests(userId: string, userRole: string, campusId?: string) {
  try {
    let query = supabase.from('maintenance_requests').select(`
      *,
      equipment:equipment_id (name, campus_id),
      campus:campus_id (name),
      created_by:created_by_id (name),
      assigned_to:assigned_to_id (name)
    `)

    if (userRole === 'rodrigo') {
      // Rodrigo vê tudo
    } else if (userRole === 'lider_midia' || userRole === 'pastor') {
      query = query.eq('campus_id', campusId)
    } else if (userRole === 'admin') {
      // Admin vê tudo
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as any[], error: null }
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error)
    return { data: [], error }
  }
}

export async function createMaintenanceRequest(request: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([request])
      .select()

    if (error) throw error

    // Criar notificação para Rodrigo
    if (data?.[0]) {
      await supabase.from('maintenance_notifications').insert({
        maintenance_request_id: data[0].id,
        recipient_id: (await getUser('rodrigo'))?.id,
        notification_type: 'nova_requisicao',
        message: `Nova requisição de manutenção: ${data[0].problem_description}`,
        is_read: false,
      })
    }

    revalidatePath('/manutencoes')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Erro ao criar manutenção:', error)
    return { data: null, error }
  }
}

export async function updateMaintenanceStatus(id: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error

    revalidatePath('/manutencoes')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return { data: null, error }
  }
}

export async function addMaintenanceLog(log: Omit<MaintenanceLog, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert([log])
      .select()

    if (error) throw error

    revalidatePath('/manutencoes')
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Erro ao adicionar log:', error)
    return { data: null, error }
  }
}

// ====================================
// UTILITÁRIOS
// ====================================

async function getUser(email: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data as User
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

export async function getCampuses() {
  try {
    const { data, error } = await supabase
      .from('campus')
      .select('*')
      .order('name')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Erro ao buscar campus:', error)
    return { data: [], error }
  }
}

export async function getMaintenanceStats(userId: string, userRole: string, campusId?: string) {
  try {
    let maintenanceQuery = supabase.from('maintenance_requests').select('*')

    if (userRole === 'lider_midia' || userRole === 'pastor') {
      maintenanceQuery = maintenanceQuery.eq('campus_id', campusId)
    }

    const { data, error } = await maintenanceQuery

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      abertas: data?.filter(m => m.status === 'aberto').length || 0,
      em_manutencao: data?.filter(m => m.status === 'em_conserto' || m.status === 'aguardando_pecas').length || 0,
      prontas: data?.filter(m => m.status === 'pronto').length || 0,
      atrasadas: data?.filter(m => m.scheduled_completion_date && new Date(m.scheduled_completion_date) < new Date() && !['entregue', 'cancelado'].includes(m.status)).length || 0,
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return { data: null, error }
  }
}
