// API service layer for requests management
import { addWorkflowStateChangeNotification } from "@/lib/workflow-notifications"

export const updateReviewStatus = async (
  requestId: number,
  reviewStatus: "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW"
) => {
  const response = await fetch('/api/edit-status-book-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, reviewStatus })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || `Failed to update request ${requestId}`)
  }

  return response
}

export const updateProcessState = async (processId: number, status: string) => {
  const response = await fetch('/api/update-process-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processId, status })
  })

  if (!response.ok) {
    throw new Error(`Failed to update process ${processId}`)
  }

  return response
}

export const updateMultipleProcessStates = async (
  updates: Array<{ processId: number; status: string }>
) => {
  await Promise.all(
    updates.map(({ processId, status }) => updateProcessState(processId, status))
  )

  addWorkflowStateChangeNotification(updates)
}

export const updateVendorQuoteNetPrice = async (
  evaluationId: number,
  vendorName: string,
  netPrice: number,
) => {
  const response = await fetch('/api/update-vendor-quote-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evaluationId, vendorName, netPrice })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || `Failed to update net price for evaluation ${evaluationId}`)
  }

  return response.json()
}

export const updateBookRequestDetails = async (
  requestId: number,
  payload: {
    title: string | null
    author: string | null
    isbn: string | null
    year: string | null
    publisher: string | null
  }
) => {
  const response = await fetch(`/api/edit-book-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const responseData = await response.json()

  if (!response.ok) {
    throw new Error(responseData.message || `Failed to update request ${requestId}`)
  }

  return responseData
}

