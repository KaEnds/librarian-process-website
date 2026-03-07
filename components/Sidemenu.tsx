'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Home, Grid2X2, FileText, Users, Bell, Settings, HelpCircle, Book } from 'lucide-react'
import librairy_logo from '../images/librairy_logo.png'
import {
  getUnseenRequestNotifications,
  REQUEST_NOTIFICATIONS_UPDATED_EVENT,
} from '@/lib/request-notifications'

function Sidemenu() {
  const [openWorkflow, setOpenWorkflow] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [currentProcessId, setCurrentProcessId] = useState<number | null>(null)
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  const isProcessActive = (processId: number) => currentProcessId === processId

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncUnreadCount = () => {
      setUnreadNotificationCount(getUnseenRequestNotifications().length)
    }

    syncUnreadCount()
    window.addEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncUnreadCount)

    return () => {
      window.removeEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncUnreadCount)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchProcessStates = async () => {
      try {
        const response = await fetch('/api/get-all-process-states')
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        const processStates = Array.isArray(payload?.data) ? payload.data : []
        const currentProcess = processStates.find(
          (process: { process_id?: number; status?: string }) => process?.status === 'IN_PROGRESS'
        )

        if (isMounted) {
          setCurrentProcessId(typeof currentProcess?.process_id === 'number' ? currentProcess.process_id : null)
        }
      } catch (error) {
        console.error('Error fetching process states in sidemenu:', error)
      }
    }

    fetchProcessStates()
    const interval = setInterval(fetchProcessStates, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col overflow-y-auto sidemenu-scroll">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src={librairy_logo.src} alt="Librairy Logo" className="w-8 h-8" />
          <span className="text-2xl">Libr<span className='font-bold'>AI</span>ry</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* จัดการทั่วไป Section */}
        <div className="px-4 py-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">จัดการทั่วไป</h3>

          {/* Dashboard */}
          <div className="mb-3">
            <Link
              href="/dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive("/") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
          </div>

          {/* จัดการ Workflow */}
          <div className="mb-3">
            <button
              onClick={() => setOpenWorkflow(!openWorkflow)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <Grid2X2 className="w-5 h-5" />
                <span>Workflow</span>
                {(unreadNotificationCount > 0 || currentProcessId !== null) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition ${openWorkflow ? 'rotate-180' : ''}`} />
            </button>

            {/* Submenu */}
            {openWorkflow && (
              <div className="ml-8 mt-2 space-y-2">
                <Link
                  href="/requests-selection"
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs rounded transition ${isActive("/requests-selection") ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                >
                  <span>คัดเลือกคำร้อง</span>
                  {(unreadNotificationCount > 0 || isProcessActive(1)) && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/quotation-request"
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs rounded transition ${isActive("/quotation-request") ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                >
                  <span>ขอใบเสอราคา</span>
                  {isProcessActive(2) && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/quote-comparison"
                  className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs rounded transition ${isActive("/quote-comparison") ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                >
                  <span>คัดเลือกร้านค้า</span>
                  {isProcessActive(3) && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <button className="w-full flex items-center justify-between text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
                  <span>อนุมัติการจัดซื้อ</span>
                  {isProcessActive(4) && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* จัดการร้านค้า */}
          <div className="mb-3">
            <Link
              href="/vendor"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive("/vendor") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Home className="w-5 h-5" />
              Vendor
            </Link>
          </div>
        </div>

        {/* ข้อมูลย้อนหลัง Section */}
        <div className="px-4 py-6 border-t border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">ข้อมูลย้อนหลัง</h3>

          {/* ค่าร้องขอจัดซื้อ */}
          <div className="mb-3">
            <Link
              href="/requests-history"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive("/requests-history") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <FileText className="w-5 h-5" />
              คำร้องขอจัดซื้อ
            </Link>
          </div>

          {/* การอบุมูติจัดซื้อ */}
          <div className="mb-3">
            <Link
              href="/approval-history"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive("/approval-history") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Users className="w-5 h-5" />
              การอนุมัติจัดซื้อ
            </Link>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-4 py-6 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-300 uppercase mb-4">Account</h3>

        <div className="space-y-3">
          {/* Notifications */}
          <Link
            href="/notification-log"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${isActive("/notification-log") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
          >
            <span className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Notifications
            </span>
            {unreadNotificationCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Link>

          {/* Settings */}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
            <Settings className="w-5 h-5" />
            Settings
          </button>

          {/* FAQ */}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
            <HelpCircle className="w-5 h-5" />
            FAQ
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
            <HelpCircle className="w-5 h-5" />
            log out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidemenu