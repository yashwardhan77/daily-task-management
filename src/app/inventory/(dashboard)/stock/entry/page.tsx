import { getMaterials, getMaterialGroups, getAllCurrentStock } from '@/lib/actions/inventory/materials'
import { getStockEntries } from '@/lib/actions/inventory/stock'
import StockEntryClient from './stock-entry-client'

export default async function StockEntryPage() {
  const [materials, groups, entries, stockMap] = await Promise.all([
    getMaterials({ activeOnly: true }), getMaterialGroups(), getStockEntries(), getAllCurrentStock(),
  ])
  return <StockEntryClient materials={materials} groups={groups} initialEntries={entries} stockMap={stockMap} />
}
