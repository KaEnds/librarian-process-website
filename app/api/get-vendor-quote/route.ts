import { getAllVendorQuotes } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const response = await getAllVendorQuotes();
        if (response) {
            return NextResponse.json({ data: response }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No vendor quotes found" }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ message: "Error fetching vendor quotes", error: error.message }, { status: 500 });
    }
}
