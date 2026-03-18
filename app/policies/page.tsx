"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/Toast"
import { PolicyFormPopup } from "@/components/PolicyFormPopup"
import { getColumns, type Policy } from "./columns"
import { DataTable } from "./data-table"

export default function PolicyManagementPage() {
  const { showToast } = useToast()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/policies")
      if (!response.ok) throw new Error("Fetch failed")
      const payload = await response.json()
      setPolicies(payload.data || [])
    } catch (error) {
      console.error("Error fetching policies:", error)
      showToast("เกิดข้อผิดพลาดในการดึงข้อมูล", "error", 3000)
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleAddClick = useCallback(() => {
    setSelectedPolicy(null)
    setIsPopupOpen(true)
  }, [])

  const handleEditClick = useCallback((policy: Policy) => {
    setSelectedPolicy(policy)
    setIsPopupOpen(true)
  }, [])

  const columns = useMemo(
    () => getColumns(handleEditClick),
    [handleEditClick]
  )

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
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
        <div className="p-4">
          <DataTable columns={columns} data={policies} isLoading={isLoading} />
        </div>
      </div>

      {/* Pop-up Form */}
      <PolicyFormPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        initialData={selectedPolicy}
        onSuccess={fetchPolicies}
      />
    </div>
  )
}