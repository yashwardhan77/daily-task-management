'use server'

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { TaskLog, Employee } from './mockDb'

// Admin Credentials (fixed for admin portal log in)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'adminpassword123',
  name: 'Prabandhak (Manager)'
}

/**
 * Get current employee session
 */
export async function getEmployeeSession(): Promise<Employee | null> {
  const cookieStore = await cookies()
  const empId = cookieStore.get('vb-employee-session')?.value
  if (!empId) return null
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', empId)
    .single()
    
  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    passwordHash: data.password
  }
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('vb-admin-session')?.value === 'true'
}

/**
 * Employee Login Server Action
 */
export async function employeeLoginAction(id: string, passwordHash: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id.toUpperCase())
    .maybeSingle()
    
  if (error || !data) {
    return { success: false, message: 'Invalid Employee ID.' }
  }
  if (data.password !== passwordHash) {
    return { success: false, message: 'Incorrect password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('vb-employee-session', data.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  })

  return { success: true, message: 'Login successful!' }
}

/**
 * Admin Login Server Action
 */
export async function adminLoginAction(username: string, passwordHash: string): Promise<{ success: boolean; message: string }> {
  if (
    username.toLowerCase() !== ADMIN_CREDENTIALS.username.toLowerCase() ||
    passwordHash !== ADMIN_CREDENTIALS.password
  ) {
    return { success: false, message: 'Invalid Admin username or password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('vb-admin-session', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  })

  return { success: true, message: 'Admin login successful!' }
}

/**
 * Log out Action
 */
export async function logoutAction(type: 'employee' | 'admin'): Promise<{ success: boolean }> {
  const cookieStore = await cookies()
  if (type === 'employee') {
    cookieStore.delete('vb-employee-session')
  } else {
    cookieStore.delete('vb-admin-session')
  }
  return { success: true }
}

/**
 * Submit task log
 */
export async function submitTaskAction(
  date: string,
  status: 'Full Day' | 'Half Day' | 'Holiday',
  description: string,
  hours: number,
  descriptionBefore?: string,
  descriptionAfter?: string,
  hoursBefore?: number,
  hoursAfter?: number
): Promise<{ success: boolean; message: string }> {
  const emp = await getEmployeeSession()
  if (!emp) {
    return { success: false, message: 'Unauthorized session. Please login again.' }
  }

  if (!date) {
    return { success: false, message: 'Please select a date.' }
  }

  // Convert current server time to Indian Standard Time (IST - UTC+5:30)
  const now = new Date()
  const utcOffset = now.getTimezoneOffset() * 60000
  const istTime = new Date(now.getTime() + utcOffset + (3600000 * 5.5))
  
  // Format today's date in IST as YYYY-MM-DD
  const todayIstStr = istTime.toISOString().split('T')[0]
  
  // Enforce that submissions/edits are only allowed for today's date
  if (date !== todayIstStr) {
    return { success: false, message: "You can only submit or edit task logs for today's date (" + todayIstStr + ")." }
  }

  // Enforce the 6:00 PM (18:00) deadline
  const hoursIst = istTime.getHours()
  if (hoursIst >= 18) {
    return { success: false, message: 'Task submission and editing closed at 6:00 PM IST.' }
  }

  // Check if log already exists in Supabase
  const { data: existing } = await supabase
    .from('task_logs')
    .select('id')
    .eq('employee_id', emp.id)
    .eq('date', date)
    .maybeSingle()

  const logId = existing?.id || `task-${emp.id}-${date}-${Date.now()}`

  const logPayload = {
    id: logId,
    employee_id: emp.id,
    employee_name: emp.name,
    employee_role: emp.role,
    date,
    status,
    description: description || (status === 'Holiday' ? 'On Holiday / Leave' : 'Completed scheduled tasks'),
    hours: status === 'Holiday' ? 0 : hours,
    description_before: descriptionBefore || null,
    description_after: descriptionAfter || null,
    hours_before: status === 'Holiday' ? 0 : (hoursBefore ?? null),
    hours_after: status === 'Holiday' ? 0 : (hoursAfter ?? null),
    submitted_at: new Date().toISOString()
  }

  const { error: upsertError } = await supabase
    .from('task_logs')
    .upsert(logPayload)

  if (upsertError) {
    console.error('Supabase task log error:', upsertError)
    return { success: false, message: 'Failed to write task to database.' }
  }

  return { success: true, message: 'Task logged successfully!' }
}

/**
 * Fetch logs for current logged-in employee
 */
export async function getEmployeeLogsAction(): Promise<{ success: boolean; data: TaskLog[] }> {
  const emp = await getEmployeeSession()
  if (!emp) {
    return { success: false, data: [] }
  }

  const { data, error } = await supabase
    .from('task_logs')
    .select('*')
    .eq('employee_id', emp.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching employee task logs:', error)
    return { success: false, data: [] }
  }

  // Map to frontend interface format
  const logs = data.map((t) => ({
    id: t.id,
    employeeId: t.employee_id,
    date: t.date,
    status: t.status,
    description: t.description,
    descriptionBefore: t.description_before || undefined,
    descriptionAfter: t.description_after || undefined,
    hours: Number(t.hours),
    hoursBefore: t.hours_before ? Number(t.hours_before) : undefined,
    hoursAfter: t.hours_after ? Number(t.hours_after) : undefined,
    submittedAt: t.submitted_at
  }))

  return { success: true, data: logs }
}

/**
 * Fetch all task logs for Admin Overview
 */
export async function getAdminLogsAction(dateFilter?: string): Promise<{
  success: boolean
  date: string
  logs: (TaskLog & { employeeName: string; employeeRole: string })[]
  employeeStats: {
    total: number
    present: number
    halfday: number
    holiday: number
    pending: number
  }
}> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return { 
      success: false, 
      date: dateFilter || '', 
      logs: [], 
      employeeStats: { total: 0, present: 0, halfday: 0, holiday: 0, pending: 0 } 
    }
  }

  const targetDate = dateFilter || new Date().toISOString().split('T')[0]

  // Get all employees
  const { data: dbEmployees, error: empError } = await supabase
    .from('employees')
    .select('*')
    .order('id', { ascending: true })

  if (empError || !dbEmployees) {
    console.error('Error fetching employees:', empError)
    return { 
      success: false, 
      date: targetDate, 
      logs: [], 
      employeeStats: { total: 0, present: 0, halfday: 0, holiday: 0, pending: 0 } 
    }
  }

  // Get all task logs for targetDate
  const { data: dbLogs, error: logsError } = await supabase
    .from('task_logs')
    .select('*')
    .eq('date', targetDate)

  if (logsError || !dbLogs) {
    console.error('Error fetching task logs for date:', logsError)
    return { 
      success: false, 
      date: targetDate, 
      logs: [], 
      employeeStats: { total: 0, present: 0, halfday: 0, holiday: 0, pending: 0 } 
    }
  }

  let present = 0
  let halfday = 0
  let holiday = 0
  let pending = 0

  const logs = dbEmployees.map((emp) => {
    const task = dbLogs.find((t) => t.employee_id === emp.id)
    
    if (task) {
      if (task.status === 'Full Day') present++
      else if (task.status === 'Half Day') halfday++
      else if (task.status === 'Holiday') holiday++
      
      return {
        id: task.id,
        employeeId: task.employee_id,
        date: task.date,
        status: task.status as 'Full Day' | 'Half Day' | 'Holiday' | 'Pending',
        description: task.description,
        descriptionBefore: task.description_before || undefined,
        descriptionAfter: task.description_after || undefined,
        hours: Number(task.hours),
        hoursBefore: task.hours_before ? Number(task.hours_before) : undefined,
        hoursAfter: task.hours_after ? Number(task.hours_after) : undefined,
        submittedAt: task.submitted_at,
        employeeName: emp.name,
        employeeRole: emp.role,
      }
    } else {
      pending++
      return {
        id: `pending-${emp.id}-${targetDate}`,
        employeeId: emp.id,
        date: targetDate,
        status: 'Pending' as const,
        description: 'Task log not submitted yet.',
        hours: 0,
        submittedAt: '',
        employeeName: emp.name,
        employeeRole: emp.role,
      }
    }
  })

  return {
    success: true,
    date: targetDate,
    logs,
    employeeStats: {
      total: dbEmployees.length,
      present,
      halfday,
      holiday,
      pending
    }
  }
}

/**
 * Admin download all logs history
 */
export async function getAllHistoricalLogsAction(): Promise<
  (TaskLog & { employeeName: string; employeeRole: string })[]
> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return []

  const { data: dbLogs, error: logsError } = await supabase
    .from('task_logs')
    .select('*')
    .order('date', { ascending: false })

  if (logsError || !dbLogs) {
    console.error('Error fetching all task logs:', logsError)
    return []
  }

  // Get all employees for mapping name/role
  const { data: dbEmployees } = await supabase.from('employees').select('*')

  return dbLogs.map((t) => {
    const emp = dbEmployees?.find((e) => e.id === t.employee_id)
    return {
      id: t.id,
      employeeId: t.employee_id,
      date: t.date,
      status: t.status as 'Full Day' | 'Half Day' | 'Holiday' | 'Pending',
      description: t.description,
      descriptionBefore: t.description_before || undefined,
      descriptionAfter: t.description_after || undefined,
      hours: Number(t.hours),
      hoursBefore: t.hours_before ? Number(t.hours_before) : undefined,
      hoursAfter: t.hours_after ? Number(t.hours_after) : undefined,
      submittedAt: t.submitted_at,
      employeeName: emp ? emp.name : t.employee_name || 'Unknown',
      employeeRole: emp ? emp.role : t.employee_role || 'Unknown'
    }
  })
}

