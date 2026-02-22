import { columns, Payment } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"

async function getData(): Promise<Payment[]> {
  return []
}

export default async function QuoteRequestPage() {
  const data = await getData()

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
            <h1 className="text-xl font-bold">ส่งขอใบเสนอราคา</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">{data.length} รายการ</span>
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
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
}