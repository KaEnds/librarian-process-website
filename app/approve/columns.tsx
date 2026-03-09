"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink } from "lucide-react"

export type VendorQuoteItem = {
  id: number
  quote_id: number
  evaluation_id: number
  title: string
  quantity: number
  unit: string
  unit_price: string
  total_price: string
  vendor_name: string
  net_score?: number
  passed_selection?: boolean
  review_status?: "PENDING_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW"
  batch_id?: number
  batch_status?: string
}

export const getColumns = (
  showCheckbox: boolean,
  selectedIds: Set<number>,
  onSelectionChange?: (quoteId: number, checked: boolean) => void,
  onOpenDetails?: (item: VendorQuoteItem) => void,
): ColumnDef<VendorQuoteItem>[] => {
  const baseColumns: ColumnDef<VendorQuoteItem>[] = [
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
        const title = row.getValue("title") as string
        return <div className="text-sm font-medium">{title || "-"}</div>
      },
    },
    {
      accessorKey: "quantity",
      header: "จำนวน",
      cell: ({ row }) => {
        return <div className="text-sm text-center">{row.getValue("quantity") || "-"}</div>
      },
    },
    {
      accessorKey: "unit",
      header: "หน่วย",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("unit") || "-"}</div>
      },
    },
    {
      accessorKey: "unit_price",
      header: "ราคาต่อหน่วย",
      cell: ({ row }) => {
        return <div className="text-sm text-right text-gray-600">{row.getValue("unit_price") || "-"}</div>
      },
    },
    {
      accessorKey: "total_price",
      header: "ราคาสุทธิ",
      cell: ({ row }) => {
        return <div className="text-sm text-right text-gray-600">{row.getValue("total_price") || "-"}</div>
      },
    },
    {
      accessorKey: "vendor_name",
      header: "ร้านค้า",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{row.getValue("vendor_name") || "-"}</div>
      },
    },
    {
      id: "details",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenDetails?.(item)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-muted hover:text-foreground"
              aria-label={`View details for ${item.title}`}
            >
              <ExternalLink className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ]

  if (showCheckbox) {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
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
      },
      ...baseColumns,
    ]
  }

  return baseColumns
}

