"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown } from "lucide-react"

export type Payment = {
  id: number
  title: string
  author: string
  cuBook: string
  seEdBook: string
  vendor3: string
  vendor4: string
  vendor5: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "No.",
  },
  {
    accessorKey: "title",
    header: () => (
      <div className="flex items-center gap-1">
        <span>Title</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "author",
    header: () => (
      <div className="flex items-center gap-1">
        <span>Author</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "cuBook",
    header: () => (
      <div className="flex items-center gap-1">
        <span>CU Book</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "seEdBook",
    header: () => (
      <div className="flex items-center gap-1">
        <span>SE-ED Book</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "vendor3",
    header: () => (
      <div className="flex items-center gap-1">
        <span>ร้านค้า 3</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "vendor4",
    header: () => (
      <div className="flex items-center gap-1">
        <span>ร้านค้า 4</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
  {
    accessorKey: "vendor5",
    header: () => (
      <div className="flex items-center gap-1">
        <span>ร้านค้า 5</span>
        <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
      </div>
    ),
  },
]