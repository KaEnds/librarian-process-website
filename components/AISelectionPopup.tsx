"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowDown, X } from "lucide-react"

export type AISelectionDecision = "the-best" | "optional"

export type AISelectionVendorComparison = {
  id: number
  vendor: string
  price: string
  delivery: string
  publisher: string
  aiDecision: AISelectionDecision
  aiReason: string
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

export function AISelectionPopup({ open, data, onClose, onSave }: AISelectionPopupProps) {
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
        className="w-full max-w-5xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">เปรียบเทียบใบเสนอราคา {data.title}</h2>
          <button type="button" onClick={onClose} className="text-red-400 hover:text-red-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto bg-muted/30">
          <table className="w-full bg-background text-sm">
            <thead className="border-b border-border bg-muted/20 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Vendor
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Price
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    ระยะเวลาจัดส่ง
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1">
                    Publisher
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
              </tr>
            </thead>
            <tbody>
              {data.comparisonRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-gray-600">{row.id}</td>
                  <td className="px-4 py-3 font-semibold">{row.vendor}</td>
                  <td className="px-4 py-3 text-gray-600">{row.price}</td>
                  <td className="px-4 py-3 text-gray-600">{row.delivery}</td>
                  <td className="px-4 py-3 text-gray-600">{row.publisher}</td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={row.aiDecision} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.aiReason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-border bg-muted/20 px-4 py-3 text-sm font-semibold">เลือกใบเสนอราคารายงบ (บรรณารักษ์)</div>

          <div className="relative max-h-56 overflow-y-auto">
            <table className="w-full bg-background text-sm">
              <thead className="sticky top-0 z-30 border-b border-border bg-muted/20 text-left text-muted-foreground">
                <tr>
                  <th className="bg-muted/20 px-4 py-3 font-medium">No.</th>
                  <th className="bg-muted/20 px-4 py-3 font-medium">
                    <div className="flex items-center gap-1">
                      Vendor
                      <ArrowDown className="h-3.5 w-3.5" />
                    </div>
                  </th>
                  <th className="bg-muted/20 px-4 py-3 text-right font-medium">
                    <div className="inline-flex items-center gap-1">
                      เลือกร้านค้าเอง
                      <ArrowDown className="h-3.5 w-3.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.comparisonRows.map((row) => (
                  <tr key={`choose-${row.id}`} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-gray-600">{row.id}</td>
                    <td className="px-4 py-3 font-semibold">{row.vendor}</td>
                    <td className="px-4 py-3 text-right">
                      <Checkbox
                        checked={selectedVendor === row.vendor}
                        onCheckedChange={(value) => {
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
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-border bg-background px-5 py-3">
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!selectedVendor}
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
