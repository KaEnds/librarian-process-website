import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Request } from "@/app/requests-selection/columns"
import type { ConfirmRequestItem } from "@/components/ConfirmRequestPopup"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ApiScoreItem = {
  score?: number | null
}

export type ApiRequest = {
  request_id?: number | null
  title?: string | null
  authors?: string | null
  isbn_issn?: string | null
  publisher?: string | null
  publication_year?: number | string | null
  status?: string | null
  review_status?: string | null
  passed_selection?: boolean | null
  branch?: string | null
  request_reason_category?: string | null
  specify_reason?: string | null
  requester_name?: string | null
  requester_id?: string | null
  requester_role?: string | null
  faculty_name_th?: string | null
  department_name_th?: string | null
  reasoning?: string | null
  net_score?: number | null
  score_breakdown?: Record<string, ApiScoreItem> | null
  updated_at?: string | null
  book_request_updated_at?: string | null
  book_request_requested_at?: string | null
  batch_start_date?: string | null
  batch_end_date?: string | null
}

export const toTextOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()
  return text.length ? text : null
}

export const getRequestUpdatedAt = (item: ApiRequest) => item.book_request_updated_at ?? item.updated_at ?? null

// สร้าง unique ID จาก combination ของข้อมูล (hash)
const generateUniqueId = (item: ApiRequest): number => {
  const combined = `${item.title}|${item.authors}|${item.isbn_issn}|${item.requester_id}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % 1000000 // Ensure positive and reasonable size
}

export const mapStatus = (item: ApiRequest): "approved" | "rejected" | "pending" => {
  if (item.status === "REJECT" || item.passed_selection === false) {
    return "rejected"
  }

  if (
    item.status === "APPROVE" ||
    item.status === "APPROVED" ||
    item.passed_selection === true
  ) {
    return "approved"
  }

  return "pending"
}

export const mapCriteria = (scoreBreakdown: ApiRequest["score_breakdown"]) => {
  if (!scoreBreakdown) {
    return []
  }

  return Object.entries(scoreBreakdown).map(([criterion, value], index) => ({
    id: index + 1,
    title: criterion,
    score: typeof value?.score === "number" ? value.score : 0,
  }))
}

export const mapApiRequestToRequest = (item: ApiRequest, index: number): Request => {
  const mappedStatus = mapStatus(item)

  return {
    id: item.request_id ?? generateUniqueId(item),
    request_id: item.request_id ?? null,
    title: toTextOrNull(item.title),
    author: toTextOrNull(item.authors),
    isbn: toTextOrNull(item.isbn_issn),
    publisher: toTextOrNull(item.publisher),
    year: toTextOrNull(item.publication_year),
    status: mappedStatus,
    review_status: (toTextOrNull(item.review_status) as "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW" | null) ?? "PENDING_REVIEW",
    requested_at: toTextOrNull(item.book_request_requested_at),
    details: {
      title: toTextOrNull(item.title),
      author: toTextOrNull(item.authors),
      isbn: toTextOrNull(item.isbn_issn),
      year: toTextOrNull(item.publication_year),
      publisher: toTextOrNull(item.publisher),
      branch: toTextOrNull(item.branch),
      aiStatus: mappedStatus,
      requestedAt: toTextOrNull(item.book_request_requested_at),
      requestReason: toTextOrNull(item.request_reason_category),
      detailReason: toTextOrNull(item.specify_reason),
      requester: {
        name: toTextOrNull(item.requester_name),
        studentId: toTextOrNull(item.requester_id),
        status: toTextOrNull(item.requester_role),
        faculty: toTextOrNull(item.faculty_name_th),
        major: toTextOrNull(item.department_name_th),
      },
    },
    aiSelectionDetail: {
      status: mappedStatus,
      reason: toTextOrNull(item.reasoning),
      totalScore: item.net_score ?? null,
      criteria: mapCriteria(item.score_breakdown),
    },
  }
}

export const mergeRequests = (previous: Request[], incoming: Request[]): Request[] => {
  if (!incoming.length) {
    return previous
  }

  const next = [...previous]
  const indexById = new Map<number, number>()

  next.forEach((request, index) => {
    indexById.set(request.id, index)
  })

  incoming.forEach((incomingRequest) => {
    const existingIndex = indexById.get(incomingRequest.id)

    if (existingIndex === undefined) {
      next.push(incomingRequest)
      indexById.set(incomingRequest.id, next.length - 1)
      return
    }

    const existingRequest = next[existingIndex]
    next[existingIndex] = {
      ...incomingRequest,
      review_status: existingRequest.review_status,
    }
  })

  return next
}

export const buildConfirmRequestItems = (data: Request[]): ConfirmRequestItem[] => {
  return data.reduce<ConfirmRequestItem[]>((result, item, index) => {
    if (item.review_status !== "APPROVE_REVIEW") {
      return result
    }

    result.push({
      no: index + 1,
      id: item.id,
      title: item.title ?? "-",
      author: item.author ?? "-",
      isbn: item.isbn ?? "-",
      publisher: item.publisher ?? "-",
      status: item.status,
    })

    return result
  }, [])
}
