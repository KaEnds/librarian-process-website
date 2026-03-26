"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getColumns, QuoteComparison } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { AISelectionPopup } from "@/components/AISelectionPopup"
import { useToast } from "@/components/Toast"
import { updateMultipleProcessStates, updateVendorQuoteNetPrice } from "@/utils/api"
import { Filter, Upload, Send, Pencil, Check, X, Play } from "lucide-react"

const DRIVE_UPLOAD_FOLDER_URL = "https://drive.google.com/drive/folders/1tdvwEOaeasFDPg8PI2NY3rU5mVywoKsa"

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

// Normalize vendor names to merge similar ones (e.g., "Booknet Co., Ltd." and "Booknet Co. Ltd.")
const normalizeVendorName = (name: string): string => {
  if (!name) return ""
  return name
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/,\s*Ltd\.?(?=\s|$)/gi, " Ltd") // Normalize ", Ltd." or ", Ltd" to " Ltd"
    .replace(/\s+Ltd\s*\.?\s*$/gi, " Ltd") // Normalize ending variations
    .toLowerCase()
}

// Get the best display name for a normalized vendor
const getDisplayVendorName = (vendorNames: string[], normalizedName: string): string => {
  const matching = vendorNames.find(name => normalizeVendorName(name) === normalizedName)
  return matching || normalizedName
}

