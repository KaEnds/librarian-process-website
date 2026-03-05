import { NextRequest, NextResponse } from "next/server";
import { updateBookRequestReviewStatus } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, reviewStatus } = body;

    if (!requestId || !reviewStatus) {
      return NextResponse.json(
        { message: "requestId and reviewStatus are required" },
        { status: 400 }
      );
    }

    const result = await updateBookRequestReviewStatus(requestId, reviewStatus);

    if (!result) {
      return NextResponse.json(
        { message: `Book request with ID ${requestId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Book request review status updated successfully",
        requestId,
        reviewStatus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error updating book request status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
