import { NextRequest, NextResponse } from "next/server"

const VENDOR_SELECTION_WEBHOOK_URL = "https://n8n.librairy.work/webhook/62c21077-a164-4efa-b201-4da8a523d0c0"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = new URLSearchParams({
      source: String(body?.source ?? "quote-comparison"),
      requestedFrom: "librarian-process-website",
      triggeredAt: String(body?.triggeredAt ?? new Date().toISOString()),
    })

    const response = await fetch(`${VENDOR_SELECTION_WEBHOOK_URL}?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    })

    const responseText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Failed to trigger vendor selection webhook",
          status: response.status,
          n8nResponse: responseText || null,
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        message: "Vendor selection workflow triggered",
        n8nResponse: responseText || null,
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error triggering vendor selection webhook",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    )
  }
}
