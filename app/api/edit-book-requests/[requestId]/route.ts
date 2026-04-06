import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { updateBookRequestDetails, type UpdateBookRequestDetailsInput } from "@/lib/db"

const updateBookRequestSchema = z.object({
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  authors: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  isbnIssn: z.string().nullable().optional(),
  publicationYear: z.union([z.number().int(), z.string(), z.null()]).optional(),
  year: z.union([z.number().int(), z.string(), z.null()]).optional(),
  publisher: z.string().nullable().optional(),
})

type RouteContext = {
  params: Promise<{
    requestId: string
  }>
}

const normalizeText = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmedValue = value.trim()
  return trimmedValue && trimmedValue !== "-" ? trimmedValue : null
}

const normalizePublicationYear = (value: number | string | null | undefined) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue || trimmedValue === "-") {
    return null
  }

  const parsedYear = Number(trimmedValue)
  return Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : null
}

const buildUpdatePayload = (payload: z.infer<typeof updateBookRequestSchema>): UpdateBookRequestDetailsInput => {
  const updates: UpdateBookRequestDetailsInput = {}

  if (payload.title !== undefined) {
    updates.title = normalizeText(payload.title)
  }

  if (payload.authors !== undefined || payload.author !== undefined) {
    updates.authors = normalizeText(payload.authors ?? payload.author)
  }

  if (payload.isbnIssn !== undefined || payload.isbn !== undefined) {
    updates.isbn_issn = normalizeText(payload.isbnIssn ?? payload.isbn)
  }

  if (payload.publicationYear !== undefined || payload.year !== undefined) {
    updates.publication_year = normalizePublicationYear(payload.publicationYear ?? payload.year)
  }

  if (payload.publisher !== undefined) {
    updates.publisher = normalizeText(payload.publisher)
  }

  return updates
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { requestId } = await params
    const parsedRequestId = Number(requestId)

    if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
      return NextResponse.json({ message: "Invalid requestId" }, { status: 400 })
    }

    const body = await request.json()
    const validation = updateBookRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid update payload", errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const updates = buildUpdatePayload(validation.data)
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "At least one field is required: title, author, isbn, year, publisher" },
        { status: 400 }
      )
    }

    const updatedBookRequest = await updateBookRequestDetails(parsedRequestId, updates)

    if (!updatedBookRequest) {
      return NextResponse.json(
        { message: `Book request with ID ${parsedRequestId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: "Book request details updated successfully",
        data: updatedBookRequest,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating book request details:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
}