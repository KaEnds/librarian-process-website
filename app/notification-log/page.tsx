"use client"

import { useEffect, useState } from "react"
import {
  getRecentRequestNotifications,
  REQUEST_NOTIFICATIONS_UPDATED_EVENT,
  type RequestNotificationItem,
} from "@/lib/request-notifications"

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
  const [logs, setLogs] = useState<RequestNotificationItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncLogs = () => {
      setLogs(getRecentRequestNotifications())
    }

    syncLogs()
    window.addEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncLogs)

    return () => {
      window.removeEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncLogs)
    }
  }, [])

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="border border-gray-200 bg-white rounded-lg p-4 mb-6">
        <h1 className="text-xl font-bold">ประวัติการแจ้งเตือน</h1>
        <p className="text-sm text-gray-600 mt-1">แสดงคำร้องใหม่ย้อนหลังภายใน 24 ชั่วโมง</p>
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
            {logs.map((item, index) => (
              <div key={`${item.requestId}-${item.createdAt}-${index}`} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-800">
                      คำร้องใหม่เลขที่ <span className="font-semibold">{item.requestId}</span>
                    </p>
                    {item.title && (
                      <p className="text-sm text-gray-700 font-medium mt-1">{item.title}</p>
                    )}
                  </div>
                  <span className="text-xs text-blue-600">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">ส่งคำร้องเมื่อ: {formatDateTime(item.requestedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
