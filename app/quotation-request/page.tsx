"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getColumns, Request } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Check, Download, Filter, RotateCcw } from "lucide-react"
import { ApiRequest, toTextOrNull, mapApiRequestToRequest } from "@/utils/utils"
import { exportRequestsToExcel } from "@/utils/export"
import { applyFilters, getActiveFilterCount, type FilterState } from "@/utils/filters"
import { RequestDetailsPopup } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailPopup } from "@/components/AIDecisionDetailPopup"
import { markRequestSeen } from "@/lib/request-notifications"
import { useToast } from "@/components/Toast"
import { updateReviewStatus, updateMultipleProcessStates } from "@/utils/api"

const formatThaiDate = (value: string | null | undefined): string | null => {
  const textValue = toTextOrNull(value)

  if (!textValue) {
    return null
  }

  const date = new Date(textValue)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function QuoteRequestPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [allData, setAllData] = useState<Request[]>([])
  const [displayData, setDisplayData] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasLoadedOnceRef = useRef(false)
  const [processStatus, setProcessStatus] = useState<string | null>(null)
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string>("-")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<Request | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    aiStatus: [],
    actionStatus: [],
  })
  const filterRef = useRef<HTMLDivElement>(null)
  const emptySelectedIds = useMemo(() => new Set<number>(), [])

  useEffect(() => {
    let isMounted = true

    const fetchQuotationRequests = async () => {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true)
      }
      try {
        const processResponse = await fetch("/api/get-process-state?processId=2")
        if (!processResponse.ok) {
          return
        }

        const processPayload = await processResponse.json()
        const processStatus = toTextOrNull(processPayload?.status)

        if (isMounted) {
          setProcessStatus(processStatus)
        }

        // Load quotation source data when process 2 is active or completed.
        if (processStatus !== "IN_PROGRESS" && processStatus !== "DONE") {
          if (isMounted) {
            setAllData([])
            setDisplayData([])
          }
          return
        }

        const requestResponse = await fetch("/api/get-book-requests")
        if (!requestResponse.ok) {
          return
        }

        const payload = await requestResponse.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        // Get all approved and rejected requests (for backend logic)
        const allRequests = apiRequests.filter(
          (item) => {
            const status = toTextOrNull(item.review_status)
            return status === "APPROVE_REVIEW" || status === "REJECT_REVIEW"
          }
        )

        // Get only approved requests (for display)
        const approvedRequests = allRequests.filter(
          (item) => toTextOrNull(item.review_status) === "APPROVE_REVIEW"
        )

        if (!isMounted) {
          return
        }

        const batchDateText = approvedRequests.reduce<string | null>((current, item) => {
          if (current) {
            return current
          }

          const startDate = formatThaiDate(item.batch_start_date)
          const endDate = formatThaiDate(item.batch_end_date)

          if (startDate && endDate) {
            return `${startDate} - ${endDate}`
          }

          return startDate ?? endDate
        }, null)

        if (batchDateText) {
          setCurrentBatchDateText(batchDateText)
        }

        const mappedAllData = allRequests.map(mapApiRequestToRequest)
        const mappedDisplayData = approvedRequests.map(mapApiRequestToRequest)
        
        setAllData(mappedAllData)
        setDisplayData(mappedDisplayData)
      } catch (error) {
        console.error("Error fetching quotation request data:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
          hasLoadedOnceRef.current = true
        }
      }
    }

    fetchQuotationRequests()
    const interval = setInterval(fetchQuotationRequests, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

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

  const isReturnSelectionDisabled = isLoading || processStatus === null || processStatus === "PENDING" || processStatus === "DONE"
  const isToggleCompletionDisabled = isLoading || processStatus === "PENDING" || processStatus === null

  const filteredData = useMemo(
    () => applyFilters(displayData, filters, emptySelectedIds),
    [displayData, filters, emptySelectedIds]
  )

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  )

  const currentDateText = useMemo(() => {
    if (currentBatchDateText !== "-") {
      return currentBatchDateText
    }

    return formatThaiDate(new Date().toISOString()) ?? "-"
  }, [currentBatchDateText])

  const columns = getColumns(
    false,
    new Set(),
    undefined,
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

  const handleToggleFilter = (category: "aiStatus" | "actionStatus", value: string) => {
    setFilters((prev) => {
      const currentFilters = prev[category]
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter((f) => f !== value)
        : [...currentFilters, value]

      return { ...prev, [category]: newFilters }
    })
  }

  const clearFilters = () => {
    setFilters({ aiStatus: [], actionStatus: [] })
  }

  const handleExport = () => {
    exportRequestsToExcel(filteredData, "คำร้องขอจัดซื้อตัดแล้ว")
  }

  const handleReturnSelection = async () => {
    const rejectedItems = allData.filter(item => item.review_status === "REJECT_REVIEW")
    
    if (rejectedItems.length === 0) {
      showToast('ไม่มีคำร้องถูกปฏิเสธ ไม่จำเป็นต้องเลือกคำร้องใหม่', 'info', 3000)
      return
    }
    
    try {
      // Update rejected items back to pending
      await Promise.all(
        rejectedItems.map(item => 
          item.request_id ? updateReviewStatus(item.request_id, 'PENDING_REVIEW') : Promise.resolve()
        )
      )
      
      // Update state
      const updatedAllData = allData.map(item => ({
        ...item,
        review_status: item.review_status === "REJECT_REVIEW" ? "PENDING_REVIEW" : item.review_status
      })) as Request[]
      const updatedDisplayData = updatedAllData.filter(item => item.review_status === "APPROVE_REVIEW")
      
      setAllData(updatedAllData)
      setDisplayData(updatedDisplayData)
      setIsSubmitted(false)
      
      // Update process states
      await updateMultipleProcessStates([
        { processId: 1, status: 'IN_PROGRESS' },
        { processId: 2, status: 'PENDING' }
      ])
      
      showToast('เปลี่ยนสถานะเป็นรอดำเนินการแล้ว', 'success', 3000)
      router.push('/requests-selection')
    } catch (error) {
      console.error('Error updating review status:', error)
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 3000)
    }
  }

  const handleToggleCompletion = async () => {
    if (processStatus === "PENDING" || processStatus === null) {
      showToast("ยังไม่สามารถเปลี่ยนสถานะขั้นตอนได้", "info", 3000)
      return
    }

    try {
      if (processStatus === "DONE") {
        await updateMultipleProcessStates([
          { processId: 2, status: "IN_PROGRESS" },
          { processId: 3, status: "PENDING" },
        ])
        setProcessStatus("IN_PROGRESS")
        showToast("ย้อนกลับสถานะแล้ว", "success", 3000)
        return
      }

      await updateMultipleProcessStates([
        { processId: 2, status: "DONE" },
        { processId: 3, status: "IN_PROGRESS" },
      ])
      setProcessStatus("DONE")
      showToast("เปลี่ยนสถานะเป็นเสร็จสิ้นแล้ว", "success", 3000)
    } catch (error) {
      console.error("Error toggling process states:", error)
      showToast("เกิดข้อผิดพลาดในการอัปเดตสถานะขั้นตอน", "error", 3000)
    }
  }

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">{currentBatchDateText}</span>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">ส่งขอใบเสนอราคา</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">
                {filteredData.length !== displayData.length
                  ? `${filteredData.length} / ${displayData.length} รายการ`
                  : `${displayData.length} รายการ`}
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ {currentDateText}</p>
        </div>

        <div className="flex gap-3">
          <div className="relative" ref={filterRef}>
            <Button
              variant="outline"
              className={`bg-white ${isFilterOpen ? "border-blue-500" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">ตัวกรอง</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ล้างทั้งหมด
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">การคัดโดย AI</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.aiStatus.includes("approved")}
                        onChange={() => handleToggleFilter("aiStatus", "approved")}
                        className="rounded"
                      />
                      <span className="text-sm">Approved</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.aiStatus.includes("rejected")}
                        onChange={() => handleToggleFilter("aiStatus", "rejected")}
                        className="rounded"
                      />
                      <span className="text-sm">Rejected</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
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

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">สถานะ</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.actionStatus.includes("selected")}
                        onChange={() => handleToggleFilter("actionStatus", "selected")}
                        className="rounded"
                      />
                      <span className="text-sm">เลือกแล้ว</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.actionStatus.includes("rejected")}
                        onChange={() => handleToggleFilter("actionStatus", "rejected")}
                        className="rounded"
                      />
                      <span className="text-sm">ปฏิเสธ</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
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
          <Button variant="outline" className="bg-white" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            className={`text-white ${
              isReturnSelectionDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleReturnSelection}
            disabled={isReturnSelectionDisabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            เลือกคำร้องใหม่
          </Button>
          <Button
            className={`text-white ${
              isReturnSelectionDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleToggleCompletion}
            disabled={isToggleCompletionDisabled}
          >
            <Check className="w-4 h-4 mr-2" />
            {processStatus === "DONE" ? "ได้รับใบเสนอราคาแล้ว" : "ได้รับใบเสนอราคาแล้ว"}
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} isLoading={isLoading && displayData.length === 0} />

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
    </div>
  )
}