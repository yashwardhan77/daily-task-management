import { getStockReport } from '@/lib/actions/inventory/reports'
import { getMaterialGroups } from '@/lib/actions/inventory/materials'
import StockReportClient from './stock-report-client'

export default async function StockReportPage() {
  const [report, groups] = await Promise.all([getStockReport(), getMaterialGroups()])
  return <StockReportClient initialReport={report} groups={groups} />
}
