"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileImage, Upload, X } from "lucide-react"

type UploadQuotationPopupProps = {
  open: boolean
  onClose: () => void
  onUpload?: (files: File[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"]

export function UploadQuotationPopup({ open, onClose, onUpload }: UploadQuotationPopupProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const totalSizeText = useMemo(() => {
    const size = files.reduce((sum, file) => sum + file.size, 0)
    const mb = size / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }, [files])

  if (!open) {
    return null
  }

  const mergeFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return
    }

    const incoming = Array.from(fileList).filter(
      (file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
    )

    setFiles((previous) => {
      const map = new Map(previous.map((file) => [`${file.name}-${file.size}`, file]))
      incoming.forEach((file) => map.set(`${file.name}-${file.size}`, file))
      return Array.from(map.values())
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    mergeFiles(event.target.files)
    event.target.value = ""
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    mergeFiles(event.dataTransfer.files)
  }

  const handleUpload = () => {
    if (files.length === 0) {
      return
    }

    onUpload?.(files)
    onClose()
    setFiles([])
  }

  const handleClose = () => {
    onClose()
    setFiles([])
    setIsDragOver(false)
  }

  const removeFile = (target: File) => {
    setFiles((previous) => previous.filter((file) => file !== target))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-4xl overflow-hidden rounded-md border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
          <h2 className="text-base font-semibold">Upload ใบเสนอราคา</h2>
          <button type="button" onClick={handleClose} className="text-red-400 hover:text-red-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-muted/30 p-6">
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-md border border-dashed p-10 text-center transition ${
              isDragOver ? "border-blue-300 bg-blue-50" : "border-border bg-background"
            }`}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm">Select a file or drag and drop here</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or PDF, file size no more than 10MB</p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 border-blue-300 text-blue-500 hover:bg-blue-50"
              onClick={() => inputRef.current?.click()}
            >
              SELECT FILE
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">File added</p>
              <div className="space-y-2 rounded-md border border-border bg-background p-3">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-sm px-2 py-1">
                    <div className="flex items-center gap-2 text-sm">
                      <FileImage className="h-4 w-4 text-sky-500" />
                      <span className="text-muted-foreground">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                      <button type="button" onClick={() => removeFile(file)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-xs text-muted-foreground">รวมทั้งหมด {totalSizeText}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-5 py-3">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleUpload} disabled={files.length === 0}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  )
}
