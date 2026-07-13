import { getProgramById, getProgramRequirements } from '@/lib/actions/inventory/programs'
import { getMaterials } from '@/lib/actions/inventory/materials'
import { notFound } from 'next/navigation'
import RequirementsClient from './requirements-client'

export default async function RequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, requirements, materials] = await Promise.all([
    getProgramById(id), getProgramRequirements(id), getMaterials({ activeOnly: true }),
  ])
  if (!program) notFound()
  return <RequirementsClient program={program} requirements={requirements} materials={materials} />
}
