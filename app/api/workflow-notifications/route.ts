import { NextRequest, NextResponse } from "next/server"
import {
  createWorkflowNotification,
  getRecentWorkflowCompletionNotifications,
} from "@/lib/db"

const COMPLETION_STATUSES = new Set(["DONE", "COMPLETED", "SUCCESS", "SUCCEEDED", "FINISHED"])
const FAILURE_STATUSES = new Set(["FAIL", "FAILED", "ERROR", "ERRORED", "FAILURE"])
const TRACKED_STATUSES = new Set([...COMPLETION_STATUSES, ...FAILURE_STATUSES])

const normalizeStatus = (value: unknown): string => {
  if (typeof value !== "string") {
    return "UNKNOWN"
  }

  return value.trim().toUpperCase()
}

const getSecretFromRequest = (request: NextRequest): string | null => {
  const headerSecret = request.headers.get("x-webhook-secret")
  if (headerSecret) {
    return headerSecret
  }

  const secretFromQuery = new URL(request.url).searchParams.get("secret")
  return secretFromQuery
}

const isAuthorized = (request: NextRequest): boolean => {
  const requiredSecret = process.env.N8N_WEBHOOK_SECRET
  if (!requiredSecret) {
    return true
  }

  const providedSecret = getSecretFromRequest(request)
  return providedSecret === requiredSecret
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "100", 10)
    const limit = Number.isNaN(parsedLimit) ? 100 : Math.min(Math.max(parsedLimit, 1), 500)

    const data = await getRecentWorkflowCompletionNotifications(limit)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error fetching workflow notifications",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const status = normalizeStatus(body?.status)

    if (!TRACKED_STATUSES.has(status)) {
      return NextResponse.json(
        {
          message: "Workflow notification accepted but not stored (status is not tracked)",
          status,
        },
        { status: 202 },
      )
    }

    const workflowName =
      typeof body?.workflowName === "string" ? body.workflowName :
      typeof body?.workflow_name === "string" ? body.workflow_name :
      null

    const executionId =
      typeof body?.executionId === "string" ? body.executionId :
      typeof body?.execution_id === "string" ? body.execution_id :
      null

    const isFailure = FAILURE_STATUSES.has(status)

    const message =
      typeof body?.message === "string" && body.message.trim().length > 0
        ? body.message
        : isFailure
          ? "Workflow ทำงานล้มเหลว"
          : "Workflow ทำงานเสร็จสิ้น"

    const source =
      typeof body?.source === "string" ? body.source : "n8n"

    const created = await createWorkflowNotification({
      source,
      workflowName,
      executionId,
      status,
      message,
      details: body,
    })

    return NextResponse.json(
      {
        message: "Workflow notification stored",
        data: created,
      },
      { status: 201 },
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error storing workflow notification",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    )
  }
}
