'use server'

import { supabase } from '@/lib/supabase'
import { getInventorySession } from './auth'

// ─────────────────────────────────────────────────────
// MATERIAL GROUPS
// ─────────────────────────────────────────────────────
export async function getMaterialGroups() {
  const { data, error } = await supabase
    .from('inv_material_groups')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return []
  return data || []
}

export async function saveGroup(payload: {
  id?: string
  name: string
  description?: string
  sort_order?: number
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized access.' }
  if (!payload.name.trim()) return { success: false, message: 'Group name is required.' }

  const data = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    sort_order: payload.sort_order || 99,
    updated_at: new Date().toISOString(),
  }

  if (payload.id) {
    const { error } = await supabase.from('inv_material_groups').update(data).eq('id', payload.id)
    if (error) return { success: false, message: 'Update failed: ' + error.message }
    return { success: true, message: 'Group updated successfully.' }
  } else {
    const { error } = await supabase.from('inv_material_groups').insert(data)
    if (error) return { success: false, message: 'Failed to add group: ' + error.message }
    return { success: true, message: 'Group added successfully.' }
  }
}

export async function toggleGroupStatus(id: string, is_active: boolean): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  const { error } = await supabase.from('inv_material_groups').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: is_active ? 'Group activated successfully.' : 'Group deactivated successfully.' }
}

export async function deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  // Check if any materials use this group
  const { count } = await supabase.from('inv_materials').select('id', { count: 'exact', head: true }).eq('group_id', id)
  if ((count ?? 0) > 0) {
    return { success: false, message: 'This group contains materials. Remove or move materials first.' }
  }

  const { error } = await supabase.from('inv_material_groups').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Group deleted successfully.' }
}

// ─────────────────────────────────────────────────────
// MATERIALS
// ─────────────────────────────────────────────────────
export async function getMaterials(filters?: { groupId?: string; search?: string; activeOnly?: boolean }) {
  let query = supabase
    .from('inv_materials')
    .select(`*, inv_material_groups(name)`)
    .order('name', { ascending: true })

  if (filters?.groupId) query = query.eq('group_id', filters.groupId)
  if (filters?.activeOnly) query = query.eq('is_active', true)
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) return []
  return data || []
}

export async function getMaterialById(id: string) {
  const { data } = await supabase
    .from('inv_materials')
    .select(`*, inv_material_groups(name)`)
    .eq('id', id)
    .single()
  return data
}

export async function saveMaterial(payload: {
  id?: string
  name: string
  group_id: string
  unit: string
  current_rate: number
  min_rate?: number
  max_rate?: number
  description?: string
  min_stock_level?: number
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  if (!payload.name.trim()) return { success: false, message: 'Material name is required.' }
  if (!payload.group_id) return { success: false, message: 'Material group is required.' }
  if (!payload.unit) return { success: false, message: 'Unit selection is required.' }

  const data = {
    name: payload.name.trim(),
    group_id: payload.group_id,
    unit: payload.unit,
    current_rate: payload.current_rate || 0,
    min_rate: payload.min_rate || null,
    max_rate: payload.max_rate || null,
    description: payload.description?.trim() || null,
    min_stock_level: payload.min_stock_level || 0,
    updated_at: new Date().toISOString(),
  }

  if (payload.id) {
    const { error } = await supabase.from('inv_materials').update(data).eq('id', payload.id)
    if (error) return { success: false, message: 'Update failed: ' + error.message }
    return { success: true, message: 'Material updated successfully.' }
  } else {
    const { error } = await supabase.from('inv_materials').insert(data)
    if (error) return { success: false, message: 'Failed to add material: ' + error.message }
    return { success: true, message: 'Material added successfully.' }
  }
}

export async function toggleMaterialStatus(id: string, is_active: boolean): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }
  const { error } = await supabase.from('inv_materials').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: is_active ? 'Material activated successfully.' : 'Material deactivated successfully.' }
}

export async function deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  // Check ledger/stock entries
  const { count: ledgerCount } = await supabase.from('inv_stock_ledger').select('id', { count: 'exact', head: true }).eq('material_id', id)
  if ((ledgerCount ?? 0) > 0) {
    return { success: false, message: 'This material has transaction history. Deletion not possible.' }
  }

  const { error } = await supabase.from('inv_materials').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Material deleted successfully.' }
}

// ─────────────────────────────────────────────────────
// STOCK HELPERS
// ─────────────────────────────────────────────────────
export async function getCurrentStock(materialId: string): Promise<number> {
  const { data } = await supabase
    .from('inv_stock_ledger')
    .select('qty_in, qty_out')
    .eq('material_id', materialId)

  if (!data || data.length === 0) return 0
  const balance = data.reduce((acc, row) => acc + Number(row.qty_in) - Number(row.qty_out), 0)
  return Math.max(0, balance)
}

export async function getAllCurrentStock(): Promise<Record<string, number>> {
  const { data } = await supabase.from('inv_stock_ledger').select('material_id, qty_in, qty_out')
  if (!data) return {}

  const stockMap: Record<string, number> = {}
  for (const row of data) {
    if (!stockMap[row.material_id]) stockMap[row.material_id] = 0
    stockMap[row.material_id] += Number(row.qty_in) - Number(row.qty_out)
  }
  return stockMap
}
