import { useEffect, useRef, useState } from "react"
import { Request } from "../columns"
import { 
  ApiRequest, 
  getRequestUpdatedAt, 
  mapApiRequestToRequest, 
  mergeRequests, 
  toTextOrNull 
} from "@/utils/utils"
import { addRequestNotifications } from "@/lib/request-notifications"

interface UseBookRequestsOptions {
  onNewRequests?: (count: number) => void
  onBatchDateText?: (text: string) => void
}

export const useBookRequests = (options: UseBookRequestsOptions = {}) => {
  const [data, setData] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const latestUpdatedAtRef = useRef<string | null>(null)
  const previousCountRef = useRef<number>(0)

  const getRequestedAtFromApi = (item: ApiRequest): string | null => {
    const normalized = item as ApiRequest & {
      requested_at?: string | null
      book_request_requested_at?: string | null
    }
    return toTextOrNull(normalized.book_request_requested_at ?? normalized.requested_at ?? null)
  }

  const formatThaiDate = (value: string | null | undefined): string | null => {
    const textValue = toTextOrNull(value)
    if (!textValue) return null

    const date = new Date(textValue)
    if (Number.isNaN(date.getTime())) return null

    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  const buildBatchDateText = (item: ApiRequest): string | null => {
    const startDate = formatThaiDate(item.batch_start_date)
    const endDate = formatThaiDate(item.batch_end_date)

    if (startDate && endDate) {
      return `${startDate} - ${endDate}`
    }
    return startDate ?? endDate
  }

  useEffect(() => {
    let isMounted = true

    const syncRequests = async (incremental: boolean) => {
      if (!incremental) {
        setIsLoading(true)
      }

      try {
        const since = incremental ? latestUpdatedAtRef.current : null
        const query = since ? `?since=${encodeURIComponent(since)}` : ""
        const response = await fetch(`/api/get-book-requests${query}`)
        const payload = await response.json()
        const apiRequests: ApiRequest[] = Array.isArray(payload?.data) ? payload.data : []

        console.log(payload)

        if (!isMounted) return

        // Get batch date text
        const batchDateText = apiRequests.reduce<string | null>((current, item) => {
          if (current) return current
          return buildBatchDateText(item)
        }, null)

        if (batchDateText && options.onBatchDateText) {
          options.onBatchDateText(batchDateText)
        }

        if (!apiRequests.length) return

        const mappedRequests = apiRequests.map(mapApiRequestToRequest)

        setData((previous) => {
          const merged = incremental ? mergeRequests(previous, mappedRequests) : mappedRequests
          
          const sorted = merged.sort((a, b) => {
            const dateA = a.requested_at ? new Date(a.requested_at).getTime() : 0
            const dateB = b.requested_at ? new Date(b.requested_at).getTime() : 0
            return dateB - dateA
          })
          
          // Handle new requests notifications
          if (incremental && previousCountRef.current > 0) {
            const previousIds = new Set(previous.map((item) => item.id))
            const newRequests = mappedRequests.filter((item) => !previousIds.has(item.id))
            const newCount = newRequests.length

            if (newCount > 0) {
              const requestIds = new Set(newRequests.map((item) => item.request_id).filter((value): value is number => typeof value === "number"))
              const topMenuNotifications = apiRequests
                .filter((item) => {
                  const requestId = typeof item.request_id === "number" ? item.request_id : null
                  return requestId !== null && requestIds.has(requestId)
                })
                .map((item) => ({
                  requestId: item.request_id as number,
                  title: toTextOrNull(item.title) ?? null,
                  requestedAt: getRequestedAtFromApi(item),
                }))

              addRequestNotifications(topMenuNotifications)
              
              if (options.onNewRequests) {
                options.onNewRequests(newCount)
              }
            }
          }
          
          previousCountRef.current = sorted.length
          return sorted
        })

        // Update latest timestamp
        const latestFromBatch = apiRequests.reduce<string | null>((latest, item) => {
          const updatedAt = toTextOrNull(getRequestUpdatedAt(item))
          if (!updatedAt) return latest
          if (!latest) return updatedAt
          return new Date(updatedAt).getTime() > new Date(latest).getTime() ? updatedAt : latest
        }, latestUpdatedAtRef.current)

        latestUpdatedAtRef.current = latestFromBatch
      } catch (error) {
        console.error("Error fetching book requests:", error)
      } finally {
        if (!incremental && isMounted) {
          setIsLoading(false)
        }
      }
    }

    syncRequests(false)
    const interval = setInterval(() => syncRequests(true), 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [options])

  return { data, setData, isLoading }
}
