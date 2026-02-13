"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Send, X } from "lucide-react"

export type ConfirmRequestItem = {
  id: number
  title: string
  author: string
  isbn: string
  publisher: string
  status: "approved" | "rejected"
}

type ConfirmRequestPopupProps = {
  open: boolean
  requests: ConfirmRequestItem[]
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmRequestPopup({
  open,
  requests,
  onClose,
  onConfirm,
}: ConfirmRequestPopupProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">ส่งคำร้องไปยังขั้นตอนถัดไป</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-muted/30 p-4">
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="bg-background">No.</TableHead>
                    <TableHead className="bg-background">Title</TableHead>
                    <TableHead className="bg-background">Author</TableHead>
                    <TableHead className="bg-background">ISBN/ISSN</TableHead>
                    <TableHead className="bg-background">Publisher</TableHead>
                    <TableHead className="bg-background text-right">การคัดโดย AI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell className="font-semibold">{request.title}</TableCell>
                        <TableCell>{request.author}</TableCell>
                        <TableCell>{request.isbn}</TableCell>
                        <TableCell>{request.publisher}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Badge variant={request.status === "approved" ? "approved" : "rejected"}>
                              {request.status === "approved" ? "Approved" : "Rejected"}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ยังไม่มีคำร้องที่มีสถานะเลือกแล้ว
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-lg font-semibold">คำร้องที่เลือกทั้งหมด <span className="text-sm text-primary">{requests.length} รายการ</span></p>
              <p className="text-sm text-muted-foreground">ประจำวันที่ 6 ตุลาคม 2568</p>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onConfirm}>
              <Send className="w-4 h-4 mr-2" />
              ยืนยันส่งคำร้อง
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
