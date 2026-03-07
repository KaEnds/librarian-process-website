"use client"

import { useEffect, useMemo, useState } from "react"
import { columns, Payment } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import { ApiRequest, toTextOrNull } from "@/utils/utils"

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
  const [data, setData] = useState<Payment[]>([])
  const [currentBatchDateText, setCurrentBatchDateText] = useState<string>("-")

  useEffect(() => {
    let isMounted = true

    const fetchQuotationRequests = async () => {
      try {
        const processResponse = await fetch("/api/get-process-state?processId=2")
        if (!processResponse.ok) {
          return
        }

        const processPayload = await processResponse.json()
        const processStatus = toTextOrNull(processPayload?.status)

        // Only load quotation source data when process 2 is active.
        if (processStatus !== "IN_PROGRESS") {
          if (isMounted) {
            setData([])
          }
          return
        }

        const requestResponse = await fetch("/api/get-book-requests")
        if (!requestResponse.ok) {
          return
        }

        const payload = await requestResponse.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        const approvedRequests = apiRequests.filter(
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

        const mappedData: Payment[] = approvedRequests.map((item, index) => ({
          id: index + 1,
          title: toTextOrNull(item.title) ?? "-",
          author: toTextOrNull(item.authors) ?? "-",
          cuBook: "-",
          seEdBook: "-",
          vendor3: "-",
          vendor4: "-",
          vendor5: "-",
        }))

        setData(mappedData)
      } catch (error) {
        console.error("Error fetching quotation request data:", error)
      }
    }

    fetchQuotationRequests()
    const interval = setInterval(fetchQuotationRequests, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const currentDateText = useMemo(() => {
    if (currentBatchDateText !== "-") {
      return currentBatchDateText
    }

    return formatThaiDate(new Date().toISOString()) ?? "-"
  }, [currentBatchDateText])

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
              <span className="font-semibold">{data.length} รายการ</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ {currentDateText}</p>
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