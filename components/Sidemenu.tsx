'use client'

import { useState } from 'react'
import { ChevronDown, Home, Grid2X2, FileText, Users, Bell, Settings, HelpCircle, Book } from 'lucide-react'
import librairy_logo from '../images/librairy_logo.png'

function Sidemenu() {
  const [openWorkflow, setOpenWorkflow] = useState(false)

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
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
              <Home className="w-5 h-5" />
              Dashboard
            </button>
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
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition ${openWorkflow ? 'rotate-180' : ''}`} />
            </button>

            {/* Submenu */}
            {openWorkflow && (
              <div className="ml-8 mt-2 space-y-2">
                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
                  คัดเลือกคำร้อง
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
                  ขอใบเสอราคา
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
                  คัดเลือกร้านค้า
                </button>
                <button className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition">
                  อนุมัติการจัดซื้อ
                </button>
              </div>
            )}
          </div>

          {/* จัดการร้านค้า */}
          <div className="mb-3">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
              <Home className="w-5 h-5" />
              จัดการร้านค้า
            </button>
          </div>
        </div>

        {/* ข้อมูลย้อนหลัง Section */}
        <div className="px-4 py-6 border-t border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">ข้อมูลย้อนหลัง</h3>

          {/* ค่าร้องขอจัดซื้อ */}
          <div className="mb-3">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
              <FileText className="w-5 h-5" />
              คำร้องขอจัดซื้อ
            </button>
          </div>

          {/* การอบุมูติจัดซื้อ */}
          <div className="mb-3">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
              <Users className="w-5 h-5" />
              การอนุมัติจัดซื้อ
            </button>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-4 py-6 border-t border-slate-700">
        <h3 className="text-xs font-semibold text-slate-300 uppercase mb-4">Account</h3>

        <div className="space-y-3">
          {/* Notifications */}
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 transition">
            <Bell className="w-5 h-5" />
            Notifications
          </button>

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