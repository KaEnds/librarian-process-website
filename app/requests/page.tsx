"use client"

import { useState } from "react"
import { getColumns, Request } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Filter, Download, Plus, Send, X } from "lucide-react"

function getData(): Request[] {
  // Fetch data from your API here.
  return [
    {
      id: 1,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 2,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 3,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "rejected",
      action: "pending",
    },
    {
      id: 4,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 5,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "rejected",
      action: "pending",
    },
    {
      id: 6,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 7,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 8,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "rejected",
      action: "pending",
    },
    {
      id: 9,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 10,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 11,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "rejected",
      action: "pending",
    },
    {
      id: 12,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
    {
      id: 13,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "rejected",
      action: "selected",
    },
    {
      id: 14,
      title: "Bold text column",
      author: "Regular text column",
      isbn: "Regular text column",
      publisher: "Regular text column",
      year: "Regular text column",
      status: "approved",
      action: "selected",
    },
  ]
}

export default function RequestsPage() {
  const data = getData()
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const columns = getColumns(isSelectionMode)

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
                  console.log("บันทึกการเลือก")
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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4 mr-2" />
            ส่งคำร้องขอไปยังขั้นตอนถัดไป
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable columns={columns} data={data} />
    </div>
  )
}

