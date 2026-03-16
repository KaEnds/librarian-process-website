"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Check, Trash2, UserCog, Shield, ShieldAlert } from "lucide-react"

export type UserRole = "admin" | "head" | "librarian" | "director" | "user"
export type AccountStatus = "active" | "pending" | "inactive"

export type Account = {
  id: number
  username: string
  name: string
  surname: string
  userRole: UserRole
  accountStatus: AccountStatus
}

export const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case "head":
      return (
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <ShieldAlert size={12} /> Head
        </span>
      )
    case "librarian":
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Shield size={12} /> Librarian
        </span>
      )
    case "director":
      return (
        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <ShieldAlert size={12} /> Director
        </span>
      )
    case "admin":
      return (
        <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <UserCog size={12} /> Admin
        </span>
      )
    default:
      return (
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold w-fit">
          User
        </span>
      )
  }
}

export const getStatusBadge = (status: AccountStatus) => {
  switch (status) {
    case "active":
      return (
        <span className="bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
        </span>
      )
    case "pending":
      return (
        <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> Pending
        </span>
      )
    case "inactive":
      return (
        <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Inactive
        </span>
      )
  }
}

export const getColumns = (
  onApprove: (account: Account) => void,
  onEdit: (account: Account) => void,
  onDelete: (account: Account) => void
): ColumnDef<Account>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="text-sm text-gray-500 text-center">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => (
      <div className="text-xs text-gray-500 font-mono">{row.getValue("username")}</div>
    ),
  },
  {
    id: "fullname",
    header: "ชื่อ-นามสกุล",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-gray-700">
        {row.original.name} {row.original.surname}
      </div>
    ),
  },
  {
    accessorKey: "userRole",
    header: "สิทธิ์ (Role)",
    cell: ({ row }) => getRoleBadge(row.getValue("userRole")),
  },
  {
    accessorKey: "accountStatus",
    header: "สถานะ (Status)",
    cell: ({ row }) => getStatusBadge(row.getValue("accountStatus")),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const account = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          {account.accountStatus === "pending" && (
            <button
              type="button"
              onClick={() => onApprove(account)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              aria-label="อนุมัติบัญชี"
            >
              <Check size={18} />
            </button>
          )}
          {account.accountStatus === "active" && (
            <button
              type="button"
              onClick={() => onEdit(account)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              aria-label="ดูข้อมูล / เปลี่ยน Role"
            >
              <UserCog size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(account)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            aria-label="ลบบัญชี"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  },
]
