"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react"
import { RequestDetails } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailData } from "@/components/AIDecisionDetailPopup"
import { isRequestNew } from "@/lib/request-notifications"

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
  requested_at: string | null
  details: RequestDetails
  aiSelectionDetail: AIDecisionDetailData
}

export const getColumns = (
  showCheckbox: boolean,
  selectedIds: Set<number>,
  onSelectionChange?: (requestId: number, checked: boolean) => void,
  onOpenDetails?: (request: Request) => void,
  onOpenAISelectionDetail?: (request: Request) => void
): ColumnDef<Request>[] => {
  const baseColumns: ColumnDef<Request>[] = [
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
      size: 180,
      maxSize: 200,
      cell: ({ row }) => {
        const request = row.original
        const isNew = request.request_id ? isRequestNew(request.request_id) : false
        const title = (row.getValue("title") as string | null) ?? "-"
        return (
          <div className="flex min-w-0 items-center gap-2">
            {isNew && (
              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
            )}
            <div className="max-w-[200px] truncate font-bold text-sm" title={title}>{title}</div>
          </div>
        )
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
        const isSelectedByCheckbox = selectedIds.has(row.original.id)
        
        let displayText = "รอดำเนินการ"
        let textColor = "text-gray-600"
        
        if (showCheckbox) {
          displayText = isSelectedByCheckbox ? "เลือกแล้ว" : "รอดำเนินการ"
          textColor = isSelectedByCheckbox ? "text-blue-600" : "text-gray-600"
        } else {
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

  if (showCheckbox) {
    const selectColumn: ColumnDef<Request> = {
      id: "select",
      header: ({ table }) => {
        const rows = table.getRowModel().rows
        const allRowsSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.original.id))

        return (
          <Checkbox
            className="h-5 w-5"
            checked={allRowsSelected}
            onCheckedChange={(value) => {
              if (onSelectionChange) {
                rows.forEach((row) => {
                  onSelectionChange(row.original.id, !!value)
                })
              }
            }}
            aria-label="Select all"
          />
        )
      },
      cell: ({ row }) => (
        <Checkbox
          className="h-5 w-5"
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(value) => {
            if (onSelectionChange) {
              onSelectionChange(row.original.id, !!value)
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    
    const columnsWithCheckbox = [...baseColumns]
    const actionColumnIndex = columnsWithCheckbox.length - 1
    if (actionColumnIndex >= 0) {
      columnsWithCheckbox.splice(actionColumnIndex, 0, selectColumn)
    } else {
      columnsWithCheckbox.push(selectColumn)
    }
    return columnsWithCheckbox
  }

  return baseColumns
}
