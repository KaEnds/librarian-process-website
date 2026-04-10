"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle2, XCircle } from "lucide-react"

export type PopupItem = {
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
  items: PopupItem[]
  note: string
  onNoteChange: (val: string) => void
  onClose: () => void
  onSave?: () => void
  isDirector: boolean
  onApprove: (rejectedItemIds: number[]) => void
  onReject: () => void
}

export function PurchaseNotePopup({
  open,
  items,
  note,
  onNoteChange,
  onClose,
  onSave,
  isDirector,
  onApprove,
  onReject,
}: PurchaseNotePopupProps) {
  // สร้าง State สำหรับเก็บ ID ของหนังสือที่ถูก "ยกเลิก"
  const [rejectedItemIds, setRejectedItemIds] = useState<number[]>([])

  // Reset ค่าเมื่อเปิด Popup ใหม่
  useEffect(() => {
    if (open) {
      setRejectedItemIds([])
    }
  }, [open])

  if (!open) return null

  const toggleItemRejection = (id: number) => {
    setRejectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  // คำนวณยอดเงินรวมใหม่ (หักรายการที่ถูกยกเลิกออก)
  const activeItems = items.filter(item => !rejectedItemIds.includes(item.id))
  const totalActivePrice = activeItems.reduce((sum, item) => {
    const price = parseFloat(item.total_price.replace(/,/g, '')) || 0
    return sum + price
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isDirector ? "พิจารณาอนุมัติการจัดซื้อ" : "จัดการหมายเหตุการจัดซื้อ"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {/* Item List (Director Review) */}
          <div className="mb-6 bg-white rounded-lg border shadow-sm">
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
              <span className="font-semibold text-gray-700">รายการพิจารณา ({items.length} รายการ)</span>
              <span className="text-sm text-gray-500">ยกเลิกแล้ว {rejectedItemIds.length} รายการ</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
              {items.map((item, index) => {
                const isRejected = rejectedItemIds.includes(item.id)
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      isRejected ? 'bg-red-50 border-red-200 opacity-70' : 'bg-white border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isRejected ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                        {index + 1}. {item.title}
                      </p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>จำนวน: {item.quantity} {item.unit}</span>
                        <span>ร้านค้า: {item.vendor_name}</span>
                        <span className="font-semibold">ราคา: {item.total_price} ฿</span>
                      </div>
                    </div>
                    
                    {/* Toggle Button for Director */}
                    {isDirector && (
                      <div className="ml-4 flex gap-2">
                        {isRejected ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => toggleItemRejection(item.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> คืนสถานะ
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => toggleItemRejection(item.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> ไม่อนุมัติเล่มนี้
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Note Section */}
          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              หมายเหตุ / ความคิดเห็นเพิ่มเติม
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              placeholder="ระบุเหตุผลหากมีการไม่อนุมัติบางรายการ หรือหมายเหตุอื่นๆ..."
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-white px-6 py-4 flex items-center justify-between rounded-b-xl">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">ยอดอนุมัติสุทธิ</span>
            <span className="text-xl font-bold text-blue-600">
              {totalActivePrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            
            {isDirector ? (
              <>
                <Button 
                  variant="destructive" 
                  onClick={onReject}
                >
                  ไม่อนุมัติทั้งชุด
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => onApprove(rejectedItemIds)} // ส่ง ID ที่ถูกตีตกกลับไป
                >
                  อนุมัติ ({activeItems.length} รายการ)
                </Button>
              </>
            ) : (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={onSave}
              >
                บันทึกหมายเหตุ
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}