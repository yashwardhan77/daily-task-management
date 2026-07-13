import { getTemplates } from '@/lib/actions/inventory/programs'
import { getMaterials } from '@/lib/actions/inventory/materials'
import NewProgramClient from './new-program-client'

export default async function NewProgramPage() {
  const [templates, materials] = await Promise.all([getTemplates(), getMaterials({ activeOnly: true })])
  return <NewProgramClient templates={templates} materials={materials} />
}
