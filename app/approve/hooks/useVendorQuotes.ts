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

  // Normalize vendor names to merge similar ones
  const normalizeVendorName = (name: string): string => {
    if (!name) return ""
    return name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/,\s*Ltd\.?(?=\s|$)/gi, " Ltd")
      .replace(/\s+Ltd\s*\.?\s*$/gi, " Ltd")
      .toLowerCase()
  }

  // Get the best display name for a normalized vendor
  const getDisplayVendorName = (vendorNames: string[], normalizedName: string): string => {
    const matching = vendorNames.find(name => normalizeVendorName(name) === normalizedName)
    return matching || normalizedName
  }

  const buildBatchDateText = (allOriginalData: any[], items: VendorQuoteItem[]): string | null => {
    if (items.length === 0 || allOriginalData.length === 0) return null
    const firstItem = allOriginalData[0]
    const startDate = formatThaiDate(firstItem.batch_start_date)
    const endDate = formatThaiDate(firstItem.batch_end_date)
    if (startDate && endDate) {
      return `${startDate} - ${endDate}`
    }
    return null
  }

  const fetchVendorQuotes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/get-all-vendor-quotes-by-batches")
      
      if (!response.ok) {
        throw new Error("Failed to fetch vendor quotes")
      }

      const result = await response.json()
      const originalData = result.data as any[]
      
      // Filter for unique quote_ids
      const uniqueItems = originalData.filter(
        (item, index, self) => index === self.findIndex((t) => t.quote_id === item.quote_id)
      )
      
      // Filter for approved items
      const approvedItems = uniqueItems.filter(
        (item) => item.review_status === "APPROVE_REVIEW"
      )
      
      // Group by title to handle cases where evaluation_id is null
      // This ensures each unique book (title) appears only once even if multiple vendors approved it
      const titleGroups = approvedItems.reduce((acc: any, item: any) => {
        const title = item.title || "N/A"
        if (!acc[title]) {
          acc[title] = item // Keep the first approved item per title
        }
        return acc
      }, {})
      
      // Build normalized to original vendor name mapping
      const allApprovedVendorNames = approvedItems.map(item => item.vendor_name).filter(Boolean)
      const normalizedToOriginal = new Map<string, string>()
      allApprovedVendorNames.forEach(name => {
        const normalized = normalizeVendorName(name)
        if (!normalizedToOriginal.has(normalized)) {
          normalizedToOriginal.set(normalized, name)
        }
      })
      const displayVendorNames = Array.from(normalizedToOriginal.values())
      
      const transformedData: VendorQuoteItem[] = Object.values(titleGroups).map((item: any) => {
        const displayName = getDisplayVendorName(displayVendorNames, normalizeVendorName(item.vendor_name || ""))
        return {
          id: item.quote_id || 0,
          quote_id: item.quote_id || 0,
          evaluation_id: item.evaluation_id || item.quote_id || 0,
          title: item.title || "",
          quantity: item.quantity || 0,
          unit: item.unit || item.category || "",
          unit_price: item.unit_price ?? "",
          total_price: item.total_price ?? "",
          net_price: item.net_price ?? "",
          vendor_name: displayName,
          net_score: item.net_score,
          passed_selection: item.passed_selection,
          review_status: item.review_status,
          batch_id: item.batch_id,
          batch_status: item.batch_status,
        }
      })

      console.log("Raw Vendor Quote Data:", result.data)
      console.log("Transformed Vendor Quote Data:", transformedData)

      setData(transformedData)
      
      const batchDateText = buildBatchDateText(originalData, transformedData)
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
