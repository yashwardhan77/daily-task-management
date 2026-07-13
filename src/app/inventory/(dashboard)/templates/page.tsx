import { getTemplates } from '@/lib/actions/inventory/programs'
import { getMaterials, getMaterialGroups } from '@/lib/actions/inventory/materials'
import TemplatesClient from './templates-client'

export default async function TemplatesPage() {
  const [templates, materials, groups] = await Promise.all([getTemplates(), getMaterials({ activeOnly: true }), getMaterialGroups()])
  return <TemplatesClient initialTemplates={templates} materials={materials} groups={groups} />
}
