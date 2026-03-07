import { NextRequest, NextResponse } from "next/server";
import { getAllProcessStates } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const processStates = await getAllProcessStates();

    return NextResponse.json(
      {
        data: processStates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error getting all process states",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
