import { NextRequest, NextResponse } from "next/server";
import { getAllWebUsers, getWebUserById } from "@/lib/db";

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

    const currentUser = await getWebUserById(userId);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.user_role?.toLowerCase() !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await getAllWebUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error: unknown) {
    const apiError = error as { message?: string };
    return NextResponse.json(
      { message: "Failed to fetch account management users", error: apiError?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
};
