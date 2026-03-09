'use client'

import React, { useEffect, useState } from 'react'
import { Bell, FileText, Send, Home, UserCheck, User } from 'lucide-react'
import {
  getUnseenRequestNotifications,
  markAllRequestNotificationsSeen,
  REQUEST_NOTIFICATIONS_UPDATED_EVENT,
  type RequestNotificationItem,
} from '@/lib/request-notifications'

interface ProcessState {
  process_id: number
  status: string
  updated_at: string
}

const iconMap = [FileText, Send, Home, UserCheck]

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function Topmenu() {
  const [language, setLanguage] = useState('th')
  const [openLanguageMenu, setOpenLanguageMenu] = useState(false)
  const [openNotificationMenu, setOpenNotificationMenu] = useState(false)
  const [notifications, setNotifications] = useState<RequestNotificationItem[]>([])
  const [processStates, setProcessStates] = useState<ProcessState[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncNotifications = () => {
      setNotifications(getUnseenRequestNotifications())
    }

    syncNotifications()
    window.addEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncNotifications)

    return () => {
      window.removeEventListener(REQUEST_NOTIFICATIONS_UPDATED_EVENT, syncNotifications)
    }
  }, [])

  useEffect(() => {
    const fetchProcessStates = async () => {
      try {
        const response = await fetch('/api/get-all-process-states')
        if (response.ok) {
          const data = await response.json()
          setProcessStates(data.data)
        }
      } catch (error) {
        console.error('Error fetching process states:', error)
      }
    }

    fetchProcessStates()
    const interval = setInterval(fetchProcessStates, 3000)
    return () => clearInterval(interval)
  }, [])

  const mapStatus = (dbStatus: string): string => {
    switch (dbStatus) {
      case 'DONE':
        return 'Done'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'PENDING':
        return 'Pending'
      default:
        return 'Pending'
    }
  }

  const handleToggleNotificationMenu = () => {
    if (openNotificationMenu && notifications.length > 0) {
      markAllRequestNotificationsSeen()
      setNotifications([])
    }

    setOpenNotificationMenu(!openNotificationMenu)
  }

  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'th', name: 'ไทย', flag: 'https://flagcdn.com/w40/th.png' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const steps = processStates.map((process) => ({
    id: process.process_id,
    icon: iconMap[process.process_id - 1] || FileText,
    status: mapStatus(process.status),
  }))

  return (
    <div className="fixed top-0 right-0 h-20 w-[calc(100%-16rem)] bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 18px rgba(236, 72, 153, 0.5);
            transform: scale(1.05);
          }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-rotate {
          animation: rotate 1.8s linear infinite;
        }

        .spinner-ring-outer {
          position: absolute;
          inset: -3px;
          border-radius: 9999px;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          border-top-color: rgba(255, 255, 255, 0.95);
          border-right-color: rgba(255, 255, 255, 0.85);
          animation: rotate 1.1s linear infinite;
          pointer-events: none;
        }

        .spinner-ring-inner {
          position: absolute;
          inset: 4px;
          border-radius: 9999px;
          border: 1px dashed rgba(255, 255, 255, 0.7);
          animation: rotate-reverse 1.4s linear infinite;
          pointer-events: none;
        }

        @keyframes arrow-flow {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.7;
          }
          50% {
            transform: translateX(2px);
            opacity: 1;
          }
        }

        .arrow-active {
          color: rgb(244 114 182);
          animation: arrow-flow 1s ease-in-out infinite;
        }
      `}</style>
      
      {/* Left Section - Workflow Icons */}
      <div className="flex-auto">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${
                  step.status === 'Done'
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : step.status === 'In Progress'
                      ? 'border-pink-400 bg-pink-400 text-white animate-pulse-glow'
                      : 'border-gray-300 bg-gray-50 text-gray-400'
                }`}>
                {step.status === 'In Progress' && (
                  <>
                    <span className="spinner-ring-outer" />
                    <span className="spinner-ring-inner" />
                  </>
                )}
                <step.icon size={16} className={step.status === 'In Progress' ? 'animate-rotate' : ''} />
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div
                  className={`text-base ${
                    steps[index]?.status === 'Done' && steps[index + 1]?.status === 'Done'
                      ? 'text-green-500'
                      : steps[index + 1]?.status === 'In Progress'
                        ? 'arrow-active'
                        : 'text-gray-400'
                  }`}
                >
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Section - Icons and User */}
      <div className="flex items-center gap-6 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleToggleNotificationMenu}
            className="relative text-slate-600 hover:text-slate-900 transition"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          {openNotificationMenu && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-2 border-b border-slate-200 text-sm font-semibold text-slate-800">
                แจ้งเตือนคำร้องใหม่
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((notification, index) => (
                    <div key={`${notification.requestId}-${index}`} className="px-4 py-3 border-b border-slate-100 last:border-b-0">
                      <p className="text-sm text-slate-800">มี request id: <span className="font-semibold">{notification.requestId}</span></p>
                      <p className="text-xs text-slate-500">requested_at: {formatDateTime(notification.requestedAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-sm text-slate-500">ยังไม่มีแจ้งเตือนใหม่</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setOpenLanguageMenu(!openLanguageMenu)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition"
          >
            <img 
              src={currentLanguage?.flag} 
              alt={currentLanguage?.name} 
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium">{currentLanguage?.name}</span>
            <span className={`text-xs transition ${openLanguageMenu ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {/* Language Dropdown Menu */}
          {openLanguageMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setOpenLanguageMenu(false)
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 transition ${
                    language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                  } ${lang.code === 'en' ? 'border-b border-slate-200' : ''}`}
                >
                  <img 
                    src={lang.flag} 
                    alt={lang.name} 
                    className="w-4 h-4 rounded"
                  />
                  <span>{lang.name}</span>
                  {language === lang.code && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-900">นายสมชาย บุญมั่งมี</p>
            <p className="text-xs text-slate-500">บรรณารักษ์</p>
          </div>
          <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topmenu