'use server'

import { supabase } from '@/lib/supabase'
import { getInventorySession } from './auth'
import { getCurrentStock } from './materials'

// ─────────────────────────────────────────────────────
// STOCK ENTRIES (Purchases)
// ─────────────────────────────────────────────────────
export async function addStockEntry(payload: {
  entry_date: string
  material_id: string
  quantity: number
  rate: number
  program_id?: string
  supplier?: string
  remarks?: string
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  if (!payload.material_id) return { success: false, message: 'Material selection is required.' }
  if (!payload.quantity || payload.quantity <= 0) return { success: false, message: 'Quantity must be greater than 0.' }
  if (!payload.entry_date) return { success: false, message: 'Entry date is required.' }
  if (payload.rate < 0) return { success: false, message: 'Rate cannot be negative.' }

  const amount = payload.quantity * payload.rate

  // Insert stock entry
  const { data: entry, error: entryErr } = await supabase.from('inv_stock_entries').insert({
    entry_date: payload.entry_date,
    material_id: payload.material_id,
    quantity: payload.quantity,
    rate: payload.rate,
    amount,
    program_id: payload.program_id || null,
    supplier: payload.supplier?.trim() || null,
    remarks: payload.remarks?.trim() || null,
    created_by: session.name,
  }).select('id').single()

  if (entryErr || !entry) return { success: false, message: entryErr?.message || 'Error occurred' }

  // Get current balance and add ledger entry
  const currentBalance = await getCurrentStock(payload.material_id)
  const newBalance = currentBalance + payload.quantity

  await supabase.from('inv_stock_ledger').insert({
    material_id: payload.material_id,
    entry_date: payload.entry_date,
    transaction_type: 'purchase',
    reference_id: entry.id,
    reference_note: payload.supplier ? `Supplier: ${payload.supplier}` : 'Purchase',
    qty_in: payload.quantity,
    qty_out: 0,
    balance: newBalance,
    created_by: session.name,
  })

  return { success: true, message: `${payload.quantity} units added to stock. New balance: ${newBalance.toFixed(3)}` }
}

export async function getStockEntries(filters?: { materialId?: string; fromDate?: string; toDate?: string; programId?: string }) {
  let query = supabase
    .from('inv_stock_entries')
    .select(`*, inv_materials(name, unit, inv_material_groups(name)), inv_programs(name)`)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.materialId) query = query.eq('material_id', filters.materialId)
  if (filters?.programId) query = query.eq('program_id', filters.programId)
  if (filters?.fromDate) query = query.gte('entry_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('entry_date', filters.toDate)

  const { data } = await query
  return data || []
}

export async function deleteStockEntry(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session?.isAdmin) return { success: false, message: 'Only Admin can delete stock entries.' }

  // Get the entry to reverse ledger
  const { data: entry } = await supabase.from('inv_stock_entries').select('*').eq('id', id).single()
  if (!entry) return { success: false, message: 'Entry not found.' }

  // Check if stock would go negative after deletion
  const currentBalance = await getCurrentStock(entry.material_id)
  if (currentBalance - entry.quantity < 0) {
    return { success: false, message: 'Deleting this entry would make stock negative.' }
  }

  await supabase.from('inv_stock_ledger').delete().eq('reference_id', id).eq('transaction_type', 'purchase')
  await supabase.from('inv_stock_entries').delete().eq('id', id)
  return { success: true, message: 'Stock entry deleted successfully.' }
}

