import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/db";

export async function GET(_request: NextRequest) {
    try {
        const response = await testConnection();
        if (response) {
            return NextResponse.json({ message: "Database connection successful" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: "Database connection failed", error: error.message }, { status: 500 });
    }
}