"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export type RequesterInfo = {
  name: string
  studentId: string
  status: string
  faculty: string
  major: string
}

export type RequestDetails = {
  title: string
  author: string
  isbn: string
  year: string
  publisher: string
  branch: string
  aiStatus: "approved" | "rejected"
  requestReason: string
  detailReason: string
  requester: RequesterInfo
}

type RequestDetailsPopupProps = {
  open: boolean
  data: RequestDetails | null
  onClose: () => void
}

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Input value={value} readOnly className="h-9 border-gray-300 bg-background" />
    </div>
  )
}

export function RequestDetailsPopup({ open, data, onClose }: RequestDetailsPopupProps) {
  if (!open || !data) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">รายละเอียดคำร้องขอจัดซื้อ</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-muted/30">
          <div className="space-y-4 p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ReadOnlyField label="Title" value={data.title} />
                <ReadOnlyField label="Author" value={data.author} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ReadOnlyField label="ISBN/ISSN" value={data.isbn} />
                <ReadOnlyField label="Year of Publication" value={data.year} />
                <ReadOnlyField label="Publisher" value={data.publisher} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ReadOnlyField label="For Branch" value={data.branch} />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">การตีความ AI</p>
                  <div className="flex h-9 items-center rounded-md border border-input bg-background px-3">
                    <Badge variant={data.aiStatus === "approved" ? "approved" : "rejected"}>
                      {data.aiStatus === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>
                </div>
                <div />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-sm border border-border bg-muted/20">
              <div className="border-r border-border">
                <div className="border-b border-border bg-background px-4 py-2">
                  <h3 className="text-sm font-semibold">ข้อมูลผู้ร้องขอ</h3>
                </div>
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField label="ชื่อ-นามสกุล" value={data.requester.name} />
                    <ReadOnlyField label="เลขรหัสประจำตัว" value={data.requester.studentId} />
                    <ReadOnlyField label="สถานะ" value={data.requester.status} />
                    <ReadOnlyField label="คณะ" value={data.requester.faculty} />
                    <div className="col-span-1">
                      <ReadOnlyField label="สาขาวิชา" value={data.requester.major} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="border-b border-border bg-background px-4 py-2">
                  <h3 className="text-sm font-semibold">เหตุผลการร้องขอจัดซื้อ</h3>
                </div>
                <div className="space-y-4 p-4">
                  <ReadOnlyField label="Request reason" value={data.requestReason} />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Specify reason</p>
                    <textarea
                      value={data.detailReason}
                      readOnly
                      rows={5}
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
