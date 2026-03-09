"use client"

import { useState, useEffect } from "react"
import { getColumns, QuoteComparison } from "./columns"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { UploadQuotationPopup } from "@/components/UploadQuotationPopup"
import { AISelectionPopup } from "@/components/AISelectionPopup"
import { useToast } from "@/components/Toast"
import { Filter, Upload, Send } from "lucide-react"

export default function QuoteComparisonPage() {
  const [data, setData] = useState<QuoteComparison[]>([])
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false)
  const [selectedAIQuote, setSelectedAIQuote] = useState<QuoteComparison | null>(null)
  const [vendorNames, setVendorNames] = useState<string[]>([])
  const { showToast } = useToast()
  const columns = getColumns((row) => setSelectedAIQuote(row), vendorNames)

  useEffect(() => {
    const fetchVendorQuotes = async () => {
      try {
        const response = await fetch('/api/get-vendor-quote')
        const result = await response.json()
        console.log('Vendor Quotes:', result.data)
        
        // Extract unique vendor names
        const uniqueVendors = Array.from(
          new Set(result.data.map((item: any) => item.vendor_name).filter(Boolean))
        ) as string[]
        console.log('Unique Vendor Names:', uniqueVendors)
        setVendorNames(uniqueVendors)

        // Group data by evaluation_id
        const groupedByEvaluation = result.data.reduce((acc: any, item: any) => {
          const evalId = item.evaluation_id
          if (!acc[evalId]) {
            acc[evalId] = []
          }
          acc[evalId].push(item)
          return acc
        }, {})

        // Transform to QuoteComparison format
        const transformedData: QuoteComparison[] = Object.entries(groupedByEvaluation).map(
          ([evalId, items]: [string, any]) => {
            const firstItem = items[0]
            
            // Create vendors object with prices
            const vendors: Record<string, string> = {}
            uniqueVendors.forEach((vendorName) => {
              const vendorItem = items.find((i: any) => i.vendor_name === vendorName)
              if (vendorItem && vendorItem.net_price) {
                vendors[vendorName] = `${parseFloat(vendorItem.net_price).toFixed(2)} บาท`
              } else {
                vendors[vendorName] = "-"
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
            const librarianSelection = approvedVendor ? approvedVendor.vendor_name : "ยังไม่ได้เลือก"

            return {
              id: parseInt(evalId),
              title: firstItem.title || "N/A",
              author: firstItem.authors || "N/A",
              vendors,
              aiStatus: "processing" as const,
              librarianSelection,
              aiSelectionDetail: {
                quoteId: parseInt(evalId),
                title: firstItem.title || "N/A",
                selectedVendor: approvedVendor ? approvedVendor.vendor_name : null,
                comparisonRows: uniqueItems.map((item: any, index: number) => ({
                  id: index + 1,
                  quoteId: item.quote_id,
                  quoteIds: item.quoteIds || [item.quote_id],  // All quote IDs for this vendor
                  vendor: item.vendor_name || "N/A",
                  price: item.net_price ? `${parseFloat(item.net_price).toFixed(2)} บาท` : "-",
                  delivery: item.estimated_delivery_day || "N/A",
                  publisher: "N/A",
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

  const handleUploadFiles = (files: File[]) => {
    console.log("Files uploaded to Google Drive:", files)
    // You can add additional logic here after files are uploaded
    // For example, refresh data, show toast notification, etc.
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
        onUpload={handleUploadFiles}
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
