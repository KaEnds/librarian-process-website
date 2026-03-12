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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

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

  const handleDeleteClick = useCallback((id: number) => {
    setConfirmDeleteId(id)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (confirmDeleteId === null) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    try {
      const response = await fetch("/api/policies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: id }),
      })
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.message || "Delete policy failed")
      }
      await fetchPolicies()
      showToast("ลบข้อมูลสำเร็จ", "success", 3000)
    } catch (error) {
      console.error("Error deleting policy:", error)
      showToast("เกิดข้อผิดพลาดในการลบข้อมูล", "error", 3000)
    }
  }, [confirmDeleteId, fetchPolicies, showToast])

  const columns = useMemo(
    () => getColumns(handleEditClick, handleDeleteClick),
    [handleEditClick, handleDeleteClick]
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

      {/* Confirm Delete Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div
            className="w-full max-w-md overflow-hidden rounded-md border border-border bg-background"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
              <h3 className="text-base font-semibold">ยืนยันการลบ</h3>
            </div>

            <div className="bg-muted/30 p-4">
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  คุณแน่ใจหรือไม่ว่าต้องการลบ Policy นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                  ยกเลิก
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmDelete}>
                  ลบ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}