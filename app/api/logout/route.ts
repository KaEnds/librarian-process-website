import { NextResponse } from "next/server";

export const POST = async () => {
  const response = NextResponse.json({ message: "Logout successful" }, { status: 200 });

  response.cookies.set("auth_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
};
