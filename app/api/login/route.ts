import { NextRequest, NextResponse } from "next/server";
import { loginWebUser } from "@/lib/db";

export const POST = async (request: NextRequest) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "username และ password จำเป็นต้องส่งมา" },
        { status: 400 }
      );
    }

    const user = await loginWebUser(username, password);

    if (!user) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (user.account_status !== "active") {
      return NextResponse.json(
        { message: "บัญชีนี้ยังไม่เปิดใช้งาน" },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      { message: "Login successful", user },
      { status: 200 }
    );

    response.cookies.set("auth_session", String(user.user_id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error: unknown) {
    const dbError = error as { message?: string };

    return NextResponse.json(
      { message: "Login failed", error: dbError?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
};
