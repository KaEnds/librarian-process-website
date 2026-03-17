"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

const formatPrice = (value?: string) => {
  if (!value) return "-"
  const numeric = Number.parseFloat(String(value).replace(/,/g, ""))
  if (!Number.isFinite(numeric)) return "-"
  return numeric.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export type VendorQuoteItem = {
  id: number
  quote_id: number
  evaluation_id: number
  title: string
  quantity: number
  unit: string
  unit_price: string
  total_price: string
  net_price?: string
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
): ColumnDef<VendorQuoteItem>[] => {
  const baseColumns: ColumnDef<VendorQuoteItem>[] = [
    {
      accessorKey: "evaluation_id",
      header: "Evaluation ID",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("evaluation_id") || "-"}</div>
      },
    },
    {
      accessorKey: "title",
      header: () => <span className="text-xs">Title</span>,
      size: 250,
      maxSize: 350,
      cell: ({ row }) => {
        const title = row.getValue("title") as string
        return (
          <div className="max-w-[350px] truncate text-xs font-medium" title={title || "-"}>
            {title || "-"}
          </div>
        )
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
        return <div className="text-sm text-gray-600">{formatPrice(row.original.unit_price)}</div>
      },
    },
    {
      accessorKey: "total_price",
      header: "ราคาสุทธิ",
      cell: ({ row }) => {
        return <div className="text-sm text-gray-600">{formatPrice(row.original.net_price || row.original.total_price)}</div>
      },
    },
    {
      accessorKey: "vendor_name",
      header: () => <span className="text-xs">ร้านค้า</span>,
      size: 150,
      maxSize: 170,
      cell: ({ row }) => {
        const vendorName = row.getValue("vendor_name") as string
        return (
          <div className="max-w-[170px] truncate text-xs text-gray-600" title={vendorName || "-"}>
            {vendorName || "-"}
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

