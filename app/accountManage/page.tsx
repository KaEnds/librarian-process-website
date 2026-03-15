"use client"

import React, { useState, useMemo } from "react"
import { Search, Trash2, ShieldAlert, Check, X, Shield, UserCog } from "lucide-react"
import { useToast } from "@/components/Toast"
import { Button } from "@/components/ui/button"

// --- Types (ปรับให้ตรงกับ Backend API) ---
type UserRole = "admin" | "head" | "librarian" | "user"
type AccountStatus = "active" | "pending" | "inactive"

interface Account {
  id: string | number
  username: string
  name: string
  surname: string
  userRole: UserRole
  accountStatus: AccountStatus
}

// --- Mock Data (จำลองข้อมูลที่ได้จาก API) ---
const initialAccounts: Account[] = [
  { id: 1, username: "somchai_lib", name: "สมชาย", surname: "บรรณารักษ์", userRole: "librarian", accountStatus: "active" },
  { id: 2, username: "wipada_h", name: "วิภาดา", surname: "หัวหน้าฝ่าย", userRole: "head", accountStatus: "active" },
  { id: 3, username: "new_user01", name: "สมเกียรติ", surname: "สมัครใหม่", userRole: "user", accountStatus: "pending" },
  { id: 4, username: "kittipong_k", name: "กิตติพงษ์", surname: "ใจดี", userRole: "librarian", accountStatus: "active" },
  { id: 5, username: "admin_system", name: "ผู้ดูแล", surname: "ระบบ", userRole: "admin", accountStatus: "active" },
]

