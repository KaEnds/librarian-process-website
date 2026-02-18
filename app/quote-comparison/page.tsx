"use client"

import { useState } from "react"
import { getColumns, QuoteComparison } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { UploadQuotationPopup } from "@/components/UploadQuotationPopup"
import { AISelectionPopup } from "@/components/AISelectionPopup"
import { Filter, Upload, Send } from "lucide-react"

function getData(): QuoteComparison[] {
  const buildRow = (
    id: number,
    cuBook: string,
    vendorA: string,
    vendorB: string,
    aiStatus: "complete" | "processing" | "rejected",
    librarianSelection: string
  ): QuoteComparison => ({
    id,
    title: "Bold text column",
    author: "Regular text column",
    cuBook,
    vendorA,
    vendorB,
    aiStatus,
    librarianSelection,
    aiSelectionDetail: {
      quoteId: id,
      title: id === 1 ? "Harry potter" : "Bold text column",
      selectedVendor: librarianSelection === "ยังไม่ได้เลือก" ? null : librarianSelection,
      comparisonRows: [
        {
          id: 1,
          vendor: "CU BOOK",
          price: "150 บาท",
          delivery: "2-3 วัน",
          publisher: "Regular text column",
          aiDecision: "the-best",
          aiReason: "เนื่องจากมีความคุ้มค่า",
        },
        {
          id: 2,
          vendor: "Asia Books",
          price: "170 บาท",
          delivery: "4-5 วัน",
          publisher: "Regular text column",
          aiDecision: "optional",
          aiReason: "Regular text column",
        },
        {
          id: 3,
          vendor: "นายอินทร์",
          price: "160 บาท",
          delivery: "2-3 วัน",
          publisher: "Regular text column",
          aiDecision: "optional",
          aiReason: "Regular text column",
        },
        {
          id: 4,
          vendor: "SE-ED Book",
          price: "170 บาท",
          delivery: "4-5 วัน",
          publisher: "Regular text column",
          aiDecision: "optional",
          aiReason: "Regular text column",
        },
        {
          id: 5,
          vendor: "Kinokuniya",
          price: "180 บาท",
          delivery: "4-5 วัน",
          publisher: "Regular text column",
          aiDecision: "optional",
          aiReason: "Regular text column",
        },
      ],
    },
  })

  return [
    buildRow(1, "120 บาท", "150 บาท", "120 บาท", "complete", "CU BOOK"),
    buildRow(2, "170 บาท", "170 บาท", "170 บาท", "complete", "นายอินทร์"),
    buildRow(3, "Regular text column", "Regular text column", "Regular text column", "complete", "Asia Book"),
    buildRow(4, "Regular text column", "Regular text column", "Regular text column", "complete", "CU BOOK"),
    buildRow(5, "Regular text column", "Regular text column", "Regular text column", "complete", "SE-ED Book"),
    buildRow(6, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(7, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(8, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(9, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(10, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(11, "Regular text column", "Regular text column", "Regular text column", "processing", "ยังไม่ได้เลือก"),
    buildRow(12, "Regular text column", "Regular text column", "Regular text column", "rejected", "ยังไม่ได้เลือก"),
    buildRow(13, "Regular text column", "Regular text column", "Regular text column", "rejected", "ยังไม่ได้เลือก"),
    buildRow(14, "Regular text column", "Regular text column", "Regular text column", "rejected", "ยังไม่ได้เลือก"),
  ]
}

export default function QuoteComparisonPage() {
  const [data, setData] = useState<QuoteComparison[]>(getData)
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false)
  const [selectedAIQuote, setSelectedAIQuote] = useState<QuoteComparison | null>(null)
  const columns = getColumns((row) => setSelectedAIQuote(row))

  const handleSaveSelection = (quoteId: number, vendor: string) => {
    setData((previous) =>
      previous.map((item) => {
        if (item.id !== quoteId) {
          return item
        }

        return {
          ...item,
          librarianSelection: vendor,
          aiSelectionDetail: {
            ...item.aiSelectionDetail,
            selectedVendor: vendor,
          },
        }
      })
    )
    setSelectedAIQuote(null)
  }

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">6 ตุลาคม 2568 - 10 ตุลาคม 2568</span>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">เปรียบเทียบใบเสนอราคา</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">{data.length} รายการ</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ 7 ตุลาคม 2568 - 9 ตุลาคม 2568</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsUploadPopupOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4 mr-2" />
            สร้างใบอนุมัติจัดซื้อ
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} />

      <UploadQuotationPopup
        open={isUploadPopupOpen}
        onClose={() => setIsUploadPopupOpen(false)}
      />

      <AISelectionPopup
        open={!!selectedAIQuote}
        data={selectedAIQuote?.aiSelectionDetail ?? null}
        onClose={() => setSelectedAIQuote(null)}
        onSave={handleSaveSelection}
      />
    </div>
  )
}
