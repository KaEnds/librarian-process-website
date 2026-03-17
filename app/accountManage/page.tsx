"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, ShieldAlert, UserCog, X } from "lucide-react"
import { useToast } from "@/components/Toast"
import { getColumns, getStatusBadge, type Account, type AccountStatus, type UserRole } from "./columns"
import { DataTable } from "./data-table"

type AccountApiRecord = {
  user_id: number
  username: string
  user_role: string
  account_status: string
  name: string
  surname: string
}

const normalizeRole = (role: string): UserRole => {
  const r = role.toLowerCase()
  if (r === "admin") return "admin"
  if (r === "librarian") return "librarian"
  if (r === "director") return "director"
  return "librarian"
}

const normalizeStatus = (status: string) => {
  const s = status.toLowerCase()
  if (s === "active") return "active" as const
  if (s === "pending") return "pending" as const
  return "inactive" as const
}

export default function AccountManagementPage() {
  const { showToast } = useToast()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("librarian")
  const [newStatus, setNewStatus] = useState<AccountStatus>("active")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<Account | null>(null)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/account-manage")
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || "ไม่สามารถโหลดข้อมูลบัญชีผู้ใช้งานได้")
      }
      const payload = await response.json()
      const mapped: Account[] = Array.isArray(payload?.users)
        ? payload.users.map((record: AccountApiRecord) => ({
            id: record.user_id,
            username: record.username,
            name: record.name,
            surname: record.surname,
            userRole: normalizeRole(record.user_role || "user"),
            accountStatus: normalizeStatus(record.account_status || "inactive"),
          }))
        : []
      setAccounts(mapped)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      showToast(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล",
        "error",
        3000
      )
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleApproveClick = useCallback(async (account: Account) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/account-manage/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRole: account.userRole,
          accountStatus: "active",
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || "ไม่สามารถอนุมัติบัญชีผู้ใช้งานได้")
      }

      await fetchAccounts()
      showToast("อนุมัติบัญชีผู้ใช้งานแล้ว", "success", 3000)
    } catch (error) {
      console.error("Error approving account:", error)
      showToast(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอนุมัติบัญชี",
        "error",
        3000
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [fetchAccounts, showToast])

  const handleEditClick = useCallback((account: Account) => {
    setSelectedAccount(account)
    setNewRole(account.userRole)
    setNewStatus(account.accountStatus === "inactive" ? "inactive" : "active")
    setIsRoleModalOpen(true)
  }, [])

  const handleDeleteClick = useCallback((account: Account) => {
    setConfirmDeleteAccount(account)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDeleteAccount) return
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/account-manage/${confirmDeleteAccount.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || "ไม่สามารถลบบัญชีได้")
      }

      setConfirmDeleteAccount(null)
      await fetchAccounts()
      showToast("ลบบัญชีสำเร็จ", "success", 3000)
    } catch (error) {
      console.error("Error deleting account:", error)
      showToast(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบบัญชี",
        "error",
        3000
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [confirmDeleteAccount, fetchAccounts, showToast])

  const handleSaveRole = useCallback(async () => {
    if (!selectedAccount) return
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/account-manage/${selectedAccount.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userRole: newRole,
          accountStatus: newStatus,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.message || "ไม่สามารถอัปเดตข้อมูลบัญชีได้")
      }

      showToast(
        `อัปเดต ${selectedAccount.name}: role เป็น ${newRole} และสถานะเป็น ${newStatus === "active" ? "active" : "reject"} สำเร็จ`,
        "success",
        3000
      )
      setIsRoleModalOpen(false)
      setSelectedAccount(null)
      await fetchAccounts()
    } catch (error) {
      console.error("Error updating account:", error)
      showToast(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปเดตบัญชี",
        "error",
        3000
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedAccount, newRole, newStatus, fetchAccounts, showToast])

  const columns = useMemo(
    () => getColumns(handleApproveClick, handleEditClick, handleDeleteClick),
    [handleApproveClick, handleEditClick, handleDeleteClick]
  )

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)]">
      <div className="border border-gray-200 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-800">จัดการบัญชีผู้ใช้งาน</h1>
            <p className="text-sm text-gray-500 mt-1">อนุมัติ ลบ หรือกำหนดสิทธิ์การใช้งาน (Role) ให้กับบุคลากร</p>
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          <DataTable columns={columns} data={accounts} isLoading={isLoading} />
        </div>
      </div>

      {/* Modal: ดูข้อมูล & จัดการสิทธิ์ */}
      {isRoleModalOpen && selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIsRoleModalOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-md border border-border bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <UserCog size={18} className="text-blue-600" />
                ข้อมูลบัญชีผู้ใช้งาน
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-muted/30 p-4 space-y-4">
              {/* ข้อมูลผู้ใช้ */}
              <div className="rounded-md border border-border bg-background p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono text-gray-800 col-span-2 font-medium">{selectedAccount.username}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">ชื่อ-นามสกุล:</span>
                  <span className="text-gray-800 col-span-2 font-medium">
                    {selectedAccount.name} {selectedAccount.surname}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">สถานะ:</span>
                  <span className="col-span-2">{getStatusBadge(selectedAccount.accountStatus)}</span>
                </div>
              </div>

              {/* แก้ไข Role */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">แก้ไขสถานะ (Status)</p>
                <div className="space-y-2 mb-4">
                  {(
                    [
                      { value: "active" as AccountStatus, label: "Active", desc: "บัญชีใช้งานได้ตามปกติ" },
                      { value: "inactive" as AccountStatus, label: "Inactive", desc: "ปฏิเสธ/ระงับการใช้งานบัญชี" },
                    ]
                  ).map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newStatus === value ? "border-gray-500 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={newStatus === value}
                        onChange={() => setNewStatus(value)}
                        className="mr-3 w-4 h-4"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <p className="text-sm font-semibold text-gray-800 mb-3">แก้ไขระดับสิทธิ์ (Role)</p>
                <div className="space-y-2">
                  {(
                    [
                      { value: "admin" as UserRole, label: "Admin", desc: "ผู้ดูแลระบบ - จัดการบัญชีผู้ใช้และระบบได้ทั้งหมด", icon: <UserCog size={14} /> },
                      { value: "librarian" as UserRole, label: "Librarian", desc: "บรรณารักษ์ - จัดการคำร้องหนังสือและใบเสนอราคาร้านค้า", icon: <Shield size={14} /> },
                      { value: "director" as UserRole, label: "Director", desc: "ผู้อำนวยการ - อนุมัติขั้นสุดท้าย", icon: <ShieldAlert size={14} /> },
                    ]
                  ).map(({ value, label, desc, icon }) => (
                    <label
                      key={value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${newRole === value ? "border-gray-500 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={newRole === value}
                        onChange={() => setNewRole(value)}
                        className="mr-3 w-4 h-4"
                      />
                      <div>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          {icon} {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveRole}
                  disabled={isSubmitting || (
                    newRole === selectedAccount.userRole
                    && newStatus === (selectedAccount.accountStatus === "inactive" ? "inactive" : "active")
                  )}
                >
                  บันทึกสิทธิ์
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteAccount !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDeleteAccount(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-md border border-border bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
              <h3 className="text-base font-semibold">ยืนยันการลบ</h3>
            </div>

            <div className="bg-muted/30 p-4">
              <div className="rounded-md border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">
                  คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ{" "}
                  <span className="font-semibold text-gray-800">
                    {confirmDeleteAccount.name} {confirmDeleteAccount.surname}
                  </span>
                  ? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmDeleteAccount(null)}>
                  ยกเลิก
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isSubmitting}
                  onClick={handleConfirmDelete}
                >
                  ลบ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}