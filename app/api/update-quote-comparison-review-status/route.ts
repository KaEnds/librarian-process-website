import { updateVendorQuoteReviewStatus, updateMultipleVendorQuoteReviewStatus, ReviewStatus } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, quoteIds, reviewStatus } = body;

    // Validate review status
    const validStatuses: ReviewStatus[] = ['PENDING_REVIEW', 'APPROVE_REVIEW', 'REJECT_REVIEW'];
    if (!reviewStatus || !validStatuses.includes(reviewStatus)) {
      return NextResponse.json(
        { 
          message: "Invalid review status. Must be one of: PENDING_REVIEW, APPROVE_REVIEW, REJECT_REVIEW" 
        }, 
        { status: 400 }
      );
    }

    // Update single quote
    if (quoteId) {
      const result = await updateVendorQuoteReviewStatus(quoteId, reviewStatus);
      return NextResponse.json(
        { 
          message: "Review status updated successfully", 
          data: result 
        }, 
        { status: 200 }
      );
    }

    // Update multiple quotes
    if (quoteIds && Array.isArray(quoteIds) && quoteIds.length > 0) {
      const results = await updateMultipleVendorQuoteReviewStatus(quoteIds, reviewStatus);
      return NextResponse.json(
        { 
          message: `${results.length} quote(s) updated successfully`, 
          data: results 
        }, 
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Missing quoteId or quoteIds" }, 
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { 
        message: "Error updating review status", 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
