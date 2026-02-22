import { getBookRequestsByBatches } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
    try {
        const response = await getBookRequestsByBatches();
        if (response) {
            return NextResponse.json({ data: response }, { status: 200 });
        }else {
            return NextResponse.json({ message: "No book requests found" }, { status: 404 });
        }
        

    }catch (error: any) {
        return NextResponse.json({ message: "Error fetching book requests", error: error.message }, { status: 500 });
    }

}