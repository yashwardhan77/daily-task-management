'use server'

import { supabase } from '@/lib/supabase'
import { getInventorySession } from './auth'

// ─────────────────────────────────────────────────────
// PROGRAM TEMPLATES
// ─────────────────────────────────────────────────────
export async function getTemplates() {
  const { data } = await supabase
    .from('inv_program_templates')
    .select(`*, inv_template_items(count)`)
    .eq('is_active', true)
    .order('name', { ascending: true })
  return data || []
}

export async function getTemplateWithItems(templateId: string) {
  const { data: template } = await supabase
    .from('inv_program_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  const { data: items } = await supabase
    .from('inv_template_items')
    .select(`*, inv_materials(name, unit, current_rate, inv_material_groups(name))`)
    .eq('template_id', templateId)

  return { template, items: items || [] }
}

export async function saveTemplate(payload: {
  id?: string
  name: string
  description?: string
}): Promise<{ success: boolean; message: string; id?: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }
  if (!payload.name.trim()) return { success: false, message: 'Template name is required.' }

  const data = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    created_by: session.name,
    updated_at: new Date().toISOString(),
  }

  if (payload.id) {
    const { error } = await supabase.from('inv_program_templates').update(data).eq('id', payload.id)
    if (error) return { success: false, message: error.message }
    return { success: true, message: 'Template updated successfully.', id: payload.id }
  } else {
    const { data: inserted, error } = await supabase.from('inv_program_templates').insert(data).select('id').single()
    if (error) return { success: false, message: error.message }
    return { success: true, message: 'Template created successfully.', id: inserted.id }
  }
}

export async function saveTemplateItems(
  templateId: string,
  items: { material_id: string; qty_per_person: number; unit: string }[]
): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  // Delete old items, insert new
  await supabase.from('inv_template_items').delete().eq('template_id', templateId)

  if (items.length > 0) {
    const rows = items.map(i => ({ template_id: templateId, material_id: i.material_id, qty_per_person: i.qty_per_person, unit: i.unit }))
    const { error } = await supabase.from('inv_template_items').insert(rows)
    if (error) return { success: false, message: error.message }
  }

  return { success: true, message: `${items.length} items saved successfully.` }
}

export async function cloneTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  const { template, items } = await getTemplateWithItems(templateId)
  if (!template) return { success: false, message: 'Template not found.' }

  const { data: newTemplate, error } = await supabase.from('inv_program_templates').insert({
    name: template.name + ' (Copy)',
    description: template.description,
    created_by: session.name,
  }).select('id').single()

  if (error || !newTemplate) return { success: false, message: error?.message || 'Error occurred' }

  if (items.length > 0) {
    await supabase.from('inv_template_items').insert(
      items.map((i: any) => ({ template_id: newTemplate.id, material_id: i.material_id, qty_per_person: i.qty_per_person, unit: i.unit }))
    )
  }
  return { success: true, message: 'Template cloned successfully.' }
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  const { count } = await supabase.from('inv_programs').select('id', { count: 'exact', head: true }).eq('template_id', id)
  if ((count ?? 0) > 0) {
    return { success: false, message: 'This template is used by active programs. Deletion not possible.' }
  }
  await supabase.from('inv_template_items').delete().eq('template_id', id)
  const { error } = await supabase.from('inv_program_templates').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Template deleted successfully.' }
}

