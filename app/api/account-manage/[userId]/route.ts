import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deleteWebUserById, getWebUserById, updateWebUserAccount } from "@/lib/db"

const updateWebUserSchema = z.object({
  userRole: z.enum(["admin", "librarian", "director"]),
  accountStatus: z.enum(["active", "inactive"]),
})

type RouteContext = {
  params: Promise<{
    userId: string
  }>
}

const getSessionUser = async (request: NextRequest) => {
  const session = request.cookies.get("auth_session")?.value
  if (!session) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }
  }

  const userId = Number(session)
  if (!Number.isInteger(userId) || userId <= 0) {
    return { error: NextResponse.json({ message: "Invalid session" }, { status: 401 }) }
  }

  const currentUser = await getWebUserById(userId)
  if (!currentUser) {
    return { error: NextResponse.json({ message: "User not found" }, { status: 404 }) }
  }

  if (currentUser.user_role?.toLowerCase() !== "admin") {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }
  }

  return { currentUser }
}

const parseTargetUserId = (rawUserId: string) => {
  const userId = Number(rawUserId)
  if (!Number.isInteger(userId) || userId <= 0) {
    return null
  }
  return userId
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getSessionUser(request)
    if (auth.error) {
      return auth.error
    }

    const { userId } = await params
    const targetUserId = parseTargetUserId(userId)
    if (!targetUserId) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 })
    }

    const requestData = await request.json()
    const validation = updateWebUserSchema.safeParse(requestData)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid update payload", errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    if (auth.currentUser.user_id === targetUserId && validation.data.accountStatus === "inactive") {
      return NextResponse.json(
        { message: "Cannot deactivate your own account" },
        { status: 400 }
      )
    }

    const updatedUser = await updateWebUserAccount(
      targetUserId,
      validation.data.userRole,
      validation.data.accountStatus
    )

    if (!updatedUser) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 })
    }

    return NextResponse.json(
      { message: "Account updated", user: updatedUser },
      { status: 200 }
    )
  } catch (error: unknown) {
    const apiError = error as { message?: string }
    return NextResponse.json(
      { message: "Error updating account", error: apiError?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getSessionUser(request)
    if (auth.error) {
      return auth.error
    }

    const { userId } = await params
    const targetUserId = parseTargetUserId(userId)
    if (!targetUserId) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 })
    }

    if (auth.currentUser.user_id === targetUserId) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    const deleted = await deleteWebUserById(targetUserId)
    if (!deleted) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Account deleted" }, { status: 200 })
  } catch (error: unknown) {
    const apiError = error as { message?: string }
    return NextResponse.json(
      { message: "Error deleting account", error: apiError?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
