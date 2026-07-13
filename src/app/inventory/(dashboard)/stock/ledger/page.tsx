import { getStockLedger } from '@/lib/actions/inventory/stock'
import { getMaterials, getMaterialGroups } from '@/lib/actions/inventory/materials'
import StockLedgerClient from './ledger-client'

export default async function LedgerPage() {
  const [ledger, materials, groups] = await Promise.all([getStockLedger(), getMaterials({ activeOnly: true }), getMaterialGroups()])
  return <StockLedgerClient initialLedger={ledger} materials={materials} groups={groups} />
}
