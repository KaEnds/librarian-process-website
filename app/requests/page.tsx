"use client"

import { useState } from "react"
import { getColumns, Request } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { RequestDetailsPopup } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailPopup } from "@/components/AIDecisionDetailPopup"
import { ConfirmRequestPopup } from "@/components/ConfirmRequestPopup"
import { Filter, Download, Plus, Send, X } from "lucide-react"

function getData(): Request[] {
  const buildRequest = (
    id: number,
    status: "approved" | "rejected",
    action: "selected" | "pending"
  ): Request => ({
    id,
    title: "Bold text column",
    author: "Regular text column",
    isbn: "Regular text column",
    publisher: "Regular text column",
    year: "Regular text column",
    status,
    action,
    details: {
      title: id === 1 ? "Harry Potter and the deathly hallows" : "Bold text column",
      author: id === 1 ? "เจ.เค. โรว์ลิง" : "Regular text column",
      isbn: id === 1 ? "9789749601648" : "Regular text column",
      year: id === 1 ? "2550" : "Regular text column",
      publisher: id === 1 ? "กรุงเทพฯ : นานมีบุ๊คส์" : "Regular text column",
      branch: "KMUTT Library",
      aiStatus: status,
      requestReason: "Personal Interest",
      detailReason: "อยากเอามาอ่านเล่นๆ ยาวๆ",
      requester: {
        name: "นายสมชาย สดชื่น",
        studentId: "65070501001",
        status: "นักศึกษา",
        faculty: "วิศวกรรมศาสตร์",
        major: "วิศวกรรมคอมพิวเตอร์",
      },
    },
    aiSelectionDetail: {
      status,
      reason:
        "หนังสือ Harry Potter ได้รับการคัดเลือกจัดซื้อเนื่องจากเป็นวรรณกรรมเยาวชนที่ได้รับความนิยมทั่วโลก มีเนื้อหาส่งเสริมจินตนาการ ความคิดสร้างสรรค์ และปลูกฝังคุณธรรม เหมาะต่อการศึกษาในด้านภาษา วรรณกรรม และการอ่านเพื่อพัฒนาทักษะของผู้ใช้งานในห้องสมุด",
      totalScore: 87,
      criteria: [
        { id: 1, title: "Bold text column", score: 7 },
        { id: 2, title: "Bold text column", score: 5 },
        { id: 3, title: "Bold text column", score: 9 },
        { id: 4, title: "Bold text column", score: 10 },
        { id: 5, title: "Bold text column", score: 8 },
        { id: 6, title: "Bold text column", score: 6 },
        { id: 7, title: "Bold text column", score: 9 },
        { id: 8, title: "Bold text column", score: 7 },
        { id: 9, title: "Bold text column", score: 8 },
        { id: 10, title: "Bold text column", score: 6 },
        { id: 11, title: "Bold text column", score: 5 },
        { id: 12, title: "Bold text column", score: 7 },
      ],
    },
  })

  return [
    buildRequest(1, "approved", "pending"),
    buildRequest(2, "approved", "pending"),
    buildRequest(3, "rejected", "pending"),
    buildRequest(4, "approved", "pending"),
    buildRequest(5, "rejected", "pending"),
    buildRequest(6, "approved", "pending"),
    buildRequest(7, "approved", "pending"),
    buildRequest(8, "rejected", "pending"),
    buildRequest(9, "approved", "pending"),
    buildRequest(10, "approved", "pending"),
    buildRequest(11, "rejected", "pending"),
    buildRequest(12, "approved", "pending"),
    buildRequest(13, "rejected", "pending"),
    buildRequest(14, "approved", "pending"),
  ]
}

export default function RequestsPage() {
  const [data, setData] = useState<Request[]>(getData)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [selectedAIRequest, setSelectedAIRequest] = useState<Request | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isNextStepPopupOpen, setIsNextStepPopupOpen] = useState(false)
  const [nextStepRequests, setNextStepRequests] = useState<Request[]>([])

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
    const selectedRequests = data.filter((item) => item.action === "selected")

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