/**
 * Admin Action to register/add new employee
 */
export async function addEmployeeAction(
  id: string,
  name: string,
  passwordHash: string,
  role: string
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return { success: false, message: 'Unauthorized access.' }
  }

  if (!id || !name || !passwordHash || !role) {
    return { success: false, message: 'All fields are required.' }
  }

  // Check if employee ID already exists
  const { data: existing } = await supabase
    .from('employees')
    .select('id')
    .eq('id', id.toUpperCase())
    .maybeSingle()

  if (existing) {
    return { success: false, message: `Employee with ID ${id.toUpperCase()} already exists.` }
  }

  // Insert into Supabase
  const { error } = await supabase
    .from('employees')
    .insert({
      id: id.toUpperCase(),
      name,
      password: passwordHash,
      role
    })

  if (error) {
    console.error('Error adding employee:', error)
    return { success: false, message: 'Failed to add employee to the database.' }
  }

  return { success: true, message: 'Employee added successfully!' }
}

/**
 * Admin Action to fetch all employees
 */
export async function getEmployeesAction(): Promise<{
  success: boolean
  employees: { id: string; name: string; role: string; password: string }[]
}> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return { success: false, employees: [] }

  const { data, error } = await supabase
    .from('employees')
    .select('id, name, role, password')
    .order('id', { ascending: true })

  if (error || !data) {
    console.error('Error fetching employees:', error)
    return { success: false, employees: [] }
  }

  return { success: true, employees: data }
}

