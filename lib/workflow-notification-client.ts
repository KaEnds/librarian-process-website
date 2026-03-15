import { REQUEST_NOTIFICATIONS_UPDATED_EVENT } from "@/lib/request-notifications"

export type WorkflowApiNotificationItem = {
  id: number
  source: string | null
  workflow_name: string | null
  execution_id: string | null
  status: string
  message: string | null
  created_at: string
}

const LAST_SEEN_KEY = "workflow-notifications-last-seen-at"
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const isBrowser = () => typeof window !== "undefined"

const isWithinOneDay = (value: string) => {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return false
  }

  return Date.now() - time <= ONE_DAY_MS
}

const getLastSeenAt = (): string | null => {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(LAST_SEEN_KEY)
}

const notifyUpdated = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(REQUEST_NOTIFICATIONS_UPDATED_EVENT))
}

export const fetchRecentWorkflowNotifications = async (
  limit: number = 100,
): Promise<WorkflowApiNotificationItem[]> => {
  const response = await fetch(`/api/workflow-notifications?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    return []
  }

  const payload = await response.json()
  const items = Array.isArray(payload?.data) ? payload.data : []

  return items.filter((item: WorkflowApiNotificationItem) => item && typeof item.id === "number")
}

export const getUnseenWorkflowNotifications = (
  items: WorkflowApiNotificationItem[],
): WorkflowApiNotificationItem[] => {
  const lastSeenAt = getLastSeenAt()
  const lastSeenTime = lastSeenAt ? new Date(lastSeenAt).getTime() : null

  return items.filter((item) => {
    if (!isWithinOneDay(item.created_at)) {
      return false
    }

    const createdTime = new Date(item.created_at).getTime()
    if (Number.isNaN(createdTime)) {
      return false
    }

    if (lastSeenTime === null || Number.isNaN(lastSeenTime)) {
      return true
    }

    return createdTime > lastSeenTime
  })
}

export const markAllWorkflowNotificationsSeen = () => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
  notifyUpdated()
}
