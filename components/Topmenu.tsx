'use client'

import { useState } from 'react'
import { Search, Bell, User } from 'lucide-react'

function Topmenu() {
  const [language, setLanguage] = useState('th')
  const [openLanguageMenu, setOpenLanguageMenu] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'th', name: 'ไทย', flag: 'https://flagcdn.com/w40/th.png' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className="fixed top-0 right-0 h-20 w-[calc(100%-16rem)] bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
      {/* Left Section - Search */}
      <div className="flex-auto">
        <div className="relative max-w-1/2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right Section - Icons and User */}
      <div className="flex items-center gap-6 ml-auto">
        {/* Notification Bell */}
        <button className="relative text-slate-600 hover:text-slate-900 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>

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