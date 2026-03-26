"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Filter, Download, Send, RotateCcw, PenLine } from "lucide-react"
import * as XLSX from "xlsx"
import { useToast } from "@/components/Toast"
import { useVendorQuotes } from "./hooks/useVendorQuotes"
import { updateMultipleProcessStates } from "@/utils/api"
import { PurchaseNotePopup } from "@/components/PurchaseNotePopup"

export default function ApprovePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const NOTE_STORAGE_KEY = "approve-purchase-note"

  // State management
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isNotePopupOpen, setIsNotePopupOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [purchaseNote, setPurchaseNote] = useState("")
  const [process4Status, setProcess4Status] = useState<string | null>(null)
  const [isProcessStatusLoading, setIsProcessStatusLoading] = useState(true)
  const [filters, setFilters] = useState({
    vendorStatus: [] as string[],
    approvalStatus: [] as string[],
  })
  const filterRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const { data, setData, isLoading } = useVendorQuotes({
    onBatchDateText: setCurrentBatchDateText,
    onError: (error) => {
      showToast(error, 'error', 5000)
    }
  })

  // Event handlers

  const handleToggleFilter = (category: 'vendorStatus' | 'approvalStatus', value: string) => {
    setFilters(prev => {
      const currentFilters = prev[category]
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value]
      return { ...prev, [category]: newFilters }
    })
  }

  const clearFilters = () => {
    setFilters({ vendorStatus: [], approvalStatus: [] })
  }

  const isProcess4Pending = process4Status === "PENDING"
  const isActionDisabled = isProcessStatusLoading || isProcess4Pending



  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isFilterOpen])

  useEffect(() => {
    const savedNote = sessionStorage.getItem(NOTE_STORAGE_KEY)
    if (savedNote) {
      setPurchaseNote(savedNote)
    }
  }, [])

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      try {
        const response = await fetch('/api/my-account')
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        setUserRole(payload?.user?.user_role ?? null)
      } catch (error) {
        console.error('Error fetching current user role:', error)
      }
    }

    fetchCurrentUserRole()
  }, [])

  useEffect(() => {
    const fetchProcessStatus = async () => {
      setIsProcessStatusLoading(true)
      try {
        const response = await fetch("/api/get-process-state?processId=4")
        if (response.ok) {
          const payload = await response.json()
          setProcess4Status(payload?.status ?? null)
          return
        }
        setProcess4Status(null)
      } catch (error) {
        console.error("Error fetching process 4 status:", error)
        setProcess4Status(null)
      } finally {
        setIsProcessStatusLoading(false)
      }
    }

    fetchProcessStatus()
  }, [])

  // Table columns configuration
  const columns = getColumns(
    false,
    new Set(),
    undefined,
  )

  // Filtered data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply vendor filter
    if (filters.vendorStatus.length > 0) {
      result = result.filter(item => 
        filters.vendorStatus.includes(item.vendor_name)
      )
    }

    // Apply approval status filter
    if (filters.approvalStatus.length > 0) {
      result = result.filter(item => {
        if (filters.approvalStatus.includes("approved")) {
          if (item.review_status !== "APPROVE_REVIEW") return false
        }
        if (filters.approvalStatus.includes("pending")) {
          if (item.review_status !== "PENDING_REVIEW") return false
        }
        if (filters.approvalStatus.includes("rejected")) {
          if (item.review_status !== "REJECT_REVIEW") return false
        }
        return true
      })
    }

    result.sort((a, b) => a.evaluation_id - b.evaluation_id)

    return result
  }, [data, filters])

  const activeFilterCount = useMemo(() => {
    return filters.vendorStatus.length + filters.approvalStatus.length
  }, [filters])

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(data.map(item => item.vendor_name).filter(Boolean)))
  }, [data])

  const totalPrice = useMemo(() => {
    if (isProcess4Pending) {
      return "0"
    }

    const total = filteredData.reduce((sum, item) => {
      const sourcePrice = item.net_price || item.total_price || item.unit_price
      const price = parseFloat(sourcePrice.replace(/,/g, '')) || 0
      return sum + price
    }, 0)
    
    return total.toLocaleString('th-TH', { minimumFractionDigits: 0 })
  }, [filteredData, isProcess4Pending])

  const tableData = useMemo(() => {
    if (isProcess4Pending) {
      return []
    }
    return filteredData
  }, [filteredData, isProcess4Pending])

  const noteButtonLabel = userRole?.toLowerCase() === 'director'
    ? 'อนุมัติการจัดซื้อ'
    : 'เขียนหมายเหตุ'

  const visibleTotalCount = isProcess4Pending ? 0 : data.length

  const handleExport = () => {
    if (isActionDisabled) {
      return
    }

    if (filteredData.length === 0) {
      showToast('ไม่พบรายการสำหรับ Export', 'info')
      return
    }

    const exportData = filteredData.map((item, index) => ({
      "ลำดับ": index + 1,
      "Quote ID": item.quote_id ?? "-",
      "Evaluation ID": item.evaluation_id ?? "-",
      "ชื่อหนังสือ": item.title ?? "-",
      "จำนวน": item.quantity ?? "-",
      "หน่วย": item.unit ?? "-",
      "ราคาต่อหน่วย": item.unit_price ?? "-",
      "ราคาสุทธิ": item.net_price || item.total_price || "-",
      "ร้านค้า": item.vendor_name ?? "-",
      "สถานะรีวิว": item.review_status ?? "-",
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "approve")

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 28 },
      { wch: 18 },
    ]

    const filename = `อนุมัติใบเสนอราคา_${currentBatchDateText ?? "latest"}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const handleViewApprovalDocument = () => {
    if (isActionDisabled) {
      return
    }

    if (filteredData.length === 0) {
      showToast('ไม่พบรายการสำหรับสร้างเอกสาร', 'info')
      return
    }

    const payload = {
      items: filteredData,
      batchDateText: currentBatchDateText,
      generatedAt: new Date().toISOString(),
    }

    sessionStorage.setItem('approve-document-payload', JSON.stringify(payload))
    router.push('/approve/document')
  }

  const handleSelectAgain = async () => {
    if (isActionDisabled) {
      return
    }

    const isConfirmed = window.confirm("ยืนยันการเปลี่ยนสถานะเพื่อกลับไปเลือกใบเสนอราคาอีกครั้งใช่หรือไม่?")
    if (!isConfirmed) {
      return
    }

    try {
      const quoteResponse = await fetch('/api/get-all-vendor-quotes-by-batches')
      if (!quoteResponse.ok) {
        throw new Error('ไม่สามารถดึงรายการใบเสนอราคาล่าสุดได้')
      }

      const quotePayload = await quoteResponse.json()
      const rejectedQuoteIds = Array.from(new Set(
        (quotePayload?.data ?? [])
          .filter((item: any) => item?.review_status === 'REJECT_REVIEW')
          .map((item: any) => Number(item?.quote_id))
          .filter((quoteId: number) => Number.isFinite(quoteId) && quoteId > 0)
      ))

      if (rejectedQuoteIds.length > 0) {
        const restoreResponse = await fetch('/api/update-quote-comparison-review-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteIds: rejectedQuoteIds,
            reviewStatus: 'PENDING_REVIEW',
          }),
        })

        if (!restoreResponse.ok) {
          throw new Error('ไม่สามารถเปลี่ยนสถานะ REJECT_REVIEW กลับเป็น PENDING_REVIEW ได้')
        }
      }

      await updateMultipleProcessStates([
        { processId: 3, status: 'IN_PROGRESS' },
        { processId: 4, status: 'PENDING' },
      ])

      router.push('/quote-comparison')
    } catch (error) {
      console.error('Error updating process states for reselection:', error)
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ workflow', 'error')
    }
  }

  const openPurchaseNotePopup = () => {
    if (isActionDisabled) {
      return
    }

    if (filteredData.length === 0) {
      showToast("ไม่พบรายการสำหรับเขียนหมายเหตุ", "info")  
      return
    }

    setIsNotePopupOpen(true)
  }

  const handleSavePurchaseNote = () => {
    const savePurchaseRemark = async () => {
      try {
        const response = await fetch('/api/update-purchase-remark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remark: purchaseNote }),
        })

        if (!response.ok) {
          throw new Error('Failed to save purchase remark')
        }

        sessionStorage.setItem(NOTE_STORAGE_KEY, purchaseNote)
        setIsNotePopupOpen(false)
        showToast("บันทึกหมายเหตุเรียบร้อย", "success")
      } catch (error) {
        console.error('Error saving purchase remark:', error)
        showToast("เกิดข้อผิดพลาดในการบันทึกหมายเหตุ", "error")
      }
    }

    void savePurchaseRemark()
  }

  const handleDirectorApprovePurchase = async () => {
    try {
      const remarkResponse = await fetch('/api/update-purchase-remark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: purchaseNote }),
      })

      if (!remarkResponse.ok) {
        throw new Error('Failed to save purchase remark')
      }

      const decisionResponse = await fetch('/api/update-purchase-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'APPROVE' }),
      })

      if (!decisionResponse.ok) {
        throw new Error('Failed to approve purchase')
      }

      await updateMultipleProcessStates([
        { processId: 4, status: 'DONE' },
      ])

      sessionStorage.setItem(NOTE_STORAGE_KEY, purchaseNote)
      setIsNotePopupOpen(false)
      setProcess4Status('DONE')
      showToast("อนุมัติการจัดซื้อเรียบร้อย", "success")
    } catch (error) {
      console.error('Error approving purchase:', error)
      showToast("เกิดข้อผิดพลาดในการอนุมัติการจัดซื้อ", "error")
    }
  }

  const handleDirectorRejectPurchase = async () => {
    try {
      const decisionResponse = await fetch('/api/update-purchase-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REJECT' }),
      })

      if (!decisionResponse.ok) {
        throw new Error('Failed to reject purchase')
      }

      await updateMultipleProcessStates([
        { processId: 4, status: 'REJECT' },
      ])

      setIsNotePopupOpen(false)
      setProcess4Status('REJECT')
      showToast("ไม่อนุมัติการจัดซื้อ", "info")
    } catch (error) {
      console.error('Error rejecting purchase:', error)
      showToast("เกิดข้อผิดพลาดในการไม่อนุมัติการจัดซื้อ", "error")
    }
  }

  useEffect(() => {
    if (isActionDisabled) {
      setIsFilterOpen(false)
      setIsNotePopupOpen(false)
    }
  }, [isActionDisabled])

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      {/* Header Section */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">{currentBatchDateText ?? "-"}</span>
        </div>
      </div>

      {/* Title, Stats and Action Buttons */}
      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">อนุมัติใบเสนอราคา</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">
                {tableData.length !== visibleTotalCount 
                  ? `${tableData.length} / ${visibleTotalCount} รายการ` 
                  : `${visibleTotalCount} รายการ`
                }
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ {currentBatchDateText ?? "-"}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative" ref={filterRef}>
            <Button 
              variant="outline" 
              className={`bg-white ${isFilterOpen ? 'border-blue-500' : ''} disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              disabled={isActionDisabled}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            
            {/* Filter Dropdown Panel */}
            {isFilterOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">ตัวกรอง</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:underline"
                      disabled={isActionDisabled}
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>
                
                {/* Vendor Filter */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700">ร้านค้า</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uniqueVendors.map((vendor) => (
                      <label key={vendor} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.vendorStatus.includes(vendor)}
                          onChange={() => handleToggleFilter("vendorStatus", vendor)}
                          className="rounded"
                        />
                        <span className="text-sm truncate">{vendor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Approval Status Filter */}
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700">สถานะการอนุมัติ</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.approvalStatus.includes("approved")}
                        onChange={() => handleToggleFilter("approvalStatus", "approved")}
                        className="rounded"
                      />
                      <span className="text-sm">อนุมัติแล้ว</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.approvalStatus.includes("rejected")}
                        onChange={() => handleToggleFilter("approvalStatus", "rejected")}
                        className="rounded"
                      />
                      <span className="text-sm">ปฏิเสธ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.approvalStatus.includes("pending")}
                        onChange={() => handleToggleFilter("approvalStatus", "pending")}
                        className="rounded"
                      />
                      <span className="text-sm">รอดำเนินการ</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
            onClick={handleExport}
            disabled={isActionDisabled}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            className="bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
            onClick={handleSelectAgain}
            disabled={isActionDisabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            เลือกอีกครั้ง
          </Button>

          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
            onClick={handleViewApprovalDocument}
            disabled={isActionDisabled}
          >
            <Download className="w-4 h-4 mr-2" />
            ดูเป็นเอกสาร
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        showPendingIllustration={isProcess4Pending}
      />

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-[calc(16rem+2rem)] right-8 bg-white border-t border-gray-200 shadow-lg rounded-t-lg">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase">จำนวนทั้งสิ้น</span>
              <span className="text-lg font-bold text-blue-600 mt-1">{tableData.length} รายการ</span>
            </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col text-right">
              <span className="text-xs text-gray-500 font-medium uppercase">เป็นเงินทั้งหมด</span>
              <div className="flex items-baseline mt-1 justify-end">
                <span className="text-2xl font-bold text-blue-600">{totalPrice}</span>
                <span className="text-sm text-gray-600 ml-2">บาท</span>
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-base h-auto disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
              onClick={openPurchaseNotePopup}
              disabled={isActionDisabled}
            >
              <PenLine className="w-5 h-5 mr-2" />
              {noteButtonLabel}
            </Button>
          </div>
        </div>
      </div>

      <PurchaseNotePopup
        open={isNotePopupOpen}
        items={tableData.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.net_price || item.total_price,
          vendor_name: item.vendor_name,
        }))}
        note={purchaseNote}
        onNoteChange={setPurchaseNote}
        onClose={() => setIsNotePopupOpen(false)}
        onSave={handleSavePurchaseNote}
        isDirector={userRole?.toLowerCase() === 'director'}
        onApprove={handleDirectorApprovePurchase}
        onReject={handleDirectorRejectPurchase}
      />


    </div>
  )
}
