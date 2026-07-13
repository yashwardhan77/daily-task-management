import { getMaterialGroups } from '@/lib/actions/inventory/materials'
import GroupsClient from './groups-client'

export default async function GroupsPage() {
  const groups = await getMaterialGroups()
  return <GroupsClient initialGroups={groups} />
}
