import { NextRequest, NextResponse } from "next/server";
import { getWebUserById } from "@/lib/db";

export const GET = async (request: NextRequest) => {
  try {
    const session = request.cookies.get("auth_session")?.value;
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const user = await getWebUserById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    const apiError = error as { message?: string };
    return NextResponse.json(
      { message: "Failed to fetch current user", error: apiError?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
};
