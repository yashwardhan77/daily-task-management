'use server'

import { supabase } from '@/lib/supabase'
import { getInventorySession } from './auth'

export async function getDashboardStats() {
  const [
    { count: totalPrograms },
    { count: totalMaterials },
    { data: ledgerData },
    { data: stockData },
    { data: upcomingPrograms },
    { data: recentPurchases },
  ] = await Promise.all([
    supabase.from('inv_programs').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('inv_materials').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('inv_stock_ledger').select('material_id, qty_in, qty_out'),
    supabase.from('inv_materials').select('id, current_rate, min_stock_level, is_active').eq('is_active', true),
    supabase.from('inv_programs')
      .select('id, name, start_date, location, participants_count, status')
      .eq('is_deleted', false)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(5),
    supabase.from('inv_stock_entries')
      .select('amount, entry_date')
      .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
  ])

  // Compute current stock balances per material
  const stockMap: Record<string, number> = {}
  for (const row of (ledgerData || [])) {
    if (!stockMap[row.material_id]) stockMap[row.material_id] = 0
    stockMap[row.material_id] += Number(row.qty_in) - Number(row.qty_out)
  }

  // Stock value
  let stockValue = 0
  let lowStockCount = 0
  for (const mat of (stockData || [])) {
    const bal = Math.max(0, stockMap[mat.id] || 0)
    stockValue += bal * Number(mat.current_rate)
    if (bal <= Number(mat.min_stock_level) && bal >= 0) lowStockCount++
  }

  const monthlyPurchase = (recentPurchases || []).reduce((acc, r) => acc + Number(r.amount), 0)

  return {
    totalPrograms: totalPrograms || 0,
    totalMaterials: totalMaterials || 0,
    stockValue: Math.round(stockValue),
    lowStockCount,
    upcomingPrograms: upcomingPrograms || [],
    monthlyPurchase: Math.round(monthlyPurchase),
  }
}

export async function getStockReport(filters?: { groupId?: string; fromDate?: string; toDate?: string }) {
  // Get all active materials with their group
  let matQuery = supabase.from('inv_materials').select(`id, name, unit, current_rate, min_stock_level, inv_material_groups(name)`).eq('is_active', true)
  if (filters?.groupId) matQuery = matQuery.eq('group_id', filters.groupId)

  const { data: materials } = await matQuery.order('name')

  // Get stock entries (purchases) in range
  let seQuery = supabase.from('inv_stock_entries').select('material_id, quantity, amount')
  if (filters?.fromDate) seQuery = seQuery.gte('entry_date', filters.fromDate)
  if (filters?.toDate) seQuery = seQuery.lte('entry_date', filters.toDate)
  const { data: entries } = await seQuery

  // Get all ledger for current balance
  const { data: ledger } = await supabase.from('inv_stock_ledger').select('material_id, qty_in, qty_out')

  const stockMap: Record<string, number> = {}
  for (const row of (ledger || [])) {
    if (!stockMap[row.material_id]) stockMap[row.material_id] = 0
    stockMap[row.material_id] += Number(row.qty_in) - Number(row.qty_out)
  }

  const purchaseMap: Record<string, { qty: number; amount: number }> = {}
  for (const row of (entries || [])) {
    if (!purchaseMap[row.material_id]) purchaseMap[row.material_id] = { qty: 0, amount: 0 }
    purchaseMap[row.material_id].qty += Number(row.quantity)
    purchaseMap[row.material_id].amount += Number(row.amount)
  }

  return (materials || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    group: m.inv_material_groups?.name || '',
    current_rate: m.current_rate,
    min_stock_level: m.min_stock_level,
    current_stock: Math.max(0, stockMap[m.id] || 0),
    stock_value: Math.max(0, stockMap[m.id] || 0) * Number(m.current_rate),
    purchased_qty: purchaseMap[m.id]?.qty || 0,
    purchase_amount: purchaseMap[m.id]?.amount || 0,
    is_low: (stockMap[m.id] || 0) <= Number(m.min_stock_level),
  }))
}

export async function getProgramReport(filters?: { status?: string; fromDate?: string; toDate?: string }) {
  let query = supabase
    .from('inv_programs')
    .select(`id, name, program_type, location, start_date, end_date, participants_count, status, inv_program_templates(name)`)
    .eq('is_deleted', false)
    .order('start_date', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.fromDate) query = query.gte('start_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('end_date', filters.toDate)

  const { data: programs } = await query

  // Get cost per program
  const { data: reqs } = await supabase.from('inv_program_requirements').select('program_id, estimated_cost')
  const { data: purchases } = await supabase.from('inv_stock_entries').select('program_id, amount').not('program_id', 'is', null)

  const reqCostMap: Record<string, number> = {}
  for (const r of (reqs || [])) {
    if (!reqCostMap[r.program_id]) reqCostMap[r.program_id] = 0
    reqCostMap[r.program_id] += Number(r.estimated_cost)
  }

  const actualCostMap: Record<string, number> = {}
  for (const r of (purchases || [])) {
    if (!r.program_id) continue
    if (!actualCostMap[r.program_id]) actualCostMap[r.program_id] = 0
    actualCostMap[r.program_id] += Number(r.amount)
  }

  return (programs || []).map((p: any) => ({
    ...p,
    template_name: p.inv_program_templates?.name || '-',
    estimated_cost: reqCostMap[p.id] || 0,
    actual_cost: actualCostMap[p.id] || 0,
    cost_per_person: p.participants_count > 0 ? (actualCostMap[p.id] || 0) / p.participants_count : 0,
  }))
}

export async function getConsumptionReport(filters?: { groupId?: string; materialId?: string; fromDate?: string; toDate?: string }) {
  let query = supabase
    .from('inv_consumption_entries')
    .select(`*, inv_materials(name, unit, current_rate, inv_material_groups(id, name)), inv_programs(name, participants_count)`)
    .order('entry_date', { ascending: false })

  if (filters?.materialId) query = query.eq('material_id', filters.materialId)
  if (filters?.fromDate) query = query.gte('entry_date', filters.fromDate)
  if (filters?.toDate) query = query.lte('entry_date', filters.toDate)
  if (filters?.groupId) query = query.eq('inv_materials.group_id', filters.groupId)

  const { data } = await query
  return (data || []).map((r: any) => ({
    ...r,
    material_name: r.inv_materials?.name,
    unit: r.inv_materials?.unit,
    group_name: r.inv_materials?.inv_material_groups?.name,
    program_name: r.inv_programs?.name,
    participants: r.inv_programs?.participants_count,
    consumption_value: Number(r.consumed_qty) * Number(r.inv_materials?.current_rate || 0),
  }))
}

export async function getLowStockItems() {
  const { data: materials } = await supabase
    .from('inv_materials')
    .select(`id, name, unit, current_rate, min_stock_level, inv_material_groups(name)`)
    .eq('is_active', true)

  const { data: ledger } = await supabase.from('inv_stock_ledger').select('material_id, qty_in, qty_out')

  const stockMap: Record<string, number> = {}
  for (const row of (ledger || [])) {
    if (!stockMap[row.material_id]) stockMap[row.material_id] = 0
    stockMap[row.material_id] += Number(row.qty_in) - Number(row.qty_out)
  }

  return (materials || [])
    .filter((m: any) => {
      const bal = stockMap[m.id] || 0
      return bal <= Number(m.min_stock_level)
    })
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      group: m.inv_material_groups?.name || '',
      current_stock: Math.max(0, stockMap[m.id] || 0),
      min_stock_level: m.min_stock_level,
    }))
    .sort((a: any, b: any) => a.current_stock - b.current_stock)
}
