"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ManualQuoteEntryPayload = {
  title: string
  authors: string
  isbn_issn: string
  book_format: string
  unit_price: string
  quantity: string
  discount_type: string
  net_price: string
  currency: string
  platform: string
  availability: string
  estimated_delivery_day: string
  vendor_name: string
  contact_person: string
  vendor_email: string
  telephone_number: string
}

type ManualQuoteEntryPopupProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: ManualQuoteEntryPayload) => Promise<void> | void
}

const initialFormData: ManualQuoteEntryPayload = {
  title: "",
  authors: "",
  isbn_issn: "",
  book_format: "",
  unit_price: "",
  quantity: "",
  discount_type: "",
  net_price: "",
  currency: "THB",
  platform: "",
  availability: "available",
  estimated_delivery_day: "",
  vendor_name: "",
  contact_person: "",
  vendor_email: "",
  telephone_number: "",
}

const inputClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"

export function ManualQuoteEntryPopup({ open, onClose, onSubmit }: ManualQuoteEntryPopupProps) {
  const [formData, setFormData] = useState<ManualQuoteEntryPayload>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormData(initialFormData)
      setIsSubmitting(false)
    }
  }, [open])

  if (!open) {
    return null
  }

  const updateField = (field: keyof ManualQuoteEntryPayload, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-6xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">เพิ่มข้อมูลหนังสือเอง</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto bg-muted/30 p-4">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-border bg-background p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
                <input required type="text" value={formData.title} onChange={(event) => updateField("title", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Authors</label>
                <input required type="text" value={formData.authors} onChange={(event) => updateField("authors", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">ISBN / ISSN</label>
                <input type="text" value={formData.isbn_issn} onChange={(event) => updateField("isbn_issn", event.target.value)} className={inputClassName} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Book Format</label>
                <input type="text" value={formData.book_format} onChange={(event) => updateField("book_format", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Unit Price</label>
                <input required type="number" min="0" step="0.01" value={formData.unit_price} onChange={(event) => updateField("unit_price", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Quantity</label>
                <input required type="number" min="1" step="1" value={formData.quantity} onChange={(event) => updateField("quantity", event.target.value)} className={inputClassName} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Discount Type</label>
                <input type="text" value={formData.discount_type} onChange={(event) => updateField("discount_type", event.target.value)} className={inputClassName} placeholder="เช่น fixed, percent" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Net Price</label>
                <input required type="number" min="0" step="0.01" value={formData.net_price} onChange={(event) => updateField("net_price", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Currency</label>
                <input required type="text" value={formData.currency} onChange={(event) => updateField("currency", event.target.value)} className={inputClassName} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Platform</label>
                <input type="text" value={formData.platform} onChange={(event) => updateField("platform", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Availability</label>
                <select value={formData.availability} onChange={(event) => updateField("availability", event.target.value)} className={inputClassName}>
                  <option value="available">available</option>
                  <option value="unavailable">unavailable</option>
                  <option value="preorder">preorder</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Estimated Delivery Day</label>
                <input type="number" min="0" step="1" value={formData.estimated_delivery_day} onChange={(event) => updateField("estimated_delivery_day", event.target.value)} className={inputClassName} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Vendor Name</label>
                <input required type="text" value={formData.vendor_name} onChange={(event) => updateField("vendor_name", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Contact Person</label>
                <input type="text" value={formData.contact_person} onChange={(event) => updateField("contact_person", event.target.value)} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Vendor Email</label>
                <input type="email" value={formData.vendor_email} onChange={(event) => updateField("vendor_email", event.target.value)} className={inputClassName} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Telephone Number</label>
              <input type="text" value={formData.telephone_number} onChange={(event) => updateField("telephone_number", event.target.value)} className={inputClassName} />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : "เพิ่มข้อมูล"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}