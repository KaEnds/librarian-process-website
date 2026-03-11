"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowDown, X } from "lucide-react"

export type AISelectionDecision = "the-best" | "optional"

export type AISelectionVendorComparison = {
  id: number
  quoteId: number
  quoteIds: number[]  // All quote IDs for this vendor (for duplicates)
  vendor: string
  unitPrice: string
  discountValue: string
  netPrice: string
  quantity: string
  delivery: string
  aiDecision: AISelectionDecision
  aiReason: string
  reviewStatus?: string
}

export type AISelectionPopupData = {
  quoteId: number
  title: string
  comparisonRows: AISelectionVendorComparison[]
  selectedVendor: string | null
}

type AISelectionPopupProps = {
  open: boolean
  data: AISelectionPopupData | null
  onClose: () => void
  onSave: (quoteId: number, vendor: string) => void
  isReadOnly?: boolean
}

const DecisionBadge = ({ decision }: { decision: AISelectionDecision }) => {
  if (decision === "the-best") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        The Best
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
      Optional
    </span>
  )
}

const parseAmount = (value: string): number | null => {
  const sanitized = value.replace(/[^\d.]/g, "")
  if (!sanitized) return null
  const parsed = Number.parseFloat(sanitized)
  return Number.isNaN(parsed) ? null : parsed
}

const formatAmount = (value: number): string => `${value.toFixed(2)} บาท`

const getDisplayNetPrice = (row: AISelectionVendorComparison): string => {
  const unit = parseAmount(row.unitPrice)
  const discount = parseAmount(row.discountValue)
  const net = parseAmount(row.netPrice)

  if (unit === null) return row.netPrice
  if (discount === null || discount <= 0) return row.netPrice

  // Fallback for data where net price was not reduced after discount.
  if (net !== null && Math.abs(unit - net) < 0.0001) {
    const adjusted = Math.max(unit - discount, 0)
    return formatAmount(adjusted)
  }

  return row.netPrice
}

export function AISelectionPopup({ open, data, onClose, onSave, isReadOnly = false }: AISelectionPopupProps) {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !data) {
      return
    }

    setSelectedVendor(data.selectedVendor ?? data.comparisonRows[0]?.vendor ?? null)
  }, [open, data])

  if (!open || !data) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-screen-2xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">เปรียบเทียบใบเสนอราคา {data.title}</h2>
          <button type="button" onClick={onClose} className="text-red-400 hover:text-red-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto bg-muted/30">
          <table className="w-full table-fixed bg-background text-sm">
            <thead className="border-b border-border bg-muted/20 text-left text-muted-foreground">
              <tr>
                <th className="w-16 px-4 py-3 font-medium">No.</th>
                <th className="w-[24%] px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Vendor
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Unit Price
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Discount
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Net Price
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Quantity
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    ระยะเวลาจัดส่ง
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">การคัดโดย AI</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    AI Reason
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="w-32 px-4 py-3 text-center font-medium whitespace-nowrap">บรรณารักษ์เลือก</th>
              </tr>
            </thead>
            <tbody>
              {data.comparisonRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-gray-600">{row.id}</td>
                  <td className="px-4 py-3 font-semibold truncate" title={row.vendor}>{row.vendor}</td>
                  <td className="px-4 py-3 text-gray-600">{row.unitPrice}</td>
                  <td className="px-4 py-3 text-gray-600">{row.discountValue}</td>
                  <td className="px-4 py-3 text-gray-600">{getDisplayNetPrice(row)}</td>
                  <td className="px-4 py-3 text-gray-600">{row.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{row.delivery}</td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={row.aiDecision} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.aiReason}</td>
                  <td className="px-4 py-3 text-center">
                    <Checkbox
                      checked={selectedVendor === row.vendor}
                      disabled={isReadOnly}
                      onCheckedChange={(value) => {
                        if (isReadOnly) {
                          return
                        }
                        if (value) {
                          setSelectedVendor(row.vendor)
                        }
                      }}
                      aria-label={`Select ${row.vendor}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-border bg-background px-5 py-3">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isReadOnly || !selectedVendor}
            onClick={() => {
              if (!selectedVendor) {
                return
              }
              onSave(data.quoteId, selectedVendor)
            }}
          >
            บันทึก
          </Button>
        </div>
      </div>
    </div>
  )
}