export default function QuoteComparisonPage() {
  const router = useRouter()
  const [data, setData] = useState<QuoteComparison[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isTriggeringVendorSelection, setIsTriggeringVendorSelection] = useState(false)
  const [processStatus, setProcessStatus] = useState<string | null>(null)
  const [draftData, setDraftData] = useState<QuoteComparison[] | null>(null)
  const [editableVendorMap, setEditableVendorMap] = useState<Record<string, boolean>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedAIQuote, setSelectedAIQuote] = useState<QuoteComparison | null>(null)
  const [vendorNames, setVendorNames] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    vendorStatus: [] as string[],
    selectionStatus: [] as string[],
  })
  const filterRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const getEditableKey = (itemId: number, vendorName: string) => `${itemId}::${vendorName}`

  const parseEditablePrice = (value: string): string => {
    if (!value || value === "-") return ""
    return value.replace(/[^\d.]/g, "")
  }

  const formatPriceValue = (value: string): string => {
    const numberValue = Number.parseFloat(value)
    if (Number.isNaN(numberValue)) return "-"
    return `${numberValue.toFixed(2)} บาท`
  }

  const handleOpenAISelection = useCallback((row: QuoteComparison) => {
    setSelectedAIQuote(row)
  }, [])

  const handleVendorPriceChange = useCallback((itemId: number, vendorName: string, value: string) => {
    if (!editableVendorMap[getEditableKey(itemId, vendorName)]) {
      return
    }

    const sanitized = value.replace(/[^\d.]/g, "")
    setDraftData((previous) => {
      if (!previous) return previous

      return previous.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          vendors: {
            ...item.vendors,
            [vendorName]: sanitized,
          },
        }
      })
    })
  }, [editableVendorMap])

  const columns = useMemo(
    () => getColumns(
      handleOpenAISelection,
      vendorNames,
      isEditMode,
      handleVendorPriceChange,
      (itemId, vendorName) => Boolean(editableVendorMap[getEditableKey(itemId, vendorName)]),
      processStatus === "DONE" || processStatus === "PENDING",
    ),
    [handleOpenAISelection, vendorNames, isEditMode, handleVendorPriceChange, editableVendorMap, processStatus],
  )

  useEffect(() => {
    const fetchVendorQuotes = async () => {
      setIsFetchingData(true)

      try {
        const processResponse = await fetch('/api/get-process-state?processId=3')
        if (processResponse.ok) {
          const processPayload = await processResponse.json()
          setProcessStatus(processPayload?.status ?? null)
        }

        const response = await fetch('/api/get-all-vendor-quotes-by-batches')
        const result = await response.json()
        console.log('Vendor Quotes:', result.data)
        
        // Extract unique vendor names (normalized to merge similar ones)
        const allVendorNames = result.data.map((item: any) => item.vendor_name).filter(Boolean)
        const normalizedToOriginal = new Map<string, string>()
        
        allVendorNames.forEach((name: string) => {
          const normalized = normalizeVendorName(name)
          if (!normalizedToOriginal.has(normalized)) {
            normalizedToOriginal.set(normalized, name)
          }
        })
        
        const uniqueVendors = Array.from(normalizedToOriginal.values())
        console.log('Unique Vendor Names:', uniqueVendors)
        setVendorNames(uniqueVendors)

        // Group data by title to handle cases where evaluation_id is null
        const groupedByTitle = result.data.reduce((acc: any, item: any) => {
          const title = item.title || "N/A"
          if (!acc[title]) {
            acc[title] = []
          }
          acc[title].push(item)
          return acc
        }, {})

        // Transform to QuoteComparison format
        const transformedData: QuoteComparison[] = Object.entries(groupedByTitle).map(
          ([title, items]: [string, any], index: number) => {
            const firstItem = items[0]
            
            // Generate ID: Use evaluation_id if available, otherwise use the first quote_id or generate index-based ID
            const generatedId = firstItem.evaluation_id 
              ? parseInt(firstItem.evaluation_id) 
              : firstItem.quote_id || (index + 1)
            
            // Format batch dates
            const batchStartDateTh = formatThaiDate(firstItem.batch_start_date)
            const batchEndDateTh = formatThaiDate(firstItem.batch_end_date)
            
            // Create vendors object with prices - only include vendors that have quotes for this title
            const vendors: Record<string, string> = {}
            items.forEach((item: any) => {
              if (item.vendor_name && item.net_price) {
                const displayName = getDisplayVendorName(uniqueVendors, normalizeVendorName(item.vendor_name))
                vendors[displayName] = `${parseFloat(item.net_price).toFixed(2)} บาท`
              }
            })

            // Group items by vendor_name to collect all quote_ids for duplicates
            const vendorGroups = items.reduce((acc: any, item: any) => {
              const key = `${item.vendor_name}-${item.net_price}`
              if (!acc[key]) {
                acc[key] = {
                  ...item,
                  quoteIds: [item.quote_id]
                }
              } else {
                acc[key].quoteIds.push(item.quote_id)
              }
              return acc
            }, {})

            const uniqueItems = Object.values(vendorGroups)

            // Find approved vendor for librarian selection
            const approvedVendor = uniqueItems.find((item: any) => item.review_status === 'APPROVE_REVIEW') as any
            const approvedVendorDisplayName = approvedVendor 
              ? getDisplayVendorName(uniqueVendors, normalizeVendorName(approvedVendor.vendor_name))
              : null
            const librarianSelection = approvedVendorDisplayName || "ยังไม่ได้เลือก"

            const decisionReason = firstItem.decision_reason
            const isAIComplete = decisionReason != null && String(decisionReason).trim() !== ""

            return {
              id: generatedId,
              title: firstItem.title || "N/A",
              author: firstItem.authors || "N/A",
              vendors,
              aiStatus: (isAIComplete ? "complete" : "processing") as QuoteComparison["aiStatus"],
              librarianSelection,
              batch_start_date: firstItem.batch_start_date || null,
              batch_end_date: firstItem.batch_end_date || null,
              batch_start_date_th: batchStartDateTh,
              batch_end_date_th: batchEndDateTh,
              aiSelectionDetail: {
                quoteId: generatedId,
                title: firstItem.title || "N/A",
                selectedVendor: approvedVendorDisplayName,
                comparisonRows: uniqueItems.map((item: any, index: number) => ({
                  id: index + 1,
                  quoteId: item.quote_id,
                  quoteIds: item.quoteIds || [item.quote_id],  // All quote IDs for this vendor
                  vendor: getDisplayVendorName(uniqueVendors, normalizeVendorName(item.vendor_name || "")) || "N/A",
                  unitPrice: item.unit_price ? `${parseFloat(item.unit_price).toFixed(2)} บาท` : "-",
                  discountValue: item.discount_value ? `${parseFloat(item.discount_value).toFixed(2)}` : "-",
                  netPrice: item.net_price ? `${parseFloat(item.net_price).toFixed(2)} บาท` : "-",
                  quantity: item.quantity ? String(item.quantity) : "-",
                  delivery: item.estimated_delivery_day || "N/A",
                  aiDecision: item.is_best_option ? "the-best" : "optional",
                  aiReason: item.is_best_option ? "คัดเลือกโดย AI" : "ตัวเลือกอื่น",
                  reviewStatus: item.review_status,
                })),
              },
            }
          }
        )

        console.log('Transformed Data:', transformedData)
        setData(transformedData)
      } catch (error) {
        console.error('Error fetching vendor quotes:', error)
      } finally {
        setIsFetchingData(false)
      }
    }

    fetchVendorQuotes()
  }, [])

  const handleSaveSelection = async (quoteId: number, vendor: string) => {
    try {
      const allRows = selectedAIQuote?.aiSelectionDetail.comparisonRows || []
      
      // Find the selected vendor row with all quote IDs
      const selectedRow = allRows.find((row) => row.vendor === vendor)
      const selectedQuoteIds = selectedRow?.quoteIds || []

      // Find all other vendor rows (not selected)
      const otherRows = allRows.filter((row) => row.vendor !== vendor)
      const otherQuoteIds = otherRows.flatMap((row) => row.quoteIds || [])

      // Update selected vendor to APPROVE_REVIEW
      if (selectedQuoteIds.length > 0) {
        const approveResponse = await fetch('/api/update-quote-comparison-review-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteIds: selectedQuoteIds,
            reviewStatus: 'APPROVE_REVIEW',
          }),
        })

        if (!approveResponse.ok) {
          throw new Error('Failed to approve selected vendor')
        }

        console.log(`Approved ${selectedQuoteIds.length} quote(s) for vendor: ${vendor}`)
      }

      // Update other vendors to PENDING_REVIEW
      if (otherQuoteIds.length > 0) {
        const pendingResponse = await fetch('/api/update-quote-comparison-review-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteIds: otherQuoteIds,
            reviewStatus: 'PENDING_REVIEW',
          }),
        })

        if (!pendingResponse.ok) {
          throw new Error('Failed to set other vendors to pending')
        }

        console.log(`Set ${otherQuoteIds.length} quote(s) to PENDING_REVIEW for other vendors`)
      }

      // Update local state
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
              comparisonRows: item.aiSelectionDetail.comparisonRows.map((row) => ({
                ...row,
                reviewStatus: row.vendor === vendor ? "APPROVE_REVIEW" : "PENDING_REVIEW",
              })),
            },
          }
        })
      )
      setSelectedAIQuote(null)
      
      // Show success toast
      showToast(`บันทึกการเลือกร้านค้า "${vendor}" สำเร็จ`, 'success')
    } catch (error) {
      console.error('Error saving selection:', error)
      showToast('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', 'error')
    }
  }

  const handleOpenUploadDrive = () => {
    const newTab = window.open(DRIVE_UPLOAD_FOLDER_URL, "_blank", "noopener,noreferrer")
    if (!newTab) {
      showToast("เบราว์เซอร์บล็อกการเปิดแท็บใหม่ กรุณาอนุญาต pop-up", "info")
    }
  }

  const handleExtractWorkflow = async () => {
    if (isPageActionDisabled || isExtracting) {
      return
    }

    try {
      setIsExtracting(true)
      const response = await fetch("/api/trigger-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "quote-comparison",
          triggeredAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to trigger extract workflow")
      }

      showToast("ส่งคำสั่ง Extract ไปยัง workflow แล้ว", "success")
    } catch (error) {
      console.error("Error triggering extract workflow:", error)
      showToast("เกิดข้อผิดพลาดในการ trigger workflow", "error")
    } finally {
      setIsExtracting(false)
    }
  }

  const handleTriggerVendorSelectionWorkflow = async () => {
    if (isPageActionDisabled || isTriggeringVendorSelection) {
      return
    }

    try {
      setIsTriggeringVendorSelection(true)
      const response = await fetch("/api/trigger-vendor-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "quote-comparison",
          triggeredAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to trigger vendor selection workflow")
      }

      showToast("ส่งคำสั่ง Vendor selection ไปยัง workflow แล้ว", "success")
    } catch (error) {
      console.error("Error triggering vendor selection workflow:", error)
      showToast("เกิดข้อผิดพลาดในการ trigger Vendor selection", "error")
    } finally {
      setIsTriggeringVendorSelection(false)
    }
  }

  const handleToggleFilter = (category: 'vendorStatus' | 'selectionStatus', value: string) => {
    setFilters(prev => {
      const current = prev[category]
      const next = current.includes(value)
        ? current.filter(f => f !== value)
        : [...current, value]
      return { ...prev, [category]: next }
    })
  }

  const clearFilters = () => {
    setFilters({ vendorStatus: [], selectionStatus: [] })
  }

  const handleCreateApprovalDocument = async () => {
    const isConfirmed = window.confirm("ยืนยันการเปลี่ยนสถานะเพื่อสร้างใบอนุมัติจัดซื้อใช่หรือไม่?")
    if (!isConfirmed) {
      return
    }

    try {
      const pendingQuoteIds = Array.from(new Set(
        data.flatMap((item) =>
          item.aiSelectionDetail.comparisonRows.flatMap((row) => {
            if (row.reviewStatus !== "PENDING_REVIEW") {
              return [] as number[]
            }

            if (Array.isArray(row.quoteIds) && row.quoteIds.length > 0) {
              return row.quoteIds
            }

            return typeof row.quoteId === "number" ? [row.quoteId] : []
          })
        )
      ))

      if (pendingQuoteIds.length > 0) {
        const rejectPendingResponse = await fetch('/api/update-quote-comparison-review-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteIds: pendingQuoteIds,
            reviewStatus: 'REJECT_REVIEW',
          }),
        })

        if (!rejectPendingResponse.ok) {
          throw new Error('Failed to reject pending vendor quotes')
        }
      }

      await updateMultipleProcessStates([
        { processId: 3, status: "DONE" },
        { processId: 4, status: "IN_PROGRESS" },
      ])

      router.push("/approve")
    } catch (error) {
      console.error("Error updating process states before navigation:", error)
      showToast("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ workflow", "error")
    }
  }

  const handleStartEdit = () => {
    const nextEditableMap: Record<string, boolean> = {}

    setDraftData(
      data.map((item) => ({
        ...item,
        vendors: Object.fromEntries(
          Object.entries(item.vendors).map(([vendorName, vendorPrice]) => {
            nextEditableMap[getEditableKey(item.id, vendorName)] = vendorPrice !== "-"
            return [vendorName, parseEditablePrice(vendorPrice)]
          }),
        ),
      })),
    )
    setEditableVendorMap(nextEditableMap)
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setDraftData(null)
    setEditableVendorMap({})
    setIsEditMode(false)
  }

  const handleConfirmEdit = async () => {
    if (!draftData) return

    const hasInvalidValue = draftData.some((item) =>
      Object.values(item.vendors).some((value) => {
        if (value === "") return false
        const parsed = Number.parseFloat(value)
        return Number.isNaN(parsed)
      }),
    )

    if (hasInvalidValue) {
      showToast("พบราคาที่ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง", "error")
      return
    }

    const changedEntries = draftData.flatMap((draftItem) => {
      const originalItem = data.find((item) => item.id === draftItem.id)
      if (!originalItem) return [] as Array<{ evaluationId: number; vendorName: string; netPrice: number }>

      return Object.entries(draftItem.vendors).flatMap(([vendorName, vendorPrice]) => {
        const originalPrice = parseEditablePrice(originalItem.vendors[vendorName] || "")
        const canEdit = editableVendorMap[getEditableKey(draftItem.id, vendorName)]

        if (!canEdit || vendorPrice === "" || vendorPrice === originalPrice) {
          return []
        }

        return [{
          evaluationId: draftItem.id,
          vendorName,
          netPrice: Number.parseFloat(vendorPrice),
        }]
      })
    })

    try {
      await Promise.all(
        changedEntries.map(({ evaluationId, vendorName, netPrice }) =>
          updateVendorQuoteNetPrice(evaluationId, vendorName, netPrice),
        ),
      )
    } catch (error) {
      console.error("Error updating vendor quote prices:", error)
      showToast("เกิดข้อผิดพลาดในการบันทึกราคา กรุณาลองใหม่อีกครั้ง", "error")
      return
    }

    const normalizedData = draftData.map((item) => {
      const normalizedVendors = Object.fromEntries(
        Object.entries(item.vendors).map(([vendorName, vendorPrice]) => [
          vendorName,
          vendorPrice === "" ? "-" : formatPriceValue(vendorPrice),
        ]),
      )

      const normalizedRows = item.aiSelectionDetail.comparisonRows.map((comparisonRow) => {
        const editablePrice = item.vendors[comparisonRow.vendor]
        if (!editablePrice || editablePrice === "") {
          return {
            ...comparisonRow,
            unitPrice: "-",
          }
        }

        return {
          ...comparisonRow,
          unitPrice: formatPriceValue(editablePrice),
        }
      })

      return {
        ...item,
        vendors: normalizedVendors,
        aiSelectionDetail: {
          ...item.aiSelectionDetail,
          comparisonRows: normalizedRows,
        },
      }
    })

    setData(normalizedData)
    setDraftData(null)
    setEditableVendorMap({})
    setIsEditMode(false)
    showToast("ยืนยันการแก้ไขราคาเรียบร้อย", "success")
  }

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [isFilterOpen])

  const filteredData = useMemo(() => {
    const sourceData = isEditMode && draftData ? draftData : data
    let result = [...sourceData]

    if (filters.vendorStatus.length > 0) {
      result = result.filter(item =>
        filters.vendorStatus.some(vendor =>
          item.vendors[vendor] && item.vendors[vendor] !== "-"
        )
      )
    }

    if (filters.selectionStatus.length > 0) {
      result = result.filter(item => {
        const isSelected = item.librarianSelection !== "ยังไม่ได้เลือก"
        if (filters.selectionStatus.includes("selected") && !isSelected) return false
        if (filters.selectionStatus.includes("unselected") && isSelected) return false
        return true
      })
    }

    return result
  }, [data, draftData, isEditMode, filters])

  const activeFilterCount = useMemo(() => {
    return filters.vendorStatus.length + filters.selectionStatus.length
  }, [filters])

  const visibleData = useMemo(() => {
    if (processStatus === "PENDING") {
      return []
    }
    return filteredData
  }, [filteredData, processStatus])

  const visibleTotalCount = processStatus === "PENDING" ? 0 : data.length

  const isPageActionDisabled = isFetchingData || processStatus === "DONE" || processStatus === "PENDING"

  // Get batch date range from first item
  const batchDateRange = data.length > 0 
    ? (() => {
        const firstItem = data[0]
        if (firstItem.batch_start_date_th && firstItem.batch_end_date_th) {
          return `${firstItem.batch_start_date_th} - ${firstItem.batch_end_date_th}`
        }
        return null
      })()
    : null

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">{batchDateRange || "ยังไม่มีข้อมูล"}</span>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-4 flex items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">เปรียบเทียบใบเสนอราคา</h1>
            <span className="text-blue-600 text-sm">
              <span className="font-semibold">
                {visibleData.length !== visibleTotalCount
                  ? `${visibleData.length} / ${visibleTotalCount} รายการ`
                  : `${visibleTotalCount} รายการ`}
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-600">ประจำวันที่ {batchDateRange || "ยังไม่มีข้อมูล"}</p>
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

            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 z-50">
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

                {/* Vendor Filter */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700">ร้านค้า</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {vendorNames.map((vendor) => (
                      <label key={vendor} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.vendorStatus.includes(vendor)}
                          onChange={() => handleToggleFilter("vendorStatus", vendor)}
                          className="rounded"
                        />
                        <span className="text-sm truncate">{vendor}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Selection Status Filter */}
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700">สถานะการเลือก</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.selectionStatus.includes("selected")}
                        onChange={() => handleToggleFilter("selectionStatus", "selected")}
                        className="rounded"
                      />
                      <span className="text-sm">เลือกแล้ว</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.selectionStatus.includes("unselected")}
                        onChange={() => handleToggleFilter("selectionStatus", "unselected")}
                        className="rounded"
                      />
                      <span className="text-sm">ยังไม่ได้เลือก</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isEditMode ? (
            <Button variant="outline" className="bg-white" onClick={handleStartEdit} disabled={isPageActionDisabled}>
              <Pencil className="w-4 h-4 mr-2" />
              แก้ไขข้อมูล
            </Button>
          ) : (
            <>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfirmEdit} disabled={isPageActionDisabled}>
                <Check className="w-4 h-4 mr-2" />
                ยืนยันการแก้ไข
              </Button>
              <Button variant="outline" className="bg-white" onClick={handleCancelEdit} disabled={isPageActionDisabled}>
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
            </>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-200"
            onClick={handleOpenUploadDrive}
            disabled={isPageActionDisabled}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-200"
            onClick={handleExtractWorkflow}
            disabled={isPageActionDisabled || isExtracting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isExtracting ? "Extracting..." : "Extract"}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-200"
            onClick={handleTriggerVendorSelectionWorkflow}
            disabled={isPageActionDisabled || isTriggeringVendorSelection}
          >
            <Play className="w-4 h-4 mr-2" />
            {isTriggeringVendorSelection ? "Triggering..." : "Vendor Selection"}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-200"
            onClick={handleCreateApprovalDocument}
            disabled={isPageActionDisabled}
          >
            <Send className="w-4 h-4 mr-2" />
            สร้างใบอนุมัติจัดซื้อ
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={visibleData} />

      <AISelectionPopup
        open={!!selectedAIQuote}
        data={selectedAIQuote?.aiSelectionDetail ?? null}
        onClose={() => setSelectedAIQuote(null)}
        onSave={handleSaveSelection}
        isReadOnly={isPageActionDisabled}
      />
    </div>
  )
}
