'use server'

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export interface InvUser {
  id: string
  name: string
  username: string
  role: 'inventory_manager' | 'viewer'
  isAdmin: boolean
}

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'adminpassword123',
  name: 'Admin Manager',
}

export async function getInventorySession(): Promise<InvUser | null> {
  const cookieStore = await cookies()

  // Admin session grants full inventory access
  const adminSession = cookieStore.get('vb-admin-session')?.value
  if (adminSession === 'true') {
    return { id: 'admin', name: ADMIN_CREDENTIALS.name, username: 'admin', role: 'inventory_manager', isAdmin: true }
  }

  // Inventory manager session
  const invSession = cookieStore.get('inv-session')?.value
  if (!invSession) return null

  const { data, error } = await supabase
    .from('inv_users')
    .select('id, name, username, role')
    .eq('id', invSession)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return { ...data, isAdmin: false } as InvUser
}

export async function inventoryLoginAction(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; isAdmin?: boolean }> {
  if (!username || !password) {
    return { success: false, message: 'Username and password are required.' }
  }

  // Check admin
  if (
    username.toLowerCase() === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    const cookieStore = await cookies()
    cookieStore.set('vb-admin-session', 'true', {
      path: '/', maxAge: 60 * 60 * 24 * 7, httpOnly: true,
    })
    return { success: true, message: 'Admin login successful!', isAdmin: true }
  }

  // Check inventory users
  const { data, error } = await supabase
    .from('inv_users')
    .select('*')
    .eq('username', username.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) {
    return { success: false, message: 'Invalid username or password.' }
  }
  if (data.password_plain !== password) {
    return { success: false, message: 'Invalid username or password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('inv-session', data.id, {
    path: '/', maxAge: 60 * 60 * 24 * 7, httpOnly: true,
  })
  return { success: true, message: 'Login successful!', isAdmin: false }
}

export async function inventoryLogoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('inv-session')
}

// User Management (Admin only)
export async function getInvUsers(): Promise<{ success: boolean; data: any[] }> {
  const session = await getInventorySession()
  if (!session?.isAdmin) return { success: false, data: [] }

  const { data, error } = await supabase
    .from('inv_users')
    .select('id, name, username, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return { success: false, data: [] }
  return { success: true, data: data || [] }
}

export async function saveInvUser(payload: {
  id?: string
  name: string
  username: string
  password_plain: string
  role: string
}): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session?.isAdmin) return { success: false, message: 'Permission denied.' }

  if (!payload.name || !payload.username || !payload.password_plain) {
    return { success: false, message: 'Please fill in all required fields.' }
  }

  if (payload.id) {
    const updateData: any = {
      name: payload.name,
      username: payload.username.toLowerCase().trim(),
      role: payload.role,
    }
    if (payload.password_plain) updateData.password_plain = payload.password_plain

    const { error } = await supabase.from('inv_users').update(updateData).eq('id', payload.id)
    if (error) return { success: false, message: 'Update failed: ' + error.message }
    return { success: true, message: 'User updated successfully.' }
  } else {
    const { error } = await supabase.from('inv_users').insert({
      name: payload.name,
      username: payload.username.toLowerCase().trim(),
      password_plain: payload.password_plain,
      role: payload.role,
    })
    if (error) return { success: false, message: 'Failed to add user: ' + error.message }
    return { success: true, message: 'User added successfully.' }
  }
}

export async function toggleInvUserStatus(id: string, is_active: boolean): Promise<{ success: boolean; message: string }> {
  const session = await getInventorySession()
  if (!session?.isAdmin) return { success: false, message: 'Permission denied.' }

  const { error } = await supabase.from('inv_users').update({ is_active }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true, message: is_active ? 'User activated successfully.' : 'User deactivated successfully.' }
}
