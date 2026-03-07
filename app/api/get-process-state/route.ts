import { NextRequest, NextResponse } from "next/server";
import { getProcessStatus } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (!processId) {
      return NextResponse.json(
        { message: "processId is required" },
        { status: 400 }
      );
    }

    const status = await getProcessStatus(parseInt(processId));

    if (!status) {
      return NextResponse.json(
        { message: `Process with ID ${processId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        processId: parseInt(processId),
        status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error getting process status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
