import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { updatePurchaseRemarkByApprovedQuotes } from "@/lib/db"

const updatePurchaseRemarkSchema = z.object({
  remark: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = updatePurchaseRemarkSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid remark payload", errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updatedCount = await updatePurchaseRemarkByApprovedQuotes(validation.data.remark)

    return NextResponse.json(
      {
        message: `Purchase approval remark updated for ${updatedCount} approval(s)`,
        updatedCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating purchase remark:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
}
