import { getProgramById } from '@/lib/actions/inventory/programs'
import { getMaterials, getMaterialGroups, getAllCurrentStock } from '@/lib/actions/inventory/materials'
import { getMaterialIssues } from '@/lib/actions/inventory/stock'
import { notFound } from 'next/navigation'
import IssueClient from './issue-client'

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [program, materials, groups, stockMap, issues] = await Promise.all([
    getProgramById(id), getMaterials({ activeOnly: true }), getMaterialGroups(), getAllCurrentStock(), getMaterialIssues({ programId: id }),
  ])
  if (!program) notFound()
  return <IssueClient program={program} materials={materials} groups={groups} stockMap={stockMap} initialIssues={issues} />
}