/**
 * Admin Action to edit an existing employee
 */
export async function editEmployeeAction(
  id: string,
  name: string,
  passwordHash: string,
  role: string
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return { success: false, message: 'Unauthorized access.' }
  }

  if (!id || !name || !passwordHash || !role) {
    return { success: false, message: 'All fields are required.' }
  }

  const { error } = await supabase
    .from('employees')
    .update({ name, password: passwordHash, role })
    .eq('id', id.toUpperCase())

  if (error) {
    console.error('Error editing employee:', error)
    return { success: false, message: 'Failed to update employee.' }
  }

  return { success: true, message: `Employee ${id} updated successfully!` }
}

/**
 * Admin Action to delete an employee
 */
export async function deleteEmployeeAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return { success: false, message: 'Unauthorized access.' }
  }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id.toUpperCase())

  if (error) {
    console.error('Error deleting employee:', error)
    return { success: false, message: 'Failed to delete employee.' }
  }

  return { success: true, message: `Employee ${id} deleted successfully!` }
}

/**
 * Get geo-restriction settings (readable by employee & admin)
 */
export async function getGeoSettingsAction(): Promise<{
  enabled: boolean
  lat: number
  lng: number
  radiusMeters: number
}> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error || !data) return { enabled: false, lat: 0, lng: 0, radiusMeters: 50 }

    const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
    return {
      enabled: map['geo_restriction_enabled'] === 'true',
      lat: parseFloat(map['office_lat'] || '0'),
      lng: parseFloat(map['office_lng'] || '0'),
      radiusMeters: parseInt(map['geo_radius_meters'] || '50', 10)
    }
  } catch {
    return { enabled: false, lat: 0, lng: 0, radiusMeters: 50 }
  }
}

/**
 * Update a single app setting (admin only)
 */
export async function updateSettingAction(
  key: string,
  value: string
): Promise<{ success: boolean; message: string }> {
  const isAdmin = await getAdminSession()
  if (!isAdmin) return { success: false, message: 'Unauthorized.' }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value })

  if (error) {
    console.error('Error updating setting:', error)
    return { success: false, message: 'Failed to update setting.' }
  }

  return { success: true, message: 'Setting updated successfully.' }
}

