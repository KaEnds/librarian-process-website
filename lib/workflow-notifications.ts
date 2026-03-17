import { REQUEST_NOTIFICATIONS_UPDATED_EVENT } from "@/lib/request-notifications"

export type WorkflowNotificationItem = {
  id: string
  kind: "workflow-state-change"
  message: string
  details: string[]
  createdAt: string
}

const STORAGE_KEY = "workflow-notifications"
const LAST_SEEN_KEY = "workflow-state-change-last-seen-at"
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const isBrowser = () => typeof window !== "undefined"

const parseStoredItems = (): WorkflowNotificationItem[] => {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item) => item && typeof item.id === "string")
  } catch {
    return []
  }
}

const persistItems = (items: WorkflowNotificationItem[]) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const isWithinOneDay = (value: string) => {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return false
  }

  return Date.now() - time <= ONE_DAY_MS
}

const pruneNotifications = (items: WorkflowNotificationItem[]) => {
  return items.filter((item) => isWithinOneDay(item.createdAt))
}

const notifyUpdated = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(REQUEST_NOTIFICATIONS_UPDATED_EVENT))
}

const getLastSeenAt = (): string | null => {
  if (!isBrowser()) {
    return null
  }

  return window.localStorage.getItem(LAST_SEEN_KEY)
}

export const addWorkflowStateChangeNotification = (
  updates: Array<{ processId: number; status: string }>
) => {
  if (!isBrowser() || updates.length === 0) {
    return
  }

  const detailLines = updates.map(({ processId, status }) => `ขั้นตอน ${processId} -> ${status}`)
  const existing = pruneNotifications(parseStoredItems())

  const nextItem: WorkflowNotificationItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: "workflow-state-change",
    message: "มีการยืนยันเปลี่ยนสถานะกระบวนการ",
    details: detailLines,
    createdAt: new Date().toISOString(),
  }

  persistItems([nextItem, ...existing])
  notifyUpdated()
}

export const getRecentWorkflowNotifications = (): WorkflowNotificationItem[] => {
  const pruned = pruneNotifications(parseStoredItems())
  const sorted = [...pruned].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeB - timeA
  })

  persistItems(sorted)
  return sorted
}

export const getUnseenWorkflowStateChangeNotifications = (): WorkflowNotificationItem[] => {
  const items = getRecentWorkflowNotifications()
  const lastSeenAt = getLastSeenAt()
  const lastSeenTime = lastSeenAt ? new Date(lastSeenAt).getTime() : null

  return items.filter((item) => {
    const createdTime = new Date(item.createdAt).getTime()
    if (Number.isNaN(createdTime)) {
      return false
    }

    if (lastSeenTime === null || Number.isNaN(lastSeenTime)) {
      return true
    }

    return createdTime > lastSeenTime
  })
}

export const markAllWorkflowStateChangeNotificationsSeen = () => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
  notifyUpdated()
}
