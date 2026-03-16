"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ExternalLink } from "lucide-react"
import { AISelectionPopupData, AISelectionVendorComparison } from "@/components/AISelectionPopup"

export type QuoteComparison = {
  id: number
  title: string
  author: string
  vendors: Record<string, string>
  aiStatus: "complete" | "processing" | "rejected"
  librarianSelection: string
  aiSelectionDetail: AISelectionPopupData
  batch_start_date?: string | null
  batch_end_date?: string | null
  batch_start_date_th?: string | null
  batch_end_date_th?: string | null
}

const AIStatusBadge = ({ status }: { status: QuoteComparison["aiStatus"] }) => {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Complete
      </span>
    )
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
      Processing
    </span>
  )
}

export const getColumns = (
  onOpenAISelection?: (row: QuoteComparison) => void,
  vendorNames: string[] = [],
  isEditMode: boolean = false,
  onVendorPriceChange?: (itemId: number, vendorName: string, value: string) => void,
  isVendorEditable?: (itemId: number, vendorName: string) => boolean,
  isActionDisabled: boolean = false,
): ColumnDef<QuoteComparison>[] => [
  {
    accessorKey: "id",
    header: "No.",
    size: 40,
    maxSize: 50,
    cell: ({ row }) => <div className="text-sm">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "title",
    header: () => (
      <div className="flex items-center gap-1">
        <span>Title</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    size: 180,
    maxSize: 200,
    cell: ({ row }) => {
      const title = row.getValue("title") as string
      return <div className="max-w-[200px] truncate font-bold text-sm" title={title}>{title}</div>
    },
  },
  {
    accessorKey: "author",
    header: () => (
      <div className="flex items-center gap-1">
        <span>Author</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    size: 120,
    maxSize: 150,
    cell: ({ row }) => <div className="text-sm text-gray-600 truncate">{row.getValue("author")}</div>,
  },
  ...vendorNames.map((vendorName) => ({
    id: `vendor_${vendorName}`,
    accessorFn: (row: QuoteComparison) => row.vendors[vendorName] || "-",
    size: 100,
    maxSize: 120,
    header: () => (
      <div className="flex items-center gap-1">
        <span className="truncate" title={vendorName}>{vendorName}</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }: { row: any }) => {
      const value = row.original.vendors[vendorName] || "-"
      const hasVendor = row.original.aiSelectionDetail.comparisonRows.some(
        (comparisonRow: AISelectionVendorComparison) => comparisonRow.vendor === vendorName,
      )
      const canEdit = isVendorEditable ? isVendorEditable(row.original.id, vendorName) : hasVendor

      if (isEditMode) {
        return (
          <input
            type="text"
            value={value === "-" ? "" : value}
            disabled={!canEdit}
            onChange={(event) => onVendorPriceChange?.(row.original.id, vendorName, event.target.value)}
            placeholder={canEdit ? "ราคา" : "-"}
            className="h-8 w-full rounded-md border border-gray-300 px-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        )
      }

      return <div className="text-sm text-gray-600 truncate">{value}</div>
    },
  })),
  {
    accessorKey: "aiStatus",
    header: () => (
      <div className="flex items-center gap-1">
        <span>สถานะ AI</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    size: 100,
    maxSize: 120,
    cell: ({ row }) => {
      const status = row.getValue("aiStatus") as QuoteComparison["aiStatus"]
      return <AIStatusBadge status={status} />
    },
  },
  {
    accessorKey: "librarianSelection",
    header: () => (
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap">บรรณารักษ์เลือก</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    size: 120,
    maxSize: 150,
    cell: ({ row }) => {
      const value = row.getValue("librarianSelection") as string
      const isPending = value === "ยังไม่ได้เลือก"
      return (
        <div
          className={`block w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm ${isPending ? "text-gray-400" : "text-blue-600"}`}
          title={value}
        >
          {value}
        </div>
      )
    },
  },
  {
    id: "details",
    header: "",
    size: 50,
    maxSize: 60,
    cell: ({ row }) => {
      const quote = row.original
      return (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={() => onOpenAISelection?.(quote)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            aria-label="View details"
          >
            <ExternalLink className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    },
  },
]
