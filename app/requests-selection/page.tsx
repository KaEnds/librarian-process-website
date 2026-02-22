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

export default function RequestsPage() {
  const [data, setData] = useState<Request[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<Request | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isNextStepPopupOpen, setIsNextStepPopupOpen] = useState(false)
  const [nextStepRequests, setNextStepRequests] = useState<ConfirmRequestItem[]>([])
  const latestUpdatedAtRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const syncRequests = async (incremental: boolean) => {
      try {
        const since = incremental ? latestUpdatedAtRef.current : null
        const query = since ? `?since=${encodeURIComponent(since)}` : ""
        const response = await fetch(`/api/get-book-requests${query}`)
        const payload = await response.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        if (!isMounted) {
          return
        }

        if (!apiRequests.length) {
          return
        }

        const mappedRequests = apiRequests.map(mapApiRequestToRequest)

        setData((previous) => (incremental ? mergeRequests(previous, mappedRequests) : mappedRequests))

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
  }, [])

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

  const handleSubmitToNextStep = () => {
    const selectedRequests: ConfirmRequestItem[] = buildConfirmRequestItems(data)

    setNextStepRequests(selectedRequests)
    setIsNextStepPopupOpen(true)
  }

  const handleConfirmNextStep = () => {
    console.log("Selected requests:", nextStepRequests)
    setIsNextStepPopupOpen(false)
  }

  const columns = getColumns(
    isSelectionMode,
    handleSelectionChange,
    (request) => setSelectedRequest(request),
    (request) => setSelectedAIRequest(request)
  )

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      {/* Header Section */}
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">6 ตุลาคม 2568 - 10 ตุลาคม 2568</span>
        </div>
      </div>

      {/* Title, Stats and Action Buttons */}
      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">คำร้องขอจัดซื้อ</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">20 รายการ</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ 6 ตุลาคม 2568</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {!isSelectionMode ? (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsSelectionMode(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              เลือกคำร้องขอเอง
            </Button>
          ) : (
            <>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setData((previous) =>
                    previous.map((item) => ({
                      ...item,
                      action: selectedIds.has(item.id) ? "selected" : "pending",
                    }))
                  )
                  setIsSelectionMode(false)
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
      <DataTable columns={columns} data={data} />

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

