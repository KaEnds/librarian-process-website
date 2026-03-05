"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { RequestDetails } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailData } from "@/components/AIDecisionDetailPopup"

export type Request = {
  id: number
  request_id: number | null
  title: string | null
  author: string | null
  isbn: string | null
  publisher: string | null
  year: string | null
  status: "approved" | "rejected" | "pending"
  review_status: "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW" | null
  details: RequestDetails
  aiSelectionDetail: AIDecisionDetailData
}

export const getColumns = (
  onOpenDetails?: (request: Request) => void,
  onOpenAISelectionDetail?: (request: Request) => void
): ColumnDef<Request>[] => {
  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: "id",
      header: "No.",
      cell: ({ row }) => {
        return <div className="text-sm">{row.index + 1}</div>
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return <div className="font-bold text-sm">{(row.getValue("title") as string | null) ?? "-"}</div>
      },
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{(row.getValue("author") as string | null) ?? "-"}</div>
      },
    },
    {
      accessorKey: "isbn",
      header: "ISBN/ISSN",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{(row.getValue("isbn") as string | null) ?? "-"}</div>
      },
    },
    {
      accessorKey: "publisher",
      header: "Publisher",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{(row.getValue("publisher") as string | null) ?? "-"}</div>
      },
    },
    {
      accessorKey: "year",
      header: "Year of publish",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{(row.getValue("year") as string | null) ?? "-"}</div>
      },
    },
    {
      accessorKey: "status",
      header: "การคัดโดย AI",
      cell: ({ row }) => {
        const status = row.getValue("status") as Request["status"]
        const request = row.original
        const badgeVariant = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending"
        const badgeText = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"
        return (
          <button type="button" onClick={() => onOpenAISelectionDetail?.(request)}>
            <Badge variant={badgeVariant}>
              {badgeText}
            </Badge>
          </button>
        )
      },
    },
    {
      accessorKey: "review_status",
      header: "สถานะ",
      cell: ({ row }) => {
        const reviewStatus = row.getValue("review_status") as string | null
        
        let displayText = "รอดำเนินการ"
        let textColor = "text-gray-600"
        
        if (reviewStatus === "APPROVE_REVIEW") {
          displayText = "เลือกแล้ว"
          textColor = "text-blue-600"
        } else if (reviewStatus === "REJECT_REVIEW") {
          displayText = "ปฏิเสธ"
          textColor = "text-red-600"
        } else {
          displayText = "รอดำเนินการ"
          textColor = "text-gray-600"
        }
        
        return (
          <span className={`text-sm ${textColor}`}>
            {displayText}
          </span>
        )
      },
    },
    {
      id: "details",
      header: "",
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenDetails?.(request)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-muted hover:text-foreground"
              aria-label={`View details for ${request.title}`}
            >
              <ExternalLink className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ]

  return columns
}
