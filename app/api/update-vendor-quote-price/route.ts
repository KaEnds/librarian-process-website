import { updateVendorQuoteNetPriceByEvaluationAndVendor } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateVendorQuotePriceSchema = z.object({
  evaluationId: z.number().int().positive(),
  vendorName: z.string().trim().min(1),
  netPrice: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const validation = updateVendorQuotePriceSchema.safeParse(requestData);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid payload for updating vendor quote price",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updatedRows = await updateVendorQuoteNetPriceByEvaluationAndVendor(
      validation.data.evaluationId,
      validation.data.vendorName,
      validation.data.netPrice,
    );

    return NextResponse.json(
      {
        message: `${updatedRows.length} vendor quote(s) updated successfully`,
        data: updatedRows,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating vendor quote price:", error);
    return NextResponse.json(
      {
        message: "Error updating vendor quote price",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
