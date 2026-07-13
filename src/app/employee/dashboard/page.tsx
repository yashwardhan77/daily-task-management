import React from 'react'
import { redirect } from 'next/navigation'
import { getEmployeeSession, getEmployeeLogsAction } from '@/lib/actions/tasks'
import EmployeeDashboardClient from '@/components/employee-dashboard-client'

export const revalidate = 0 // always fetch live logs

export default async function EmployeeDashboardPage() {
  const employee = await getEmployeeSession()
  
  if (!employee) {
    redirect('/employee/login')
  }

  const logsRes = await getEmployeeLogsAction()
  const initialLogs = logsRes.success ? logsRes.data : []

  return (
    <EmployeeDashboardClient 
      employee={employee} 
      initialLogs={initialLogs} 
    />
  )
}
