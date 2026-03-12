import { createPolicy, deletePolicy, getPolicies, updatePolicy } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPolicySchema = z.object({
  policyCode: z.string().trim().min(1),
  description: z.string().trim().min(1),
  promptInstruction: z.string().trim().min(1),
  isActive: z.boolean().optional(),
});

const updatePolicySchema = z.object({
  policyId: z.number().int().positive(),
  policyCode: z.string().trim().min(1),
  description: z.string().trim().min(1),
  promptInstruction: z.string().trim().min(1),
  isActive: z.boolean(),
});

const deletePolicySchema = z.object({
  policyId: z.number().int().positive(),
});

export async function GET() {
  try {
    const policies = await getPolicies();
    return NextResponse.json({ data: policies }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching policies", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const validation = createPolicySchema.safeParse(requestData);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid policy payload", errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const createdPolicy = await createPolicy(
      validation.data.policyCode,
      validation.data.description,
      validation.data.promptInstruction,
      validation.data.isActive ?? true
    );

    return NextResponse.json(
      { message: "Policy created", data: createdPolicy },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error creating policy", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json();
    const validation = updatePolicySchema.safeParse(requestData);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid policy payload", errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedPolicy = await updatePolicy(
      validation.data.policyId,
      validation.data.policyCode,
      validation.data.description,
      validation.data.promptInstruction,
      validation.data.isActive
    );

    return NextResponse.json(
      { message: "Policy updated", data: updatedPolicy },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating policy", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const requestData = await request.json();
    const validation = deletePolicySchema.safeParse(requestData);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid delete payload", errors: validation.error.flatten() },
        { status: 400 }
      );
    }

    await deletePolicy(validation.data.policyId);

    return NextResponse.json(
      { message: "Policy deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error deactivating policy", error: error.message },
      { status: 500 }
    );
  }
}