// ─────────────────────────────────────────────────────
// MATERIAL ISSUES
// ─────────────────────────────────────────────────────
export async function issueMaterial(payload: {
  program_id: string
  material_id: string
  issued_qty: number
  issue_date: string
  remarks?: string
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  if (!payload.material_id) return { success: false, message: 'Material is required.' }
  if (!payload.program_id) return { success: false, message: 'Program is required.' }
  if (!payload.issued_qty || payload.issued_qty <= 0) return { success: false, message: 'Issued quantity must be greater than 0.' }

  // Check available stock
  const currentStock = await getCurrentStock(payload.material_id)
  if (currentStock < payload.issued_qty) {
    return { success: false, message: `Insufficient stock. Available: ${currentStock.toFixed(3)}, Requested: ${payload.issued_qty}` }
  }

  const { data: issue, error } = await supabase.from('inv_material_issues').insert({
    program_id: payload.program_id,
    material_id: payload.material_id,
    issued_qty: payload.issued_qty,
    issue_date: payload.issue_date,
    issued_by: session.name,
    remarks: payload.remarks?.trim() || null,
  }).select('id').single()

  if (error || !issue) return { success: false, message: error?.message || 'Error occurred' }

  // Ledger entry
  const newBalance = currentStock - payload.issued_qty
  await supabase.from('inv_stock_ledger').insert({
    material_id: payload.material_id,
    entry_date: payload.issue_date,
    transaction_type: 'issue',
    reference_id: issue.id,
    reference_note: `Issued to Program`,
    qty_in: 0,
    qty_out: payload.issued_qty,
    balance: newBalance,
    created_by: session.name,
  })

  return { success: true, message: `${payload.issued_qty} units issued. Remaining stock: ${newBalance.toFixed(3)}` }
}

export async function getMaterialIssues(filters?: { programId?: string; materialId?: string; fromDate?: string; toDate?: string }) {
  let query = supabase
    .from('inv_material_issues')
    .select(`*, inv_materials(name, unit, inv_material_groups(name)), inv_programs(name)`)
    .order('issue_date', { ascending: false })

  if (filters?.programId) query = query.eq('program_id', filters.programId)
  if (filters?.materialId) query = query.eq('material_id', filters.materialId)
  if (filters?.fromDate) query = query.gte('issue_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('issue_date', filters.toDate)

  const { data } = await query
  return data || []
}

// ─────────────────────────────────────────────────────
// CONSUMPTION ENTRIES
// ─────────────────────────────────────────────────────
export async function addConsumption(payload: {
  program_id: string
  material_id: string
  issued_qty: number
  consumed_qty: number
  entry_date: string
  remarks?: string
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  if (!payload.material_id) return { success: false, message: 'Material is required.' }
  if (!payload.program_id) return { success: false, message: 'Program is required.' }
  if (payload.issued_qty <= 0) return { success: false, message: 'Issued quantity must be greater than 0.' }
  if (payload.consumed_qty < 0) return { success: false, message: 'Consumed quantity cannot be negative.' }
  if (payload.consumed_qty > payload.issued_qty) {
    return { success: false, message: 'Consumed quantity cannot exceed issued quantity.' }
  }

  const returned_qty = payload.issued_qty - payload.consumed_qty

  const { error } = await supabase.from('inv_consumption_entries').insert({
    program_id: payload.program_id,
    material_id: payload.material_id,
    issued_qty: payload.issued_qty,
    consumed_qty: payload.consumed_qty,
    entry_date: payload.entry_date,
    entered_by: session.name,
    remarks: payload.remarks?.trim() || null,
  })

  if (error) return { success: false, message: error.message }

  // If returned qty > 0, add return to ledger
  if (returned_qty > 0) {
    const currentBalance = await getCurrentStock(payload.material_id)
    const newBalance = currentBalance + returned_qty

    await supabase.from('inv_stock_ledger').insert({
      material_id: payload.material_id,
      entry_date: payload.entry_date,
      transaction_type: 'return',
      reference_note: `Returned (Program End)`,
      qty_in: returned_qty,
      qty_out: 0,
      balance: newBalance,
      created_by: session.name,
    })
  }

  return {
    success: true,
    message: `Consumption saved. Consumed: ${payload.consumed_qty}, Returned to stock: ${returned_qty.toFixed(3)}`
  }
}

export async function getConsumptionEntries(filters?: { programId?: string; materialId?: string; fromDate?: string; toDate?: string }) {
  let query = supabase
    .from('inv_consumption_entries')
    .select(`*, inv_materials(name, unit, inv_material_groups(name)), inv_programs(name)`)
    .order('entry_date', { ascending: false })

  if (filters?.programId) query = query.eq('program_id', filters.programId)
  if (filters?.materialId) query = query.eq('material_id', filters.materialId)
  if (filters?.fromDate) query = query.gte('entry_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('entry_date', filters.toDate)

  const { data } = await query
  return data || []
}

// ─────────────────────────────────────────────────────
// STOCK LEDGER
// ─────────────────────────────────────────────────────
export async function getStockLedger(filters?: { materialId?: string; fromDate?: string; toDate?: string; transactionType?: string }) {
  let query = supabase
    .from('inv_stock_ledger')
    .select(`*, inv_materials(name, unit, inv_material_groups(name))`)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.materialId) query = query.eq('material_id', filters.materialId)
  if (filters?.transactionType) query = query.eq('transaction_type', filters.transactionType)
  if (filters?.fromDate) query = query.gte('entry_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('entry_date', filters.toDate)

  const { data } = await query.limit(500)
  return data || []
}

// Opening stock adjustment
export async function addOpeningStock(payload: {
  material_id: string
  quantity: number
  entry_date: string
  remarks?: string
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }
  if (!payload.quantity || payload.quantity < 0) return { success: false, message: 'Please enter a valid quantity.' }

  const { error } = await supabase.from('inv_stock_ledger').insert({
    material_id: payload.material_id,
    entry_date: payload.entry_date,
    transaction_type: 'opening',
    reference_note: payload.remarks || 'Opening Stock',
    qty_in: payload.quantity,
    qty_out: 0,
    balance: payload.quantity,
    created_by: session.name,
  })

  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Opening stock saved successfully.' }
}
