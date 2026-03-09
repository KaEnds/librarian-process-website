"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Filter, Download, Send, X } from "lucide-react"
import { useToast } from "@/components/Toast"
import { useVendorQuotes } from "./hooks/useVendorQuotes"

export default function ApprovePage() {
  const router = useRouter()
  const { showToast } = useToast()

  // State management
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
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

  // Table columns configuration
  const columns = getColumns(
    false,
    new Set(),
    undefined,
    (item) => setSelectedItem(item)
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

    return result
  }, [data, filters])

  const activeFilterCount = useMemo(() => {
    return filters.vendorStatus.length + filters.approvalStatus.length
  }, [filters])

  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(data.map(item => item.vendor_name).filter(Boolean)))
  }, [data])

  const totalPrice = useMemo(() => {
    const total = filteredData.reduce((sum, item) => {
      const price = parseFloat(item.total_price.replace(/,/g, '')) || 0
      return sum + price
    }, 0)
    
    return total.toLocaleString('th-TH', { minimumFractionDigits: 0 })
  }, [filteredData])

  const handleExport = () => {
    // TODO: Implement export functionality
    showToast('กำลังพัฒนาฟังก์ชันนี้', 'info')
  }

  const handleViewApprovalDocument = () => {
    // TODO: Implement view approval document functionality
    showToast('กำลังพัฒนาฟังก์ชันนี้', 'info')
  }

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
                {filteredData.length !== data.length 
                  ? `${filteredData.length} / ${data.length} รายการ` 
                  : `${data.length} รายการ`
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
              className={`bg-white ${isFilterOpen ? 'border-blue-500' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
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
            className="bg-white"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleViewApprovalDocument}
          >
            <Download className="w-4 h-4 mr-2" />
            ดูเป็นเอกสาร
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
      />

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-[calc(16rem+2rem)] right-8 bg-white border-t border-gray-200 shadow-lg rounded-t-lg">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase">จำนวนทั้งสิ้น</span>
              <span className="text-lg font-bold text-blue-600 mt-1">{filteredData.length} รายการ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase">เป็นเงินทั้งหมด</span>
              <div className="flex items-baseline mt-1">
                <span className="text-2xl font-bold text-blue-600">{totalPrice}</span>
                <span className="text-sm text-gray-600 ml-2">บาท</span>
              </div>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-base h-auto"
          >
            <Send className="w-5 h-5 mr-2" />
            เพิ่มเอกสารอนุมัติ
          </Button>
        </div>
      </div>

      {/* Quote Details Popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">รายละเอียดใบเสนอราคา</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">ชื่อหนังสือ</label>
                  <p className="text-sm font-medium">{selectedItem.title || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ร้านค้า</label>
                  <p className="text-sm font-medium">{selectedItem.vendor_name || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">จำนวน</label>
                  <p className="text-sm font-medium">{selectedItem.quantity || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">หน่วย</label>
                  <p className="text-sm font-medium">{selectedItem.unit || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">ราคาต่อหน่วย</label>
                  <p className="text-sm font-medium">{selectedItem.unit_price || "-"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ราคาสุทธิ</label>
                  <p className="text-sm font-medium">{selectedItem.total_price || "-"}</p>
                </div>
              </div>

              {selectedItem.net_score !== undefined && (
                <div>
                  <label className="text-sm text-gray-600">คะแนน</label>
                  <p className="text-sm font-medium">{selectedItem.net_score || "-"}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedItem(null)}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
