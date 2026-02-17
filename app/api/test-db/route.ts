import test from "node:test";
import { testConnection } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const response = await testConnection();
        if (response) {
            return new Response(JSON.stringify({ message: "Database connection successful" }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ message: "Database connection failed" }), { status: 500 });
        }
    } catch (error: any) {
        return new Response(JSON.stringify({ message: "Database connection failed", error: error.message }), { status: 500 });
    }
}