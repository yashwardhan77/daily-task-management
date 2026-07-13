import { getInvUsers } from '@/lib/actions/inventory/auth'
import { getInventorySession } from '@/lib/actions/inventory/auth'
import { redirect } from 'next/navigation'
import UsersClient from './users-client'

export default async function UsersPage() {
  const session = await getInventorySession()
  if (!session?.isAdmin) redirect('/inventory/dashboard')
  const { data: users } = await getInvUsers()
  return <UsersClient initialUsers={users} />
}
