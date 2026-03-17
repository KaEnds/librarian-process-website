"use client"

import { ColumnDef } from "@tanstack/react-table"

export type ApprovalHistoryItem = {
  id: number
  quote_id: number
  evaluation_id: number | null
  title: string | null
  vendor_name: string | null
  review_status: "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW" | null
  purchase_decision: "APPROVE" | "REJECT" | "WAIT_FOR_APPROVAL" | null
  approval_remark: string | null
  decided_at: string | null
}

const decisionLabel = (decision: ApprovalHistoryItem["purchase_decision"]) => {
  if (decision === "APPROVE") return { text: "อนุมัติ", className: "text-green-600" }
  if (decision === "REJECT") return { text: "ไม่อนุมัติ", className: "text-red-600" }
  if (decision === "WAIT_FOR_APPROVAL") return { text: "รออนุมัติ", className: "text-amber-600" }
  return { text: "-", className: "text-gray-500" }
}

const reviewLabel = (reviewStatus: ApprovalHistoryItem["review_status"]) => {
  if (reviewStatus === "APPROVE_REVIEW") return { text: "เลือกแล้ว", className: "text-blue-600" }
  if (reviewStatus === "REJECT_REVIEW") return { text: "ปฏิเสธ", className: "text-red-600" }
  return { text: "รอดำเนินการ", className: "text-gray-600" }
}

export const getColumns = (): ColumnDef<ApprovalHistoryItem>[] => [
  {
    accessorKey: "id",
    header: "No.",
    cell: ({ row }) => <div className="text-sm">{row.index + 1}</div>,
  },
  {
    accessorKey: "evaluation_id",
    header: "Evaluation ID",
    cell: ({ row }) => (
      <div className="text-sm text-gray-600">{(row.getValue("evaluation_id") as number | null) ?? "-"}</div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 220,
    maxSize: 260,
    cell: ({ row }) => {
      const title = (row.getValue("title") as string | null) ?? "-"
      return (
        <div className="max-w-[260px] truncate text-sm font-medium" title={title}>
          {title}
        </div>
      )
    },
  },
  {
    accessorKey: "vendor_name",
    header: "ร้านค้า",
    size: 180,
    maxSize: 220,
    cell: ({ row }) => {
      const vendorName = (row.getValue("vendor_name") as string | null) ?? "-"
      return (
        <div className="max-w-[220px] truncate text-sm text-gray-600" title={vendorName}>
          {vendorName}
        </div>
      )
    },
  },
  {
    accessorKey: "review_status",
    header: "สถานะรีวิว",
    cell: ({ row }) => {
      const reviewStatus = row.getValue("review_status") as ApprovalHistoryItem["review_status"]
      const mapped = reviewLabel(reviewStatus)
      return <span className={`text-sm ${mapped.className}`}>{mapped.text}</span>
    },
  },
  {
    accessorKey: "purchase_decision",
    header: "ผลอนุมัติ",
    cell: ({ row }) => {
      const decision = row.getValue("purchase_decision") as ApprovalHistoryItem["purchase_decision"]
      const mapped = decisionLabel(decision)
      return <span className={`text-sm font-medium ${mapped.className}`}>{mapped.text}</span>
    },
  },
  {
    accessorKey: "approval_remark",
    header: "หมายเหตุ",
    size: 260,
    maxSize: 320,
    cell: ({ row }) => {
      const remark = (row.getValue("approval_remark") as string | null) ?? "-"
      return (
        <div className="max-w-[320px] truncate text-sm text-gray-600" title={remark}>
          {remark}
        </div>
      )
    },
  },
]
