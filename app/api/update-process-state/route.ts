import { NextRequest, NextResponse } from "next/server";
import { updateProcessStatus } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, status } = body;

    if (!processId || !status) {
      return NextResponse.json(
        { message: "processId and status are required" },
        { status: 400 }
      );
    }

    const result = await updateProcessStatus(processId, status);

    if (!result) {
      return NextResponse.json(
        { message: `Process with ID ${processId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Process status updated successfully",
        processId,
        status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Error updating process status",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
