"use client"

import { useEffect, useRef, useState } from "react"
import { getColumns, Request } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { RequestDetailsPopup } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailPopup } from "@/components/AIDecisionDetailPopup"
import { Filter, Download, ChevronDown } from "lucide-react"
import * as XLSX from "xlsx"
import {
  ApiRequest,
  mapApiRequestToRequest,
  toTextOrNull,
} from "@/utils/utils"

type BatchGroup = {
  id: string
  name: string
  date: string
  totalRequests: number
  requests: Request[]
}

export default function RequestsHistoryPage() {
  const [data, setData] = useState<Request[]>([])
  const [batches, setBatches] = useState<BatchGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<Request | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<BatchGroup | null>(null)
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    aiStatus: [] as string[],
    actionStatus: [] as string[],
  })
  const filterRef = useRef<HTMLDivElement>(null)
  const batchDropdownRef = useRef<HTMLDivElement>(null)

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

  const toUnixTime = (value: string | null | undefined): number => {
    const textValue = toTextOrNull(value)

    if (!textValue) {
      return 0
    }

    const unixTime = new Date(textValue).getTime()
    return Number.isNaN(unixTime) ? 0 : unixTime
  }

  const createBatchDateText = (batchStartDate: string | null, batchEndDate: string | null): string => {
    const startDate = formatThaiDate(batchStartDate)
    const endDate = formatThaiDate(batchEndDate)

    if (startDate && endDate) {
      return `${startDate} - ${endDate}`
    }

    return startDate ?? endDate ?? "ไม่ระบุช่วงเวลา"
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setIsBatchDropdownOpen(false)
      }
    }

    if (isFilterOpen || isBatchDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isFilterOpen, isBatchDropdownOpen])

  // โหลดข้อมูลย้อนหลังและจัดกลุ่มตามช่วงเวลา batch
  useEffect(() => {
    const loadBatchData = async () => {
      setIsLoading(true)
      try {
        // ดึงข้อมูลจาก API
        const response = await fetch('/api/get-all-book-requests')
        const payload = await response.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        const groupedRequests = apiRequests.reduce<Map<string, ApiRequest[]>>((result, item) => {
          const batchStartDate = toTextOrNull(item.batch_start_date)
          const batchEndDate = toTextOrNull(item.batch_end_date)
          const key = `${batchStartDate ?? ""}|${batchEndDate ?? ""}`

          const group = result.get(key) ?? []
          group.push(item)
          result.set(key, group)
          return result
        }, new Map())

        const sortedGroups = [...groupedRequests.entries()].sort((a, b) => {
          const [aStart, aEnd] = a[0].split("|")
          const [bStart, bEnd] = b[0].split("|")
          const aTime = Math.max(toUnixTime(aStart), toUnixTime(aEnd))
          const bTime = Math.max(toUnixTime(bStart), toUnixTime(bEnd))
          return bTime - aTime
        })

        const mappedBatches: BatchGroup[] = sortedGroups.map(([key, requests], index) => {
          const [batchStartDateRaw, batchEndDateRaw] = key.split("|")
          const batchStartDate = toTextOrNull(batchStartDateRaw)
          const batchEndDate = toTextOrNull(batchEndDateRaw)
          const date = createBatchDateText(batchStartDate, batchEndDate)
          const mappedRequests = requests.map(mapApiRequestToRequest)

          return {
            id: key,
            name: `Batch ${index + 1}`,
            date,
            totalRequests: mappedRequests.length,
            requests: mappedRequests,
          }
        })

        setBatches(mappedBatches)

        if (mappedBatches.length === 0) {
          setSelectedBatch(null)
          setData([])
          return
        }

        setSelectedBatch(mappedBatches[0])
        setData(mappedBatches[0].requests)
      } catch (error) {
        console.error("Error loading batch data:", error)
        setBatches([])
        setSelectedBatch(null)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBatchData()
  }, [])

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

  const filteredData = data.filter(item => {
    // Filter by AI Status
    if (filters.aiStatus.length > 0 && !filters.aiStatus.includes(item.status)) {
      return false
    }
    
    // Filter by Action Status
    if (filters.actionStatus.length > 0) {
      const itemStatus = item.review_status === "APPROVE_REVIEW" ? "selected" : item.review_status === "REJECT_REVIEW" ? "rejected" : "pending"
      if (!filters.actionStatus.includes(itemStatus)) {
        return false
      }
    }
    
    return true
  })

  const activeFilterCount = filters.aiStatus.length + filters.actionStatus.length

  const handleExport = () => {
    // Prepare data for export
    const exportData = filteredData.map((item, index) => ({
      'ลำดับ': index + 1,
      'ชื่อหนังสือ': item.details.title || '-',
      'ผู้แต่ง': item.details.author || '-',
      'ISBN/ISSN': item.details.isbn || '-',
      'ปีที่พิมพ์': item.details.year || '-',
      'สำนักพิมพ์': item.details.publisher || '-',
      'สำหรับสาขา': item.details.branch || '-',
      'ชื่อผู้ร้องขอ': item.details.requester.name || '-',
      'รหัสประจำตัว': item.details.requester.studentId || '-',
      'สถานะผู้ร้องขอ': item.details.requester.status || '-',
      'คณะ': item.details.requester.faculty || '-',
      'สาขาวิชา': item.details.requester.major || '-',
      'เหตุผลการร้องขอ': item.details.requestReason || '-',
      'รายละเอียดเพิ่มเติม': item.details.detailReason || '-'
    }))

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'คำร้องขอจัดซื้อ')

    // Set column widths
    const columnWidths = [
      { wch: 8 },  // ลำดับ
      { wch: 40 }, // ชื่อหนังสือ
      { wch: 25 }, // ผู้แต่ง
      { wch: 15 }, // ISBN/ISSN
      { wch: 12 }, // ปีที่พิมพ์
      { wch: 25 }, // สำนักพิมพ์
      { wch: 20 }, // สำหรับสาขา
      { wch: 25 }, // ชื่อผู้ร้องขอ
      { wch: 15 }, // รหัสประจำตัว
      { wch: 15 }, // สถานะผู้ร้องขอ
      { wch: 25 }, // คณะ
      { wch: 25 }, // สาขาวิชา
      { wch: 30 }, // เหตุผลการร้องขอ
      { wch: 40 }  // รายละเอียดเพิ่มเติม
    ]
    worksheet['!cols'] = columnWidths

    // Generate filename with batch name
    const filename = `คำร้องขอจัดซื้อ_${selectedBatch?.name ?? "history"}.xlsx`

    // Export file
    XLSX.writeFile(workbook, filename)
  }

  const columns = getColumns(
    (request) => setSelectedRequest(request),
    (request) => setSelectedAIRequest(request)
  )

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      {/* Info Section */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-semibold">ข้อมูลย้อนหลัง</span>
          <span className="text-sm text-gray-600">{selectedBatch?.date ?? "-"}</span>
        </div>
      </div>

      {/* Title, Stats and Action Buttons */}
      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">คำร้องขอจัดซื้อย้อนหลัง</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">
                {filteredData.length !== data.length 
                  ? `${filteredData.length} / ${data.length} รายการ` 
                  : `${data.length} รายการ`
                }
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-600">{selectedBatch?.name ?? "-"}</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative" ref={batchDropdownRef}>
            <Button
              variant="outline"
              className={`bg-white min-w-[300px] justify-between ${isBatchDropdownOpen ? 'border-blue-500' : ''}`}
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold">{selectedBatch?.name ?? "-"}</span>
                <span className="text-xs text-gray-500">{selectedBatch?.date ?? "-"}</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>

            {isBatchDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg w-full z-50">
                {batches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch)
                      setData(batch.requests)
                      setIsBatchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                      selectedBatch?.id === batch.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="font-semibold">{batch.name}</span>
                    <p className="text-xs text-gray-500">{batch.date}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

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
    </div>
  )
}
