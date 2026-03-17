"use client"

import { useEffect, useState } from "react"
import {
  getRecentRequestNotifications,
  REQUEST_NOTIFICATIONS_UPDATED_EVENT,
  type RequestNotificationItem,
} from "@/lib/request-notifications"
import {
  getRecentWorkflowNotifications,
  getUnseenWorkflowStateChangeNotifications,
  type WorkflowNotificationItem,
} from "@/lib/workflow-notifications"
import {
  getUnseenWorkflowNotifications,
} from "@/lib/workflow-notification-client"

type NotificationLogEntry =
  | { type: "request"; createdAt: string; isUnread: boolean; item: RequestNotificationItem }
  | { type: "workflow"; createdAt: string; isUnread: boolean; item: WorkflowNotificationItem }
  | {
      type: "n8n-workflow"
      createdAt: string
      isUnread: boolean
      item: {
        id: number
        source: string | null
        workflow_name: string | null
        execution_id: string | null
        status: string
        message: string | null
        created_at: string
      }
    }

const fetchN8nWorkflowNotifications = async () => {
  const response = await fetch("/api/workflow-notifications?limit=100", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch n8n workflow notifications")
  }

  const payload = await response.json()
  if (!Array.isArray(payload?.data)) {
    return []
  }

  return payload.data as Array<{
    id: number
    source: string | null
    workflow_name: string | null
    execution_id: string | null
    status: string
    message: string | null
    created_at: string
  }>
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const formatRelativeTime = (value: string) => {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return "ไม่ทราบเวลา"
  }

  const diffMs = Date.now() - time
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return "เมื่อสักครู่"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} ชั่วโมงที่แล้ว`
  }

  return "มากกว่า 1 วันที่แล้ว"
}

export default function NotificationLogPage() {
  const [logs, setLogs] = useState<NotificationLogEntry[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let intervalId: ReturnType<typeof setInterval> | null = null

    const syncLogs = async () => {
      const unseenWorkflowStateChangeIds = new Set(
        getUnseenWorkflowStateChangeNotifications().map((item) => item.id)
      )

      const requestLogs: NotificationLogEntry[] = getRecentRequestNotifications().map((item) => ({
        type: "request",
        createdAt: item.createdAt,
        isUnread: !item.seenAt,
        item,
      }))

      const workflowLogs: NotificationLogEntry[] = getRecentWorkflowNotifications().map((item) => ({
        type: "workflow",
        createdAt: item.createdAt,
        isUnread: unseenWorkflowStateChangeIds.has(item.id),
        item,
      }))

      let n8nLogs: NotificationLogEntry[] = []
      try {
        const n8nItems = await fetchN8nWorkflowNotifications()
        const unseenN8nIds = new Set(getUnseenWorkflowNotifications(n8nItems).map((item) => item.id))
        n8nLogs = n8nItems.map((item) => ({
          type: "n8n-workflow",
          createdAt: item.created_at,
          isUnread: unseenN8nIds.has(item.id),
          item,
        }))
      } catch {
        // Keep existing notifications visible even when API polling fails.
      }

      const merged = [...requestLogs, ...workflowLogs, ...n8nLogs].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        return timeB - timeA
      })

      setLogs(merged)
    }

    syncLogs()
    intervalId = setInterval(syncLogs, 15000)
    window.addEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncLogs)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      window.removeEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncLogs)
    }
  }, [])

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="border border-gray-200 bg-white rounded-lg p-4 mb-6">
        <h1 className="text-xl font-bold">ประวัติการแจ้งเตือน</h1>
        <p className="text-sm text-gray-600 mt-1">แสดงประวัติการแจ้งเตือนย้อนหลังภายใน 24 ชั่วโมง</p>
        <p className="text-sm text-blue-600 mt-2">ทั้งหมด {logs.length} รายการ</p>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
          รายการแจ้งเตือนล่าสุด
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">ยังไม่มีคำร้องใหม่ในช่วง 24 ชั่วโมงล่าสุด</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((entry, index) => {
              if (entry.type === "n8n-workflow") {
                const item = entry.item
                return (
                  <div key={`n8n-${item.id}-${index}`} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 rounded-full ${entry.isUnread ? "bg-red-500" : "bg-transparent"}`} />
                        <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">n8n:</span> {item.message || "Workflow ทำงานเสร็จสิ้น"}
                        </p>
                        {item.workflow_name && (
                          <p className="text-sm text-gray-700 mt-1">Workflow: {item.workflow_name}</p>
                        )}
                        {item.execution_id && (
                          <p className="text-sm text-gray-700 mt-1">Execution ID: {item.execution_id}</p>
                        )}
                        <p className="text-sm text-gray-700 mt-1">Status: {item.status}</p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">อัปเดตเมื่อ: {formatDateTime(item.created_at)}</p>
                  </div>
                )
              }

              if (entry.type === "workflow") {
                const item = entry.item
                return (
                  <div key={`${item.id}-${index}`} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 rounded-full ${entry.isUnread ? "bg-red-500" : "bg-transparent"}`} />
                        <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">Workflow:</span> {item.message}
                        </p>
                        {item.details.map((line) => (
                          <p key={line} className="text-sm text-gray-700 mt-1">{line}</p>
                        ))}
                        </div>
                      </div>
                      <span className="text-xs text-blue-600">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">อัปเดตเมื่อ: {formatDateTime(item.createdAt)}</p>
                  </div>
                )
              }

              const item = entry.item
              return (
                <div key={`${item.requestId}-${item.createdAt}-${index}`} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 rounded-full ${entry.isUnread ? "bg-red-500" : "bg-transparent"}`} />
                      <div>
                      <p className="text-sm text-gray-800">
                        คำร้องใหม่เลขที่ <span className="font-semibold">{item.requestId}</span>
                      </p>
                      {item.title && (
                        <p className="text-sm text-gray-700 font-medium mt-1">{item.title}</p>
                      )}
                      </div>
                    </div>
                    <span className="text-xs text-blue-600">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">ส่งคำร้องเมื่อ: {formatDateTime(item.requestedAt)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
