"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ExternalLink } from "lucide-react"
import { AISelectionPopupData } from "@/components/AISelectionPopup"

export type QuoteComparison = {
  id: number
  title: string
  author: string
  cuBook: string
  vendorA: string
  vendorB: string
  aiStatus: "complete" | "processing" | "rejected"
  librarianSelection: string
  aiSelectionDetail: AISelectionPopupData
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
  onOpenAISelection?: (row: QuoteComparison) => void
): ColumnDef<QuoteComparison>[] => [
  {
    accessorKey: "id",
    header: "No.",
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
    cell: ({ row }) => <div className="font-bold text-sm">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "author",
    header: () => (
      <div className="flex items-center gap-1">
        <span>Author</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => <div className="text-sm text-gray-600">{row.getValue("author")}</div>,
  },
  {
    accessorKey: "cuBook",
    header: () => (
      <div className="flex items-center gap-1">
        <span>CU Book</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => <div className="text-sm text-gray-600">{row.getValue("cuBook")}</div>,
  },
  {
    accessorKey: "vendorA",
    header: () => (
      <div className="flex items-center gap-1">
        <span>นายอินทร์</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => <div className="text-sm text-gray-600">{row.getValue("vendorA")}</div>,
  },
  {
    accessorKey: "vendorB",
    header: () => (
      <div className="flex items-center gap-1">
        <span>นายอินทร์</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => <div className="text-sm text-gray-600">{row.getValue("vendorB")}</div>,
  },
  {
    accessorKey: "aiStatus",
    header: () => (
      <div className="flex items-center gap-1">
        <span>สถานะ AI</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("aiStatus") as QuoteComparison["aiStatus"]
      return <AIStatusBadge status={status} />
    },
  },
  {
    accessorKey: "librarianSelection",
    header: () => (
      <div className="flex items-center gap-1">
        <span>บรรณารักษ์เลือก</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
    cell: ({ row }) => {
      const value = row.getValue("librarianSelection") as string
      const isPending = value === "ยังไม่ได้เลือก"
      return <span className={`text-sm ${isPending ? "text-gray-400" : "text-blue-600"}`}>{value}</span>
    },
  },
  {
    id: "details",
    header: "",
    cell: ({ row }) => {
      const quote = row.original
      return (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onOpenAISelection?.(quote)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:bg-muted hover:text-foreground"
            aria-label="View details"
          >
            <ExternalLink className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    },
  },
]
