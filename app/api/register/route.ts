import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const { username, email, password, confirmPassword } = await request.json();

  console.log("Registration attempt:", { username, email, password, confirmPassword });

  return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
}