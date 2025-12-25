import { type NextRequest, NextResponse } from "next/server"
import { verifyApiToken } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  // Check API token
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const verification = await verifyApiToken(token)

  if (!verification.valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("user_id")

  if (!userId) {
    return NextResponse.json({ error: "user_id parameter required" }, { status: 400 })
  }

  // In production, query Supabase analysis_packets table
  console.log("[v0] Fetching analyses for user:", userId)

  // Return mock data
  return NextResponse.json({
    success: true,
    count: 0,
    data: [],
    message: "Query successful (no analyses found in demo mode)",
  })
}
