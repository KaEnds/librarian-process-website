import { NextRequest, NextResponse } from "next/server";
import { registerWebUser } from "@/lib/db";

export const POST = async (request: NextRequest) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      userRole,
      accountStatus,
      name,
      surname,
    } = await request.json();

    if (!username || !password || !confirmPassword) {
      return NextResponse.json(
        { message: "username, password และ confirmPassword จำเป็นต้องส่งมา" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "password และ confirmPassword ไม่ตรงกัน" },
        { status: 400 }
      );
    }

    const createdUser = await registerWebUser({
      username,
      password,
      userRole: userRole ?? "admin",
      accountStatus: accountStatus ?? "active",
      name: name ?? username,
      surname: surname ?? "-",
    });

    return NextResponse.json(
      { message: "User registered successfully", user: createdUser },
      { status: 201 }
    );
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };

    if (dbError?.code === "23505") {
      return NextResponse.json(
        { message: "username นี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Registration failed", error: dbError?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}