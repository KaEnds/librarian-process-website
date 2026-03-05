"use client"

import { useEffect, useRef, useState } from "react"
import { getColumns, Request } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { RequestDetailsPopup } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailPopup } from "@/components/AIDecisionDetailPopup"
import { ConfirmRequestPopup } from "@/components/ConfirmRequestPopup"
import type { ConfirmRequestItem } from "@/components/ConfirmRequestPopup"
import {
  ApiRequest,
  buildConfirmRequestItems,
  getRequestUpdatedAt,
  mapApiRequestToRequest,
  mergeRequests,
  toTextOrNull,
} from "@/lib/utils"
import { Filter, Download, Plus, Send, X } from "lucide-react"
import * as XLSX from "xlsx"
import { useToast } from "@/components/Toast"
import { addRequestNotifications, markRequestSeen } from "@/lib/request-notifications"

export default function RequestsPage() {
  const [data, setData] = useState<Request[]>([])
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<Request | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isNextStepPopupOpen, setIsNextStepPopupOpen] = useState(false)
  const [nextStepRequests, setNextStepRequests] = useState<ConfirmRequestItem[]>([])
  const latestUpdatedAtRef = useRef<string | null>(null)
  const previousCountRef = useRef<number>(0)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    aiStatus: [] as string[],
    actionStatus: [] as string[],
  })
  const filterRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const getRequestedAtFromApi = (item: ApiRequest): string | null => {
    const normalized = item as ApiRequest & {
      requested_at?: string | null
      book_request_requested_at?: string | null
    }

    return toTextOrNull(normalized.book_request_requested_at ?? normalized.requested_at ?? null)
  }

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

  const buildBatchDateText = (item: ApiRequest): string | null => {
    const startDate = formatThaiDate(item.batch_start_date)
    const endDate = formatThaiDate(item.batch_end_date)

    if (startDate && endDate) {
      return `${startDate} - ${endDate}`
    }

    return startDate ?? endDate
  }

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
    let isMounted = true

    const syncRequests = async (incremental: boolean) => {
      if (!incremental) {
        setIsLoading(true)
      }

      try {
        const since = incremental ? latestUpdatedAtRef.current : null
        const query = since ? `?since=${encodeURIComponent(since)}` : ""
        const response = await fetch(`/api/get-book-requests${query}`)
        const payload = await response.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        if (!isMounted) {
          return
        }

        const batchDateText = apiRequests.reduce<string | null>((current, item) => {
          if (current) {
            return current
          }

          return buildBatchDateText(item)
        }, null)

        if (batchDateText) {
          setCurrentBatchDateText(batchDateText)
        }

        if (!apiRequests.length) {
          return
        }

        const mappedRequests = apiRequests.map(mapApiRequestToRequest)

        setData((previous) => {
          const merged = incremental ? mergeRequests(previous, mappedRequests) : mappedRequests
          
          // จัดเรียงตาม requested_at จากใหม่ไปเก่า (descending)
          const sorted = merged.sort((a, b) => {
            const dateA = a.requested_at ? new Date(a.requested_at).getTime() : 0
            const dateB = b.requested_at ? new Date(b.requested_at).getTime() : 0
            return dateB - dateA // descending (ใหม่ไปเก่า)
          })
          
          // แสดง notification เมื่อมี request ใหม่ (เฉพาะเมื่อโหลดแบบ incremental และไม่ใช่การโหลดครั้งแรก)
          if (incremental && previousCountRef.current > 0) {
            const previousIds = new Set(previous.map((item) => item.id))
            const newRequests = mappedRequests.filter((item) => !previousIds.has(item.id))
            const newCount = newRequests.length

            if (newCount > 0) {
              const requestIds = new Set(newRequests.map((item) => item.request_id).filter((value): value is number => typeof value === "number"))
              const topMenuNotifications = apiRequests
                .filter((item) => {
                  const requestId = typeof item.request_id === "number" ? item.request_id : null
                  return requestId !== null && requestIds.has(requestId)
                })
                .map((item) => ({
                  requestId: item.request_id as number,
                  title: toTextOrNull(item.title) ?? null,
                  requestedAt: getRequestedAtFromApi(item),
                }))

              addRequestNotifications(topMenuNotifications)
            }

            if (newCount > 0) {
              showToast(
                `มีคำร้องขอจัดซื้อใหม่เข้ามา ${newCount} รายการ`,
                'info',
                5000
              )
            }
          }
          
          // อัปเดตจำนวนล่าสุด
          previousCountRef.current = sorted.length
          
          return sorted
        })

        const latestFromBatch = apiRequests.reduce<string | null>((latest, item) => {
          const updatedAt = toTextOrNull(getRequestUpdatedAt(item))

          if (!updatedAt) {
            return latest
          }

          if (!latest) {
            return updatedAt
          }

          return new Date(updatedAt).getTime() > new Date(latest).getTime() ? updatedAt : latest
        }, latestUpdatedAtRef.current)

        latestUpdatedAtRef.current = latestFromBatch
      } catch (error) {
        console.error("Error fetching book requests:", error)
      } finally {
        if (!incremental && isMounted) {
          setIsLoading(false)
        }
      }
    }

    syncRequests(false)

    const interval = setInterval(() => {
      syncRequests(true)
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [showToast])

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

  const handleSubmitToNextStep = async () => {
    // Check if there are REJECT_REVIEW items
    const rejectedItems = data.filter(item => item.review_status === "REJECT_REVIEW")
    
    let updatedData = data
    
    if (rejectedItems.length > 0) {
      // Change all REJECT_REVIEW back to PENDING_REVIEW
      try {
        // Update in database
        await Promise.all(
          rejectedItems.map(async (item) => {
            if (item.request_id) {
              await fetch('/api/edit-status-book-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requestId: item.request_id,
                  reviewStatus: 'PENDING_REVIEW'
                })
              })
            }
          })
        )
        
        // Calculate updated data
        updatedData = data.map(item => {
          if (item.review_status === "REJECT_REVIEW") {
            return { ...item, review_status: "PENDING_REVIEW" }
          }
          return item
        })
        
        // Update in state
        setData(updatedData)
        setIsSubmitted(false) // Re-enable "เลือกคำร้องขอเอง" button
        
        showToast('เปลี่ยนสถานะเป็นรอดำเนินการแล้ว', 'success', 3000)
        return // Don't open popup after changing back to PENDING_REVIEW
      } catch (error) {
        console.error('Error updating review status:', error)
        showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 3000)
        return
      }
    }
    
    // Open confirmation popup with approved requests (only when no rejected items)
    const selectedRequests: ConfirmRequestItem[] = buildConfirmRequestItems(updatedData)
    setNextStepRequests(selectedRequests)
    setIsNextStepPopupOpen(true)
  }

  const handleConfirmNextStep = async () => {
    // Change all PENDING_REVIEW to REJECT_REVIEW
    const pendingItems = data.filter(item => item.review_status === "PENDING_REVIEW")
    
    if (pendingItems.length === 0) {
      setIsNextStepPopupOpen(false)
      return
    }
    
    try {
      // Update in database
      await Promise.all(
        pendingItems.map(async (item) => {
          if (item.request_id) {
            await fetch('/api/edit-status-book-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId: item.request_id,
                reviewStatus: 'REJECT_REVIEW'
              })
            })
          }
        })
      )
      
      // Update in state
      setData((prev) => prev.map(item => {
        if (item.review_status === "PENDING_REVIEW") {
          return { ...item, review_status: "REJECT_REVIEW" }
        }
        return item
      }))
      
      showToast('เปลี่ยนสถานะรายการที่รอดำเนินการเป็นปฏิเสธแล้ว', 'success', 3000)
      setIsSubmitted(true) // Disable "เลือกคำร้องขอเอง" button
      setIsNextStepPopupOpen(false)
    } catch (error) {
      console.error('Error updating review status:', error)
      showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error', 3000)
      setIsNextStepPopupOpen(false)
    }
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

  const filteredData = data.filter(item => {
    // Filter by AI Status
    if (filters.aiStatus.length > 0 && !filters.aiStatus.includes(item.status)) {
      return false
    }
    
    // Filter by Action Status
    if (filters.actionStatus.length > 0) {
      let itemStatus = "pending"
      if (selectedIds.has(item.id)) {
        itemStatus = "selected"
      } else if (item.review_status === "APPROVE_REVIEW") {
        itemStatus = "selected"
      } else if (item.review_status === "REJECT_REVIEW") {
        itemStatus = "rejected"
      }
      
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

    // Generate filename with current date
    const today = new Date()
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
    const filename = `คำร้องขอจัดซื้อ_${dateStr}.xlsx`

    // Export file
    XLSX.writeFile(workbook, filename)
  }

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
              onClick={() => {
                // เซ็ต selectedIds จาก review_status ที่มีอยู่
                const initialSelectedIds = new Set<number>()
                data.forEach((item) => {
                  if (item.review_status === "APPROVE_REVIEW") {
                    initialSelectedIds.add(item.id)
                  }
                })
                setSelectedIds(initialSelectedIds)
                setIsSelectionMode(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              เลือกคำร้องขอเอง
            </Button>
          ) : (
            <>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  try {
                    // อัพเดต review_status ในฐานข้อมูลสำหรับทุก request ที่เลือก
                    const updatePromises = data
                      .filter(item => item.request_id !== null) // เฉพาะ request ที่มี request_id จริง
                      .map(async (item) => {
                        const newReviewStatus = selectedIds.has(item.id) ? "APPROVE_REVIEW" : "PENDING_REVIEW"
                        
                        // เรียก API เฉพาะเมื่อมีการเปลี่ยนแปลง
                        if (newReviewStatus !== item.review_status) {
                          const response = await fetch('/api/edit-status-book-requests', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              requestId: item.request_id, // ใช้ request_id จริงจาก database
                              reviewStatus: newReviewStatus,
                            }),
                          })
                          
                          if (!response.ok) {
                            const errorData = await response.json()
                            throw new Error(errorData.message || `Failed to update request ${item.request_id}`)
                          }
                        }
                        
                        return newReviewStatus
                      })
                    
                    await Promise.all(updatePromises)
                    
                    // อัพเดต state หลังจากบันทึกสำเร็จ
                    setData((previous) =>
                      previous.map((item) => ({
                        ...item,
                        review_status: selectedIds.has(item.id) ? "APPROVE_REVIEW" : "PENDING_REVIEW",
                      }))
                    )
                    
                    setIsSelectionMode(false)
                    showToast('บันทึกการเลือกคำร้องขอสำเร็จ', 'success', 3000)
                  } catch (error) {
                    console.error('Error updating review status:', error)
                    showToast('เกิดข้อผิดพลาดในการบันทึก', 'error', 3000)
                  }
                }}
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

