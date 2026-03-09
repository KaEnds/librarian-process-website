import { useEffect, useRef, useState } from "react"
import { VendorQuoteItem } from "../columns"

interface UseVendorQuotesOptions {
  onBatchDateText?: (text: string) => void
  onError?: (error: string) => void
}

export const useVendorQuotes = (options: UseVendorQuotesOptions = {}) => {
  const [data, setData] = useState<VendorQuoteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasInitialized = useRef(false)

  const formatThaiDate = (value: string | null | undefined): string | null => {
    if (!value) return null
    try {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return null
      return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
    } catch {
      return null
    }
  }

  const buildBatchDateText = (items: VendorQuoteItem[]): string | null => {
    if (items.length === 0) return null
    const firstItem = items[0]
    const startDate = formatThaiDate(firstItem.batch_status)
    const endDate = formatThaiDate(firstItem.batch_status)
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`
    }
    return null
  }

  const fetchVendorQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/get-vendor-quote")
      
      if (!response.ok) {
        throw new Error("Failed to fetch vendor quotes")
      }

      const result = await response.json()
      const transformedData: VendorQuoteItem[] = result.data.map((item: any, index: number) => ({
        id: index,
        quote_id: item.quote_id || 0,
        evaluation_id: item.evaluation_id || 0,
        title: item.title || "",
        quantity: item.quantity || 0,
        unit: item.unit || item.category || "",
        unit_price: item.unit_price || "0",
        total_price: item.total_price || "0",
        vendor_name: item.vendor_name || "",
        net_score: item.net_score,
        passed_selection: item.passed_selection,
        review_status: item.review_status,
        batch_id: item.batch_id,
        batch_status: item.batch_status,
      }))

      setData(transformedData)
      
      const batchDateText = buildBatchDateText(transformedData)
      if (batchDateText && options.onBatchDateText) {
        options.onBatchDateText(batchDateText)
      }
    } catch (error: any) {
      console.error("Error fetching vendor quotes:", error)
      if (options.onError) {
        options.onError(error.message || "Failed to fetch vendor quotes")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      fetchVendorQuotes()
    }
  }, [])

  return { data, setData, isLoading, refetch: fetchVendorQuotes }
}
