"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/components/Toast"
// นำเข้า PolicyFormPopup (เราจะสร้างในไฟล์ถัดไป)
import { PolicyFormPopup } from "@/components/PolicyFormPopup" 

export interface Policy {
  policy_id: number;
  policy_code: string;
  description: string;
  prompt_instruction: string;
  is_active: boolean;
}

export default function PolicyManagementPage() {
  const { showToast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // สำหรับจัดการ Modal
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)

  // ฟังก์ชันดึงข้อมูล (Mock API - เปลี่ยนเป็น API จริงของคุณ)
  const fetchPolicies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/get-policies")
      if (response.ok) {
        const payload = await response.json()
        setPolicies(payload.data || [])
      } else {
        // ตัวอย่างข้อมูลจำลองเพื่อให้เห็นภาพ
        setPolicies([
          { policy_id: 3, policy_code: "POL-01", description: "ทรัพยากรต้องสอดคล้องกับหลักสูตร...", prompt_instruction: "Check if this resource aligns...", is_active: true },
          { policy_id: 4, policy_code: "POL-02", description: "การเลือกทรัพยากรควรช่วยรักษาความสมดุล...", prompt_instruction: "Determine if this resource helps...", is_active: true },
        ])
      }
    } catch (error) {
      console.error("Error fetching policies:", error)
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูล", "error", 3000)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  // เปิด Modal เพื่อเพิ่ม
  const handleAddClick = () => {
    setSelectedPolicy(null)
    setIsPopupOpen(true)
  }

  // เปิด Modal เพื่อแก้ไข
  const handleEditClick = (policy: Policy) => {
    setSelectedPolicy(policy)
    setIsPopupOpen(true)
  }

  // ฟังก์ชันลบข้อมูล
  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Policy นี้?")) return

    try {
      // ตัวอย่างการเรียก API ลบ
      // await fetch(`/api/delete-policy/${id}`, { method: 'DELETE' })
      
      setPolicies(policies.filter(p => p.policy_id !== id))
      showToast("ลบข้อมูลสำเร็จ", "success", 3000)
    } catch (error) {
      console.error("Error deleting policy:", error)
      showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error", 3000)
    }
  }

  return (
    <div className="w-full p-8 bg-gray-50 min-h-screen">
      <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-800">จัดการ Policy (เกณฑ์การคัดเลือก)</h1>
            <p className="text-sm text-gray-500 mt-1">ตั้งค่าและจัดการคำสั่ง (Prompt) สำหรับ AI</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={handleAddClick}
          >
            <Plus size={18} />
            <span>เพิ่ม Policy</span>
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">ID</th>
                <th className="px-6 py-4 font-semibold w-32">Policy Code</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Prompt Instruction</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Status</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">กำลังโหลดข้อมูล...</td></tr>
              ) : policies.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.policy_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{policy.policy_id}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{policy.policy_code}</td>
                    <td className="px-6 py-4 text-gray-600">{policy.description}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-xs">{policy.prompt_instruction}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        policy.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(policy)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="แก้ไข"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(policy.policy_id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop-up Form */}
      <PolicyFormPopup 
        isOpen={isPopupOpen} 
        onClose={() => setIsPopupOpen(false)}
        initialData={selectedPolicy}
        onSuccess={fetchPolicies} // โหลดข้อมูลใหม่เมื่อบันทึกสำเร็จ
      />
    </div>
  )
}