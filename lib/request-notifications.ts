export type RequestNotificationItem = {
  requestId: number
  title: string | null
  requestedAt: string | null
  createdAt: string
  seenAt: string | null
}

const STORAGE_KEY = "request-notifications"
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const REQUEST_NOTIFICATIONS_UPDATED_EVENT = "request-notifications-updated"

const isBrowser = () => typeof window !== "undefined"

const parseStoredItems = (): RequestNotificationItem[] => {
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

    return parsed.filter((item) => item && typeof item.requestId === "number")
  } catch {
    return []
  }
}

const persistItems = (items: RequestNotificationItem[]) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const isWithinOneDay = (value: string | null) => {
  if (!value) {
    return false
  }

  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return false
  }

  return Date.now() - time <= ONE_DAY_MS
}

const pruneNotifications = (items: RequestNotificationItem[]) => {
  return items.filter((item) => {
    if (!isWithinOneDay(item.createdAt)) {
      return false
    }

    if (item.seenAt && !isWithinOneDay(item.seenAt)) {
      return false
    }

    return true
  })
}

const notifyUpdated = () => {
  if (!isBrowser()) {
    return
  }

  window.dispatchEvent(new Event(REQUEST_NOTIFICATIONS_UPDATED_EVENT))
}

export const addRequestNotifications = (
  notifications: Array<{ requestId: number; title: string | null; requestedAt: string | null }>
) => {
  if (!isBrowser() || !notifications.length) {
    return
  }

  const existing = pruneNotifications(parseStoredItems())
  const byRequestId = new Map<number, RequestNotificationItem>()

  existing.forEach((item) => {
    byRequestId.set(item.requestId, item)
  })

  notifications.forEach(({ requestId, title, requestedAt }) => {
    if (!requestId) {
      return
    }

    const existingItem = byRequestId.get(requestId)
    if (existingItem) {
      byRequestId.set(requestId, {
        ...existingItem,
        title: existingItem.title ?? title,
        requestedAt: existingItem.requestedAt ?? requestedAt,
      })
      return
    }

    byRequestId.set(requestId, {
      requestId,
      title,
      requestedAt,
      createdAt: new Date().toISOString(),
      seenAt: null,
    })
  })

  persistItems(Array.from(byRequestId.values()))
  notifyUpdated()
}

export const getUnseenRequestNotifications = (): RequestNotificationItem[] => {
  const pruned = pruneNotifications(parseStoredItems())
  persistItems(pruned)
  return pruned.filter((item) => !item.seenAt)
}

export const getRecentRequestNotifications = (): RequestNotificationItem[] => {
  const pruned = pruneNotifications(parseStoredItems())
  const sorted = [...pruned].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeB - timeA
  })

  persistItems(sorted)
  return sorted
}

export const markAllRequestNotificationsSeen = () => {
  if (!isBrowser()) {
    return
  }

  const now = new Date().toISOString()
  const next = pruneNotifications(parseStoredItems()).map((item) =>
    item.seenAt ? item : { ...item, seenAt: now }
  )

  persistItems(next)
  notifyUpdated()
}

export const isRequestNew = (requestId: number): boolean => {
  if (!isBrowser()) {
    return false
  }

  const unseen = getUnseenRequestNotifications()
  return unseen.some((item) => item.requestId === requestId)
}

export const markRequestSeen = (requestId: number) => {
  if (!isBrowser()) {
    return
  }

  const now = new Date().toISOString()
  const items = parseStoredItems()
  const updated = items.map((item) =>
    item.requestId === requestId && !item.seenAt ? { ...item, seenAt: now } : item
  )

  persistItems(updated)
  notifyUpdated()
}