// ─────────────────────────────────────────────────────
// PROGRAMS
// ─────────────────────────────────────────────────────
export async function getPrograms(filters?: { status?: string; search?: string }) {
  let query = supabase
    .from('inv_programs')
    .select(`*, inv_program_templates(name)`)
    .eq('is_deleted', false)
    .order('start_date', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

  const { data } = await query
  return data || []
}

export async function getProgramById(id: string) {
  const { data } = await supabase
    .from('inv_programs')
    .select(`*, inv_program_templates(name)`)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()
  return data
}

export async function createProgram(payload: {
  name: string
  program_type?: string
  template_id?: string
  location?: string
  start_date: string
  end_date: string
  participants_count: number
  remarks?: string
}): Promise<{ success: boolean; message: string; id?: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  // Validation
  if (!payload.name.trim()) return { success: false, message: 'Program name is required.' }
  if (!payload.start_date) return { success: false, message: 'Start date is required.' }
  if (!payload.end_date) return { success: false, message: 'End date is required.' }
  if (payload.end_date < payload.start_date) return { success: false, message: 'End date cannot be before start date.' }
  if (!payload.participants_count || payload.participants_count < 1) return { success: false, message: 'Participants count must be at least 1.' }

  const { data: program, error } = await supabase.from('inv_programs').insert({
    name: payload.name.trim(),
    program_type: payload.program_type?.trim() || null,
    template_id: payload.template_id || null,
    location: payload.location?.trim() || null,
    start_date: payload.start_date,
    end_date: payload.end_date,
    participants_count: payload.participants_count,
    remarks: payload.remarks?.trim() || null,
    created_by: session.name,
  }).select('id').single()

  if (error || !program) return { success: false, message: error?.message || 'Error occurred' }

  // Auto-generate requirements if template selected
  if (payload.template_id) {
    await generateRequirements(program.id, payload.template_id, payload.participants_count)
  }

  return { success: true, message: 'Program created successfully.', id: program.id }
}

export async function updateProgram(payload: {
  id: string
  name: string
  program_type?: string
  template_id?: string
  location?: string
  start_date: string
  end_date: string
  participants_count: number
  status: string
  remarks?: string
  regenerateRequirements?: boolean
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  if (!payload.name.trim()) return { success: false, message: 'Program name is required.' }
  if (payload.end_date < payload.start_date) return { success: false, message: 'End date cannot be before start date.' }

  const { error } = await supabase.from('inv_programs').update({
    name: payload.name.trim(),
    program_type: payload.program_type?.trim() || null,
    template_id: payload.template_id || null,
    location: payload.location?.trim() || null,
    start_date: payload.start_date,
    end_date: payload.end_date,
    participants_count: payload.participants_count,
    status: payload.status,
    remarks: payload.remarks?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', payload.id)

  if (error) return { success: false, message: error.message }

  if (payload.regenerateRequirements && payload.template_id) {
    await supabase.from('inv_program_requirements').delete().eq('program_id', payload.id)
    await generateRequirements(payload.id, payload.template_id, payload.participants_count)
  }

  return { success: true, message: 'Program updated successfully.' }
}

export async function updateProgramStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }
  const { error } = await supabase.from('inv_programs').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Status updated successfully.' }
}

export async function deleteProgram(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session?.isAdmin) return { success: false, message: 'Only Admin can delete programs.' }
  const { error } = await supabase.from('inv_programs').update({ is_deleted: true }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Program deleted successfully.' }
}

// ─────────────────────────────────────────────────────
// AUTO REQUIREMENT GENERATION
// ─────────────────────────────────────────────────────
async function generateRequirements(programId: string, templateId: string, participants: number) {
  const { data: items } = await supabase
    .from('inv_template_items')
    .select(`*, inv_materials(current_rate, unit)`)
    .eq('template_id', templateId)

  if (!items || items.length === 0) return

  const requirements = items.map((item: any) => {
    const required_qty = Number(item.qty_per_person) * participants
    const rate = Number(item.inv_materials?.current_rate || 0)
    return {
      program_id: programId,
      material_id: item.material_id,
      required_qty,
      unit: item.unit,
      rate_at_time: rate,
      estimated_cost: required_qty * rate,
    }
  })

  await supabase.from('inv_program_requirements').insert(requirements)
}

export async function getProgramRequirements(programId: string) {
  const { data } = await supabase
    .from('inv_program_requirements')
    .select(`*, inv_materials(name, unit, current_rate, inv_material_groups(name))`)
    .eq('program_id', programId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function addRequirementItem(payload: {
  program_id: string
  material_id: string
  required_qty: number
  unit: string
  rate_at_time: number
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }

  const { error } = await supabase.from('inv_program_requirements').insert({
    ...payload,
    estimated_cost: payload.required_qty * payload.rate_at_time,
  })
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Requirement added successfully.' }
}

export async function deleteRequirementItem(id: string): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session) return { success: false, message: 'Unauthorized.' }
  const { error } = await supabase.from('inv_program_requirements').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Requirement deleted successfully.' }
}
