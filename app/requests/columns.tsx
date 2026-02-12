"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react"

export type Request = {
  id: number
  title: string
  author: string
  isbn: string
  publisher: string
  year: string
  status: "approved" | "rejected"
  action: "selected" | "pending"
}

export const getColumns = (showCheckbox: boolean, onSelectionChange?: (rowId: string, checked: boolean) => void): ColumnDef<Request>[] => {
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
      header: "การตีความ AI",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "approved" ? "approved" : "rejected"}>
            {status === "approved" ? "Approved" : "Rejected"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "action",
      header: "",
      cell: ({ row }) => {
        const action = row.getValue("action") as string
        return (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm text-blue-600">
              {action === "selected" ? "เลือกแล้ว" : "รอดำเนินการ"}
            </span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
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
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (onSelectionChange) {
              table.getRowModel().rows.forEach((row) => {
                onSelectionChange(row.id, !!value)
              })
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            if (onSelectionChange) {
              onSelectionChange(row.id, !!value)
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
