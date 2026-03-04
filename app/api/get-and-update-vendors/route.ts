import { deleteVendor, getAllVendor, insertVendor } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const vendorInsertSchema = z.object({
    vendorName: z.string().trim().min(1),
    contactPerson: z.string().trim().min(1),
    vendorEmail: z.string().trim().email(),
    telephoneNumber: z.string().trim().min(1),
    lineId: z.string().trim().min(1),
    isActive: z.boolean().optional(),
});

const vendorDeleteSchema = z.object({
    vendorIds: z.array(z.number().int().positive()).min(1),
});

export async function GET() {
    try {
        const vendors = await getAllVendor();
        return NextResponse.json({ data: vendors }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error fetching vendors", error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const requestData = await request.json();
        const validation = vendorInsertSchema.safeParse(requestData);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Invalid vendor payload", errors: validation.error.flatten() },
                { status: 400 }
            );
        }

        const vendorId = await insertVendor(
            validation.data.vendorName,
            validation.data.contactPerson,
            validation.data.vendorEmail,
            validation.data.telephoneNumber,
            validation.data.lineId,
            validation.data.isActive ?? true
        );

        return NextResponse.json({ message: "Vendor inserted", vendorId }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error inserting vendor", error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const requestData = await request.json();
        const validation = vendorDeleteSchema.safeParse(requestData);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Invalid delete payload", errors: validation.error.flatten() },
                { status: 400 }
            );
        }

        await Promise.all(validation.data.vendorIds.map((vendorId) => deleteVendor(vendorId)));

        return NextResponse.json({ message: "Vendors deleted" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: "Error deleting vendors", error: error.message }, { status: 500 });
    }
}