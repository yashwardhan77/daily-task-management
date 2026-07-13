import { redirect } from 'next/navigation'
import { getInventorySession } from '@/lib/actions/inventory/auth'
import InvLayoutClient from '@/components/inventory/inv-layout-client'

export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  const user = await getInventorySession()
  if (!user) {
    redirect('/inventory/login')
  }

  return <InvLayoutClient user={user}>{children}</InvLayoutClient>
}
