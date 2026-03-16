import { updatePurchaseDecisionByApprovedQuotes, PurchaseDecision } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { decision } = body;

    const validDecisions: PurchaseDecision[] = ['APPROVE', 'REJECT', 'WAIT_FOR_APPROVAL'];
    if (!decision || !validDecisions.includes(decision)) {
      return NextResponse.json(
        { message: "Invalid decision. Must be one of: APPROVE, REJECT, WAIT_FOR_APPROVAL" },
        { status: 400 }
      );
    }

    const updatedCount = await updatePurchaseDecisionByApprovedQuotes(decision);

    return NextResponse.json(
      {
        message: `Purchase decision updated to ${decision} for ${updatedCount} approval(s)`,
        updatedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating purchase decision:', error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
