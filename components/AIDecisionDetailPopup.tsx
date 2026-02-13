"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export type AIDecisionCriterion = {
  id: number
  title: string
  score: number
}

export type AIDecisionDetailData = {
  status: "approved" | "rejected"
  reason: string
  totalScore: number
  criteria: AIDecisionCriterion[]
}

type AIDecisionDetailPopupProps = {
  open: boolean
  data: AIDecisionDetailData | null
  onClose: () => void
}

export function AIDecisionDetailPopup({ open, data, onClose }: AIDecisionDetailPopupProps) {
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
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">เหตุผลการตัดสินใจของ AI</h2>
            <Badge variant={data.status === "approved" ? "approved" : "rejected"}>
              {data.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto bg-muted/30">
          <div className="space-y-4 p-4">
            <div className="rounded-md border border-border bg-background p-3">
              <p className="text-sm leading-7">{data.reason}</p>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-background">
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <h3 className="text-base font-semibold">คะแนนคุณเกณฑ์การคัดเลือกจาก AI ( รวม {data.totalScore} คะแนน )</h3>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">No.</th>
                      <th className="px-4 py-3 font-medium">เกณฑ์การคัดเลือก</th>
                      <th className="px-4 py-3 text-right font-medium">คะแนนจาก AI / 10</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3">{criterion.id}</td>
                        <td className="px-4 py-3 font-semibold">{criterion.title}</td>
                        <td className="px-4 py-3 text-right font-semibold">{criterion.score} คะแนน</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
