"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { RequestDetailsPopup } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailPopup } from "@/components/AIDecisionDetailPopup"
import { ConfirmRequestPopup } from "@/components/ConfirmRequestPopup"
import { Filter, Download, Plus, Send, X } from "lucide-react"
import { useToast } from "@/components/Toast"
import { markRequestSeen } from "@/lib/request-notifications"
import { useBookRequests } from "./hooks/useBookRequests"
import { useProcessStatus } from "./hooks/useProcessStatus"
import { useRequestActions } from "./hooks/useRequestActions"
import { exportRequestsToExcel } from "@/utils/export"
import { applyFilters, getActiveFilterCount, type FilterState } from "@/utils/filters"

export default function RequestsPage() {
  const { showToast } = useToast()
  
  // State management
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    aiStatus: [],
    actionStatus: [],
  })
  const filterRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const { data, setData, isLoading } = useBookRequests({
    onNewRequests: (count) => {
      showToast(`มีคำร้องขอจัดซื้อใหม่เข้ามา ${count} รายการ`, 'info', 5000)
    },
    onBatchDateText: setCurrentBatchDateText
  })

  const { isSubmitted, setIsSubmitted } = useProcessStatus(1)

  const {
    isNextStepPopupOpen,
    setIsNextStepPopupOpen,
    nextStepRequests,
    handleSubmitToNextStep,
    handleConfirmNextStep,
    handleSaveSelection
  } = useRequestActions({
    data,
    setData,
    setIsSubmitted,
    showToast
  })

  // Computed values
  const filteredData = useMemo(
    () => applyFilters(data, filters, selectedIds),
    [data, filters, selectedIds]
  )

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  )

  // Event handlers
  const handleSelectionChange = (requestId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(requestId)
      } else {
        next.delete(requestId)
      }
      return next
    })
  }

  const handleToggleFilter = (category: 'aiStatus' | 'actionStatus', value: string) => {
    setFilters(prev => {
      const currentFilters = prev[category]
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value]
      return { ...prev, [category]: newFilters }
    })
  }

  const clearFilters = () => {
    setFilters({ aiStatus: [], actionStatus: [] })
  }

  const handleExport = () => {
    exportRequestsToExcel(filteredData)
  }

  const enterSelectionMode = () => {
    const initialSelectedIds = new Set<number>()
    data.forEach((item) => {
      if (item.review_status === "APPROVE_REVIEW") {
        initialSelectedIds.add(item.id)
      }
    })
    setSelectedIds(initialSelectedIds)
    setIsSelectionMode(true)
  }

  const saveAndExitSelectionMode = async () => {
    const success = await handleSaveSelection(selectedIds)
    if (success) {
      setIsSelectionMode(false)
    }
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
    isSelectionMode,
    selectedIds,
    handleSelectionChange,
    (request) => {
      if (request.request_id) {
        markRequestSeen(request.request_id)
      }
      setSelectedRequest(request)
    },
    (request) => {
      if (request.request_id) {
        markRequestSeen(request.request_id)
      }
      setSelectedAIRequest(request)
    }
  )

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
            <h1 className="text-xl font-bold">คำร้องขอจัดซื้อ</h1>
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
                
                {/* AI Status Filter */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700">การคัดโดย AI</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.aiStatus.includes("approved")}
                        onChange={() => handleToggleFilter("aiStatus", "approved")}
                        className="rounded"
                      />
                      <span className="text-sm">Approved</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.aiStatus.includes("rejected")}
                        onChange={() => handleToggleFilter("aiStatus", "rejected")}
                        className="rounded"
                      />
                      <span className="text-sm">Rejected</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.aiStatus.includes("pending")}
                        onChange={() => handleToggleFilter("aiStatus", "pending")}
                        className="rounded"
                      />
                      <span className="text-sm">Pending</span>
                    </label>
                  </div>
                </div>
                
                {/* Action Status Filter */}
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700">สถานะ</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.actionStatus.includes("selected")}
                        onChange={() => handleToggleFilter("actionStatus", "selected")}
                        className="rounded"
                      />
                      <span className="text-sm">เลือกแล้ว</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.actionStatus.includes("rejected")}
                        onChange={() => handleToggleFilter("actionStatus", "rejected")}
                        className="rounded"
                      />
                      <span className="text-sm">ปฏิเสธ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.actionStatus.includes("pending")}
                        onChange={() => handleToggleFilter("actionStatus", "pending")}
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
          {!isSelectionMode ? (
            <Button 
              className={`text-white ${
                isSubmitted 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isSubmitted}
              onClick={enterSelectionMode}
            >
              <Plus className="w-4 h-4 mr-2" />
              เลือกคำร้องขอเอง
            </Button>
          ) : (
            <>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={saveAndExitSelectionMode}
              >
                บันทึก
              </Button>
              <Button 
                variant="outline" 
                className="bg-white border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setIsSelectionMode(false)}
              >
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
            </>
          )}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmitToNextStep}>
            <Send className="w-4 h-4 mr-2" />
            ส่งคำร้องขอไปยังขั้นตอนถัดไป
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredData} isLoading={isLoading} />

      <RequestDetailsPopup
        open={!!selectedRequest}
        data={selectedRequest?.details ?? null}
        onClose={() => setSelectedRequest(null)}
      />

      <AIDecisionDetailPopup
        open={!!selectedAIRequest}
        data={selectedAIRequest?.aiSelectionDetail ?? null}
        onClose={() => setSelectedAIRequest(null)}
      />

      <ConfirmRequestPopup
        open={isNextStepPopupOpen}
        requests={nextStepRequests}
        onClose={() => setIsNextStepPopupOpen(false)}
        onConfirm={handleConfirmNextStep}
      />
    </div>
  )
}

