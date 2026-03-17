"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, Filter } from "lucide-react"
import * as XLSX from "xlsx"
import { ApprovalHistoryItem, getColumns } from "./columns"
import { DataTable } from "./data-table"

type ApiVendorQuote = {
  quote_id?: number
  evaluation_id?: number | null
  title?: string | null
  vendor_name?: string | null
  review_status?: "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW" | null
  purchase_decision?: "APPROVE" | "REJECT" | "WAIT_FOR_APPROVAL" | null
  approval_remark?: string | null
  decided_at?: string | null
  batch_id?: number | null
  batch_start_date?: string | null
  batch_end_date?: string | null
}

type BatchGroup = {
  id: string
  batchId: number | null
  name: string
  date: string
  items: ApprovalHistoryItem[]
}

const toTextOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const formatThaiDate = (value: string | null | undefined): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

const toUnixTime = (value: string | null | undefined): number => {
  const text = toTextOrNull(value)
  if (!text) return 0
  const unixTime = new Date(text).getTime()
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

export default function ApprovalHistoryPage() {
  const [data, setData] = useState<ApprovalHistoryItem[]>([])
  const [batches, setBatches] = useState<BatchGroup[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchGroup | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    reviewStatus: [] as string[],
    purchaseDecision: [] as string[],
  })

  const filterRef = useRef<HTMLDivElement>(null)
  const batchDropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const loadApprovalHistory = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/get-all-vendor-quotes")
        const payload = await response.json()
        const apiItems: ApiVendorQuote[] = Array.isArray(payload?.data) ? payload.data : []

        const grouped = apiItems.reduce<Map<string, ApiVendorQuote[]>>((result, item) => {
          const batchId = typeof item.batch_id === "number" ? item.batch_id : null
          const batchStartDate = toTextOrNull(item.batch_start_date)
          const batchEndDate = toTextOrNull(item.batch_end_date)
          const key = `${batchId ?? "no-batch"}|${batchStartDate ?? ""}|${batchEndDate ?? ""}`
          const group = result.get(key) ?? []
          group.push(item)
          result.set(key, group)
          return result
        }, new Map())

        const sortedGroups = [...grouped.entries()].sort((a, b) => {
          const [aBatchIdRaw, aStart, aEnd] = a[0].split("|")
          const [bBatchIdRaw, bStart, bEnd] = b[0].split("|")
          const aBatchId = Number(aBatchIdRaw)
          const bBatchId = Number(bBatchIdRaw)

          if (Number.isFinite(aBatchId) && Number.isFinite(bBatchId) && aBatchId !== bBatchId) {
            return bBatchId - aBatchId
          }

          const aTime = Math.max(toUnixTime(aStart), toUnixTime(aEnd))
          const bTime = Math.max(toUnixTime(bStart), toUnixTime(bEnd))
          return bTime - aTime
        })

        const mappedBatches: BatchGroup[] = sortedGroups.map(([key, items]) => {
          const [batchIdRaw, batchStartDateRaw, batchEndDateRaw] = key.split("|")
          const batchId = Number.isFinite(Number(batchIdRaw)) ? Number(batchIdRaw) : null
          const batchStartDate = toTextOrNull(batchStartDateRaw)
          const batchEndDate = toTextOrNull(batchEndDateRaw)

          return {
            id: key,
            batchId,
            name: batchId !== null ? `Batch ${batchId}` : "Batch -",
            date: createBatchDateText(batchStartDate, batchEndDate),
            items: items.map((item) => ({
              id: item.quote_id ?? 0,
              quote_id: item.quote_id ?? 0,
              evaluation_id: item.evaluation_id ?? null,
              title: item.title ?? null,
              vendor_name: item.vendor_name ?? null,
              review_status: item.review_status ?? null,
              purchase_decision: item.purchase_decision ?? null,
              approval_remark: item.approval_remark ?? null,
              decided_at: toTextOrNull(item.decided_at),
            })),
          }
        })

        setBatches(mappedBatches)

        if (mappedBatches.length === 0) {
          setSelectedBatch(null)
          setData([])
          return
        }

        setSelectedBatch(mappedBatches[0])
        setData(mappedBatches[0].items)
      } catch (error) {
        console.error("Error loading approval history:", error)
        setBatches([])
        setSelectedBatch(null)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadApprovalHistory()
  }, [])

  const handleToggleFilter = (category: "reviewStatus" | "purchaseDecision", value: string) => {
    setFilters((prev) => {
      const currentFilters = prev[category]
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter((item) => item !== value)
        : [...currentFilters, value]
      return { ...prev, [category]: newFilters }
    })
  }

  const clearFilters = () => {
    setFilters({ reviewStatus: [], purchaseDecision: [] })
  }

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      if (filters.reviewStatus.length > 0) {
        const mappedReviewStatus = item.review_status === "APPROVE_REVIEW"
          ? "approved"
          : item.review_status === "REJECT_REVIEW"
            ? "rejected"
            : "pending"

        if (!filters.reviewStatus.includes(mappedReviewStatus)) {
          return false
        }
      }

      if (filters.purchaseDecision.length > 0) {
        const mappedDecision = item.purchase_decision === "APPROVE"
          ? "approve"
          : item.purchase_decision === "REJECT"
            ? "reject"
            : item.purchase_decision === "WAIT_FOR_APPROVAL"
              ? "waiting"
              : "none"

        if (!filters.purchaseDecision.includes(mappedDecision)) {
          return false
        }
      }

      return true
    })

    return filtered.sort((a, b) => {
      const aEvaluationId = typeof a.evaluation_id === "number" ? a.evaluation_id : Number.MAX_SAFE_INTEGER
      const bEvaluationId = typeof b.evaluation_id === "number" ? b.evaluation_id : Number.MAX_SAFE_INTEGER
      return aEvaluationId - bEvaluationId
    })
  }, [data, filters])

  const activeFilterCount = filters.reviewStatus.length + filters.purchaseDecision.length

  const columns = useMemo(() => getColumns(), [])

  const handleExport = () => {
    const exportData = filteredData.map((item, index) => ({
      "ลำดับ": index + 1,
      "Quote ID": item.quote_id,
      "Evaluation ID": item.evaluation_id ?? "-",
      "ชื่อหนังสือ": item.title ?? "-",
      "ร้านค้า": item.vendor_name ?? "-",
      "สถานะรีวิว": item.review_status ?? "-",
      "ผลอนุมัติ": item.purchase_decision ?? "-",
      "หมายเหตุ": item.approval_remark ?? "-",
      "วันที่ตัดสินใจ": item.decided_at ?? "-",
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "approval-history")

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 40 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 45 },
      { wch: 20 },
    ]

    const filename = `การอนุมัติจัดซื้อ_${selectedBatch?.name ?? "history"}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 font-semibold">ข้อมูลย้อนหลัง</span>
          <span className="text-sm text-gray-600">{selectedBatch?.date ?? "-"}</span>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">การอนุมัติจัดซื้อย้อนหลัง</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">
                {filteredData.length !== data.length
                  ? `${filteredData.length} / ${data.length} รายการ`
                  : `${data.length} รายการ`}
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-600">{selectedBatch?.name ?? "-"}</p>
        </div>

        <div className="flex gap-3">
          <div className="relative" ref={batchDropdownRef}>
            <Button
              variant="outline"
              className={`bg-white min-w-[300px] justify-between ${isBatchDropdownOpen ? "border-blue-500" : ""}`}
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
                      setData(batch.items)
                      setIsBatchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                      selectedBatch?.id === batch.id ? "bg-blue-50" : ""
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
              className={`bg-white ${isFilterOpen ? "border-blue-500" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 z-50">
                <div className="flex justify-between items-center mb-3">
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

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700">สถานะรีวิว</p>
                  <div className="space-y-2">
                    {[
                      { value: "approved", label: "เลือกแล้ว" },
                      { value: "rejected", label: "ปฏิเสธ" },
                      { value: "pending", label: "รอดำเนินการ" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.reviewStatus.includes(option.value)}
                          onChange={() => handleToggleFilter("reviewStatus", option.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700">ผลอนุมัติ</p>
                  <div className="space-y-2">
                    {[
                      { value: "approve", label: "อนุมัติ" },
                      { value: "reject", label: "ไม่อนุมัติ" },
                      { value: "waiting", label: "รออนุมัติ" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.purchaseDecision.includes(option.value)}
                          onChange={() => handleToggleFilter("purchaseDecision", option.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" className="bg-white" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} isLoading={isLoading} />
    </div>
  )
}
