"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type PurchaseNoteItem = {
  id: number
  title: string
  quantity: number
  unit: string
  unit_price: string
  total_price: string
  vendor_name: string
}

type PurchaseNotePopupProps = {
  open: boolean
  items: PurchaseNoteItem[]
  note: string
  onNoteChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}

const toNumber = (value: string): number => {
  const parsed = parseFloat((value ?? "0").toString().replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

export function PurchaseNotePopup({
  open,
  items,
  note,
  onNoteChange,
  onClose,
  onSave,
}: PurchaseNotePopupProps) {
  if (!open) {
    return null
  }

  const totalAmount = items.reduce((sum, item) => sum + toNumber(item.total_price), 0)
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-6xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">เพิ่มหมายเหตุการจัดซื้อ</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-muted/30 p-4">
          <div className="rounded-md border border-border bg-background p-4">
            <label className="mb-2 block text-sm font-semibold">หมายเหตุ</label>
            <textarea
              rows={6}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เขียนหมายเหตุการจัดซื้อ (ถ้ามี)"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onSave}>
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
