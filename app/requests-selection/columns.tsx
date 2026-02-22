"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react"
import { RequestDetails } from "@/components/RequestDetailsPopup"
import { AIDecisionDetailData } from "@/components/AIDecisionDetailPopup"

export type Request = {
  id: number
  title: string
  author: string
  isbn: string
  publisher: string
  year: string
  status: "approved" | "rejected"
  action: "selected" | "pending"
  details: RequestDetails
  aiSelectionDetail: AIDecisionDetailData
}

export const getColumns = (
  showCheckbox: boolean,
  onSelectionChange?: (requestId: number, checked: boolean) => void,
  onOpenDetails?: (request: Request) => void,
  onOpenAISelectionDetail?: (request: Request) => void
): ColumnDef<Request>[] => {
  const baseColumns: ColumnDef<Request>[] = [
    {
      accessorKey: "id",
      header: "No.",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("id")}</div>
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return <div className="font-bold text-sm">{row.getValue("title")}</div>
      },
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("author")}</div>
      },
    },
    {
      accessorKey: "isbn",
      header: "ISBN/ISSN",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("isbn")}</div>
      },
    },
    {
      accessorKey: "publisher",
      header: "Publisher",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("publisher")}</div>
      },
    },
    {
      accessorKey: "year",
      header: "Year of publish",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("year")}</div>
      },
    },
    {
      accessorKey: "status",
      header: "การคัดโดย AI",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const request = row.original
        return (
          <button type="button" onClick={() => onOpenAISelectionDetail?.(request)}>
            <Badge variant={status === "approved" ? "approved" : "rejected"}>
              {status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          </button>
        )
      },
    },
    {
      accessorKey: "action",
      header: "สถานะ",
      cell: ({ row }) => {
        const action = row.getValue("action") as string
        const isSelectedByCheckbox = row.getIsSelected()
        const isSelected = showCheckbox ? isSelectedByCheckbox : action === "selected"
        return (
          <span className="text-sm text-blue-600">
            {isSelected ? "เลือกแล้ว" : "รอดำเนินการ"}
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
      header: ({ table }) => (
        <Checkbox
          className="h-5 w-5"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (onSelectionChange) {
              table.getRowModel().rows.forEach((row) => {
                onSelectionChange(row.original.id, !!value)
              })
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          className="h-5 w-5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
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
