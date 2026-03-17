"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Check, Trash2, UserCog, Shield, ShieldAlert } from "lucide-react"

export type UserRole = "admin" | "librarian" | "director"
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
    case "librarian":
      return (
        <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Shield size={12} /> Librarian
        </span>
      )
    case "director":
      return (
        <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <ShieldAlert size={12} /> Director
        </span>
      )
    case "admin":
      return (
        <span className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <UserCog size={12} /> Admin
        </span>
      )
  }
}

export const getStatusBadge = (status: AccountStatus) => {
  switch (status) {
    case "active":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-600 border-green-200">
          Active
        </span>
      )
    case "pending":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-600 border-yellow-200">
          Pending
        </span>
      )
    case "inactive":
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-200">
          Inactive
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
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            aria-label="ดูข้อมูล / เปลี่ยน Role และ Status"
          >
            <UserCog size={18} />
          </button>
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
