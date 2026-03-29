'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Home, Grid2X2, FileText, Users, Bell, Settings, HelpCircle, Book, UserCog, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import librairyLogo from '../images/librairy_logo.png'
import { useToast } from '@/components/Toast'
import { logoutUser } from '@/actions/auth'
import {
  getUnseenRequestNotifications,
  REQUEST_NOTIFICATIONS_UPDATED_EVENT,
} from '@/lib/request-notifications'
import {
  fetchRecentWorkflowNotifications,
  getUnseenWorkflowNotifications,
} from '@/lib/workflow-notification-client'
import { getUnseenWorkflowStateChangeNotifications } from '@/lib/workflow-notifications'

function Sidemenu() {
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const [openWorkflow, setOpenWorkflow] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [currentProcessId, setCurrentProcessId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const isActive = (path: string) => pathname === path

  const isProcessActive = (processId: number) => currentProcessId === processId

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let disposed = false

    const syncUnreadCount = async () => {
      const requestCount = getUnseenRequestNotifications().length
      const workflowItems = await fetchRecentWorkflowNotifications(100)
      const workflowCount = getUnseenWorkflowNotifications(workflowItems).length
      const workflowStateChangeCount = getUnseenWorkflowStateChangeNotifications().length

      if (disposed) {
        return
      }

      setUnreadNotificationCount(requestCount + workflowCount + workflowStateChangeCount)
    }

    syncUnreadCount()
    const interval = setInterval(syncUnreadCount, 15000)
    window.addEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncUnreadCount)

    return () => {
      disposed = true
      clearInterval(interval)
      window.removeEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncUnreadCount)
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logoutUser()
      showToast('ออกจากระบบสำเร็จ', 'success')
      router.push('/login')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ'
      showToast(message, 'error')
    } finally {
      setIsLoggingOut(false)
    }
  }

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

  useEffect(() => {
    let isMounted = true

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/my-account')
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        if (isMounted) {
          setUserRole(typeof payload?.user?.user_role === 'string' ? payload.user.user_role : null)
        }
      } catch (error) {
        console.error('Error fetching current user in sidemenu:', error)
      }
    }

    fetchCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-slate-900 text-white flex flex-col overflow-y-auto sidemenu-scroll transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={librairyLogo.src} alt="Librairy Logo" className="w-8 h-8 flex-shrink-0" />
            {!isCollapsed && <span className="text-2xl truncate">Libr<span className='font-bold'>AI</span>ry</span>}
          </div>
          {!isCollapsed && (
            <button onClick={toggleCollapsed} className="text-slate-400 hover:text-white transition p-1 rounded" title="ย่อเมนู">
              <ChevronsLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button onClick={toggleCollapsed} className="mt-3 w-full flex justify-center text-slate-400 hover:text-white transition p-1 rounded" title="ขยายเมนู">
            <ChevronsRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* จัดการทั่วไป Section */}
        <div className="px-2 py-4">
          {!isCollapsed && <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4 px-2">จัดการทั่วไป</h3>}

          {/* Dashboard */}
          <div className="mb-1">
            <Link
              href="/dashboard"
              title="Dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isCollapsed ? 'justify-center' : ''} ${isActive("/") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </div>

          {/* จัดการ Workflow */}
          <div className="mb-1">
            {isCollapsed ? (
              <Link
                href="/requests-selection"
                title="Workflow"
                className={`w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition relative`}
              >
                <Grid2X2 className="w-5 h-5 flex-shrink-0" />
                {currentProcessId !== null && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setOpenWorkflow(!openWorkflow)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <Grid2X2 className="w-5 h-5" />
                    <span>Workflow</span>
                    {currentProcessId !== null && (
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
                      {isProcessActive(1) && (
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
                    <Link
                      href="/approve"
                      className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs rounded transition ${isActive("/approve") ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800"}`}
                    >
                      <span>อนุมัติการจัดซื้อ</span>
                      {isProcessActive(4) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* จัดการร้านค้า */}
          {/* <div className="mb-3">
            <Link
              href="/vendor"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive("/vendor") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Home className="w-5 h-5" />
              Vendor
            </Link>
          </div> */}

          <div className="mb-1">
            <Link
              href="/policies"
              title="Policies"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isCollapsed ? 'justify-center' : ''} ${isActive("/policies") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Book className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Policies</span>}
            </Link>
          </div>

          {userRole?.toLowerCase() === 'admin' && (
            <div className="mb-1">
              <Link
                href="/accountManage"
                title="จัดการผู้ใช้"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isCollapsed ? 'justify-center' : ''} ${isActive("/accountManage") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
              >
                <UserCog className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>จัดการผู้ใช้</span>}
              </Link>
            </div>
          )}
        </div>

        {/* ข้อมูลย้อนหลัง Section */}
        <div className="px-2 py-4 border-t border-slate-700">
          {!isCollapsed && <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4 px-2">ข้อมูลย้อนหลัง</h3>}

          {/* ค่าร้องขอจัดซื้อ */}
          <div className="mb-1">
            <Link
              href="/requests-history"
              title="คำร้องขอจัดซื้อ"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isCollapsed ? 'justify-center' : ''} ${isActive("/requests-history") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>คำร้องขอจัดซื้อ</span>}
            </Link>
          </div>

          {/* การอนุมัติจัดซื้อ */}
          <div className="mb-1">
            <Link
              href="/approval-history"
              title="การอนุมัติจัดซื้อ"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isCollapsed ? 'justify-center' : ''} ${isActive("/approval-history") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>การอนุมัติจัดซื้อ</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-2 py-4 border-t border-slate-700">
        {!isCollapsed && <h3 className="text-xs font-semibold text-slate-300 uppercase mb-4 px-2">Account</h3>}

        <div className="space-y-1">
          {/* Notifications */}
          <Link
            href="/notification-log"
            title="Notifications"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm transition ${isActive("/notification-log") ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
          >
            <span className={`flex items-center gap-3 ${isCollapsed ? '' : ''}`}>
              <span className="relative inline-flex flex-shrink-0">
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              {!isCollapsed && <span>Notifications</span>}
            </span>
            {!isCollapsed && unreadNotificationCount > 0 ? (
              <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            ) : null}
          </Link>

          {/* Settings */}
          <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition ${isCollapsed ? 'justify-center' : ''}`} title="Settings">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>

          {/* FAQ */}
          <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition ${isCollapsed ? 'justify-center' : ''}`} title="FAQ">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>FAQ</span>}
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="log out"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'justify-center' : ''}`}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{isLoggingOut ? 'logging out...' : 'log out'}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidemenu