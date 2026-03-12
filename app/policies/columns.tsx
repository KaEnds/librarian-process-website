"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"

export type Policy = {
  policy_id: number
  policy_code: string
  description: string
  prompt_instruction: string
  is_active: boolean
}

export const getColumns = (
  onEdit: (policy: Policy) => void,
  onDelete: (policyId: number) => void
): ColumnDef<Policy>[] => [
  {
    accessorKey: "policy_id",
    header: "ID",
    cell: ({ row }) => (
      <div className="text-sm text-gray-500">{row.getValue("policy_id")}</div>
    ),
  },
  {
    accessorKey: "policy_code",
    header: "Policy Code",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-gray-700">{row.getValue("policy_code")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{row.getValue("description")}</div>
    ),
  },
  {
    accessorKey: "prompt_instruction",
    header: "Prompt Instruction",
    cell: ({ row }) => (
      <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
        {row.getValue("prompt_instruction")}
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            isActive
              ? "bg-green-50 text-green-600 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const policy = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(policy)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            aria-label="แก้ไข"
          >
            <Edit size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(policy.policy_id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            aria-label="ลบ"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    },
  },
]
