import { insertVendorQuote } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createVendorQuoteSchema = z.object({
  title: z.string().trim().min(1),
  authors: z.string().trim().min(1),
  isbn_issn: z.string().trim().optional().nullable(),
  book_format: z.string().trim().optional().nullable(),
  unit_price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive(),
  discount_type: z.string().trim().optional().nullable(),
  net_price: z.coerce.number().nonnegative(),
  currency: z.string().trim().min(1),
  platform: z.string().trim().optional().nullable(),
  availability: z.string().trim().optional().nullable(),
  estimated_delivery_day: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  vendor_name: z.string().trim().min(1),
  contact_person: z.string().trim().optional().nullable(),
  vendor_email: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional(),
  telephone_number: z.string().trim().optional().nullable(),
})

const normalizeText = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const validation = createVendorQuoteSchema.safeParse(requestData)

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid payload for creating vendor quote",
          errors: validation.error.flatten(),
        },
        { status: 400 },
      )
    }

    const createdVendorQuote = await insertVendorQuote({
      ...validation.data,
      isbn_issn: normalizeText(validation.data.isbn_issn),
      book_format: normalizeText(validation.data.book_format),
      discount_type: normalizeText(validation.data.discount_type),
      platform: normalizeText(validation.data.platform),
      availability: normalizeText(validation.data.availability),
      contact_person: normalizeText(validation.data.contact_person),
      vendor_email: normalizeText(validation.data.vendor_email),
      telephone_number: normalizeText(validation.data.telephone_number),
    })

    return NextResponse.json(
      {
        message: "Vendor quote created successfully",
        data: createdVendorQuote,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating vendor quote:", error)

    if (error?.code === "EVALUATION_NOT_FOUND") {
      return NextResponse.json(
        {
          message: "No matching evaluation_id found. Vendor quote was not inserted.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        message: "Error creating vendor quote",
        error: error.message,
      },
      { status: 500 },
    )
  }
}