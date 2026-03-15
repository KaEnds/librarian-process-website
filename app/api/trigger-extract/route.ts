import { NextRequest, NextResponse } from "next/server"

const EXTRACT_WEBHOOK_URL = "https://n8n.librairy.work/webhook-test/28d2458c-ce93-49b2-aed7-6ad820411bfa"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const query = new URLSearchParams({
      source: String(body?.source ?? "quote-comparison"),
      requestedFrom: "librarian-process-website",
      triggeredAt: String(body?.triggeredAt ?? new Date().toISOString()),
    })

    const response = await fetch(`${EXTRACT_WEBHOOK_URL}?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    })

    const responseText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "Failed to trigger extract webhook",
          status: response.status,
          n8nResponse: responseText || null,
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        message: "Extract workflow triggered",
        n8nResponse: responseText || null,
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error triggering extract webhook",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    )
  }
}
