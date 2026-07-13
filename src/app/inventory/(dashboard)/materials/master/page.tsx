import { getMaterialGroups, getMaterials } from '@/lib/actions/inventory/materials'
import MasterClient from './master-client'

export default async function MasterPage() {
  const [groups, materials] = await Promise.all([getMaterialGroups(), getMaterials()])
  return <MasterClient initialGroups={groups} initialMaterials={materials} />
}
