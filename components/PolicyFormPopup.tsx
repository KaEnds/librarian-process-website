"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/Toast"

interface Policy {
  policy_id: number;
  policy_code: string;
  description: string;
  prompt_instruction: string;
  is_active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: Policy | null;
  onSuccess: () => void;
}

export function PolicyFormPopup({ isOpen, onClose, initialData, onSuccess }: Props) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State ของ Form
  const [formData, setFormData] = useState({
    policy_code: "",
    description: "",
    prompt_instruction: "",
    is_active: true
  })

  // อัปเดตข้อมูลเมื่อเปิด Modal (เช็คว่าเป็นการเพิ่มหรือแก้ไข)
  useEffect(() => {
    if (initialData) {
      setFormData({
        policy_code: initialData.policy_code,
        description: initialData.description,
        prompt_instruction: initialData.prompt_instruction,
        is_active: initialData.is_active
      })
    } else {
      setFormData({ policy_code: "", description: "", prompt_instruction: "", is_active: true })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const isEdit = !!initialData
      const payload = isEdit
        ? {
            policyId: initialData.policy_id,
            policyCode: formData.policy_code,
            description: formData.description,
            promptInstruction: formData.prompt_instruction,
            isActive: formData.is_active,
          }
        : {
            policyCode: formData.policy_code,
            description: formData.description,
            promptInstruction: formData.prompt_instruction,
            isActive: formData.is_active,
          }

      const response = await fetch("/api/policies", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.message || "API Error")
      }

      showToast(isEdit ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มข้อมูลสำเร็จ", "success", 3000)
      onSuccess() // สั่งให้หน้าหลักดึงข้อมูลใหม่
      onClose()
    } catch (error) {
      console.error("Submit error:", error)
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error", 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-5xl overflow-hidden rounded-md border border-border bg-background" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">
            {initialData ? "แก้ไข Policy" : "เพิ่ม Policy ใหม่"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[78vh] overflow-y-auto bg-muted/30 p-4">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-border bg-background p-4">
            <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-foreground">Policy Code</label>
              <input 
                required
                type="text" 
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. POL-01"
                value={formData.policy_code}
                onChange={(e) => setFormData({...formData, policy_code: e.target.value})}
              />
            </div>
            
            <div className="col-span-1 flex items-end mb-1">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="ml-2 text-sm font-medium text-foreground">เปิดใช้งาน (Active)</span>
              </label>
            </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
              <textarea 
                required
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="คำอธิบายเกณฑ์การคัดเลือก..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Prompt Instruction</label>
              <textarea 
                required
                rows={4}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="คำสั่งสำหรับ AI..."
                value={formData.prompt_instruction}
                onChange={(e) => setFormData({...formData, prompt_instruction: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}