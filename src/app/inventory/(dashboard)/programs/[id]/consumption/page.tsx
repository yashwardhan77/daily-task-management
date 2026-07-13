import { getProgramById } from '@/lib/actions/inventory/programs'
import { getMaterials, getMaterialGroups } from '@/lib/actions/inventory/materials'
import { getConsumptionEntries } from '@/lib/actions/inventory/stock'
import { notFound } from 'next/navigation'
import ConsumptionClient from './consumption-client'

export default async function ConsumptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, materials, groups, entries] = await Promise.all([
    getProgramById(id), getMaterials({ activeOnly: true }), getMaterialGroups(), getConsumptionEntries({ programId: id }),
  ])
  if (!program) notFound()
  return <ConsumptionClient program={program} materials={materials} groups={groups} initialEntries={entries} />
}
