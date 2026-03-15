"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Filter, Download, Send, RotateCcw, PenLine } from "lucide-react"
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
      const price = parseFloat(item.unit_price.replace(/,/g, '')) || 0
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

  const visibleTotalCount = isProcess4Pending ? 0 : data.length

  const handleExport = () => {
    if (isActionDisabled) {
      return
    }

    // TODO: Implement export functionality
    showToast('กำลังพัฒนาฟังก์ชันนี้', 'info')
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
    sessionStorage.setItem(NOTE_STORAGE_KEY, purchaseNote)
    setIsNotePopupOpen(false)
    showToast("บันทึกหมายเหตุเรียบร้อย", "success")
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
              เขียนหมายเหตุ
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
          total_price: item.total_price,
          vendor_name: item.vendor_name,
        }))}
        note={purchaseNote}
        onNoteChange={setPurchaseNote}
        onClose={() => setIsNotePopupOpen(false)}
        onSave={handleSavePurchaseNote}
      />


    </div>
  )
}
