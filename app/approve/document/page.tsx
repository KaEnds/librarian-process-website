"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildApprovalDocumentHtml, type ApprovalDocumentItem } from "@/utils/approval-document"

type DocumentPayload = {
  items: ApprovalDocumentItem[]
  batchDateText?: string | null
  generatedAt?: string
}

const STORAGE_KEY = "approve-document-payload"

export default function ApproveDocumentPage() {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)

  const [payload, setPayload] = useState<DocumentPayload | null>(null)
  const [htmlContent, setHtmlContent] = useState("")

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setPayload({ items: [] })
      return
    }

    try {
      const parsed = JSON.parse(raw) as DocumentPayload
      setPayload(parsed)
    } catch {
      setPayload({ items: [] })
    }
  }, [])

  const initialHtml = useMemo(() => {
    return buildApprovalDocumentHtml(payload?.items ?? [], payload?.batchDateText)
  }, [payload])

  useEffect(() => {
    setHtmlContent(initialHtml)
  }, [initialHtml])

  const applyCommand = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
    setHtmlContent(editorRef.current?.innerHTML ?? "")
  }

  const handleExportText = () => {
    const plainText = editorRef.current?.innerText ?? ""
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "approval-document.txt"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const itemsCount = payload?.items?.length ?? 0

  return (
    <div className="w-full p-8 bg-gray-50 h-[calc(100vh-80px)] overflow-y-auto">
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">กำหนดการ</span>
          <span className="text-sm text-gray-600">{payload?.batchDateText ?? "-"}</span>
        </div>
      </div>

      <div className="border border-gray-200 bg-white rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-xl font-bold">รายละเอียดขอซื้อทรัพยากรสารสนเทศ</h1>
            <span className="text-blue-600 text-sm font-semibold">{itemsCount} รายการ</span>
          </div>
          <p className="text-sm text-gray-600">เลขที่ใบจัดซื้อ {payload?.items?.[0]?.evaluation_id ?? "-"}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white" onClick={handleExportText}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push("/approve")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => applyCommand("undo")}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("redo")}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("bold")}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("italic")}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("underline")}>
            <Underline className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("insertUnorderedList")}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyCommand("insertOrderedList")}>
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        <div
          ref={editorRef}
          className="p-8 min-h-[520px] leading-8 text-[16px] outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={() => setHtmlContent(editorRef.current?.innerHTML ?? "")}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
