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
      const url = isEdit ? `/api/update-policy/${initialData.policy_id}` : `/api/create-policy`
      const method = isEdit ? "PUT" : "POST"

      // Mock API Call - นำไปเปลี่ยนเป็นของจริง
      /*
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (!response.ok) throw new Error("API Error")
      */

      // จำลองการโหลด
      await new Promise(resolve => setTimeout(resolve, 500))

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {initialData ? "แก้ไข Policy" : "เพิ่ม Policy ใหม่"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Code</label>
              <input 
                required
                type="text" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. POL-01"
                value={formData.policy_code}
                onChange={(e) => setFormData({...formData, policy_code: e.target.value})}
              />
            </div>
            
            <div className="col-span-1 flex items-end mb-1">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">เปิดใช้งาน (Active)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              required
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="คำอธิบายเกณฑ์การคัดเลือก..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Instruction</label>
            <textarea 
              required
              rows={4}
              className="w-full font-mono text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              placeholder="คำสั่งสำหรับ AI..."
              value={formData.prompt_instruction}
              onChange={(e) => setFormData({...formData, prompt_instruction: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
  )
}