export default function AccountManagementPage() {
  // หาก Component useToast ของคุณไม่มี ให้ใช้ alert() แทนชั่วคราวได้ครับ
  const { showToast } = useToast()
  
  // --- States ---
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modal States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("user")

  // --- Functions ---
  
  // กรองข้อมูลจาก Username, Name, Surname
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [accounts, searchTerm])

  // อนุมัติผู้ใช้ใหม่ (Pending -> Active)
  const handleApprove = (id: string | number) => {
    setAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, accountStatus: "active" } : acc
    ))
    showToast("อนุมัติบัญชีผู้ใช้งานแล้ว", "success", 3000)
  }

  // ลบบัญชีผู้ใช้ (ลบออกจาก State)
  const handleDelete = (id: string | number, fullName: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${fullName}" ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      setAccounts(accounts.filter(acc => acc.id !== id))
      showToast("ลบบัญชีสำเร็จ", "success", 3000)
    }
  }

  // เปิด Modal เพื่อดูรายละเอียดและปรับ Role
  const openRoleModal = (account: Account) => {
    setSelectedAccount(account)
    setNewRole(account.userRole)
    setIsRoleModalOpen(true)
  }

  // บันทึก Role ใหม่
  const handleSaveRole = () => {
    if (selectedAccount) {
      setAccounts(accounts.map(acc => 
        acc.id === selectedAccount.id ? { ...acc, userRole: newRole } : acc
      ))
      showToast(`ปรับสิทธิ์ ${selectedAccount.name} เป็น ${newRole} สำเร็จ`, "success", 3000)
      setIsRoleModalOpen(false)
      setSelectedAccount(null)
    }
  }

  // --- Helper UI Functions ---
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "head": return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Head</span>
      case "librarian": return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Shield size={12}/> Librarian</span>
      case "admin": return <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><UserCog size={12}/> Admin</span>
      default: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold w-fit">User</span>
    }
  }

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case "active": return <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Active</span>
      case "pending": return <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/> Pending</span>
      case "inactive": return <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/> Inactive</span>
    }
  }

  return (
    <div className="w-full p-8 bg-slate-50 min-h-[calc(100vh-80px)] font-sans">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header & Search */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              จัดการบัญชีผู้ใช้งาน 
              <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md font-medium text-sm ml-2">
                {filteredAccounts.length} บัญชี
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">อนุมัติ ลบ หรือกำหนดสิทธิ์การใช้งาน (Role) ให้กับบุคลากร</p>
          </div>
          
          <div className="flex items-center">
            <div className="relative border border-gray-200 rounded-lg px-3 py-2 flex items-center bg-gray-50 focus-within:bg-white focus-within:border-blue-400 transition-all w-64">
              <Search size={18} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ Username..." 
                className="bg-transparent text-sm outline-none w-full text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-16 text-center">ID</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4">สิทธิ์ (Role)</th>
                <th className="px-6 py-4">สถานะ (Status)</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">ไม่พบข้อมูลบัญชีผู้ใช้งาน</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-center text-gray-400">{account.id}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{account.username}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{account.name} {account.surname}</td>
                    <td className="px-6 py-4">{getRoleBadge(account.userRole)}</td>
                    <td className="px-6 py-4">{getStatusBadge(account.accountStatus)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        
                        {/* อนุมัติ: แสดงเมื่อสถานะเป็น pending */}
                        {account.accountStatus === "pending" && (
                          <button onClick={() => handleApprove(account.id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="อนุมัติบัญชี">
                            <Check size={18} />
                          </button>
                        )}

                        {/* ดูข้อมูล/ตั้งค่า: แสดงเมื่อสถานะเป็น active */}
                        {account.accountStatus === "active" && (
                          <button onClick={() => openRoleModal(account)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="ดูข้อมูล / เปลี่ยน Role">
                            <UserCog size={18} />
                          </button>
                        )}

                        {/* ลบ: กดลบได้ทุกคน */}
                        <button onClick={() => handleDelete(account.id, `${account.name} ${account.surname}`)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="ลบบัญชี">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: ดูข้อมูลส่วนตัว & จัดการสิทธิ์ (Role Management) */}
      {isRoleModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="relative p-6 border-b border-gray-100 bg-slate-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserCog className="text-blue-600" /> ข้อมูลบัญชีผู้ใช้งาน
              </h2>
              <button 
                onClick={() => setIsRoleModalOpen(false)}
                className="absolute right-5 top-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Card ข้อมูลที่ได้มาจากการ Register */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-500 col-span-1">Username:</span>
                  <span className="font-mono text-gray-800 col-span-2 font-medium">{selectedAccount.username}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-500 col-span-1">ชื่อ-นามสกุล:</span>
                  <span className="text-gray-800 col-span-2 font-medium">{selectedAccount.name} {selectedAccount.surname}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-gray-500 col-span-1">สถานะ:</span>
                  <span className="col-span-2">{getStatusBadge(selectedAccount.accountStatus)}</span>
                </div>
              </div>

              {/* ส่วนแก้ไข Role (Radio buttons) */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">แก้ไขระดับสิทธิ์ (Role)</label>
                <div className="space-y-2">
                  
                  {/* Admin Role */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newRole === 'admin' ? 'border-slate-800 bg-slate-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="admin" checked={newRole === 'admin'} onChange={() => setNewRole('admin')} className="mr-3 w-4 h-4 text-slate-800" />
                    <div>
                      <p className="font-medium text-slate-800 flex items-center gap-1"><UserCog size={14}/> Admin</p>
                      <p className="text-xs text-gray-500">ผู้ดูแลระบบ - จัดการบัญชีผู้ใช้และระบบได้ทั้งหมด</p>
                    </div>
                  </label>

                  {/* Head Role */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newRole === 'head' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="head" checked={newRole === 'head'} onChange={() => setNewRole('head')} className="mr-3 w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-700 flex items-center gap-1"><ShieldAlert size={14}/> Head</p>
                      <p className="text-xs text-gray-500">หัวหน้าห้องสมุด - สิทธิ์สูงสุดในการอนุมัติคำร้องจัดซื้อ</p>
                    </div>
                  </label>

                  {/* Librarian Role */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newRole === 'librarian' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="librarian" checked={newRole === 'librarian'} onChange={() => setNewRole('librarian')} className="mr-3 w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-700 flex items-center gap-1"><Shield size={14}/> Librarian</p>
                      <p className="text-xs text-gray-500">บรรณารักษ์ - จัดการคำร้องหนังสือและใบเสนอราคาร้านค้า</p>
                    </div>
                  </label>

                  {/* User Role */}
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newRole === 'user' ? 'border-gray-500 bg-gray-100' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="user" checked={newRole === 'user'} onChange={() => setNewRole('user')} className="mr-3 w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-700">User</p>
                      <p className="text-xs text-gray-500">ผู้ใช้งานทั่วไป (รอกำหนดสิทธิ์เพิ่มเติม)</p>
                    </div>
                  </label>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                ปิดหน้าต่าง
              </Button>
              <Button 
                onClick={handleSaveRole} 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={newRole === selectedAccount.userRole}
              >
                บันทึกสิทธิ์
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}