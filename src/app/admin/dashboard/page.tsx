import React from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession, getAdminLogsAction, getAllHistoricalLogsAction } from '@/lib/actions/tasks'
import AdminDashboardClient from '@/components/admin-dashboard-client'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export const revalidate = 0 // always fetch live logs

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    redirect('/admin/login')
  }

  const resolvedParams = await searchParams
  const dateFilter = resolvedParams.date || new Date().toISOString().split('T')[0]

  const logsRes = await getAdminLogsAction(dateFilter)
  const initialLogs = logsRes.success ? logsRes.logs : []
  const initialStats = logsRes.success ? logsRes.employeeStats : { total: 15, present: 0, halfday: 0, holiday: 0, pending: 15 }

  const historyLogs = await getAllHistoricalLogsAction()

  return (
    <AdminDashboardClient
      initialDate={dateFilter}
      initialLogs={initialLogs}
      initialStats={initialStats}
      historyLogs={historyLogs}
    />
  )
}
