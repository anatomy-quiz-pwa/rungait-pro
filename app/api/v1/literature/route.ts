import { type NextRequest, NextResponse } from "next/server"
import { getMockLiteratureNorms } from "@/lib/admin-mock-data"
import { verifyApiToken } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phase = searchParams.get("phase")
  const joint = searchParams.get("joint")
  const yearMin = searchParams.get("year_min")
  const yearMax = searchParams.get("year_max")

  let literature = getMockLiteratureNorms()

  // Apply filters
  if (phase) {
    literature = literature.filter((item) => item.phase === phase)
  }
  if (joint) {
    literature = literature.filter((item) => item.joint === joint)
  }
  if (yearMin) {
    literature = literature.filter((item) => item.year >= Number.parseInt(yearMin))
  }
  if (yearMax) {
    literature = literature.filter((item) => item.year <= Number.parseInt(yearMax))
  }

  return NextResponse.json({
    success: true,
    count: literature.length,
    data: literature,
  })
}

export async function POST(request: NextRequest) {
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

  // Parse body and create new literature entry
  const body = await request.json()

  // In production, insert into Supabase literature_norms table
  console.log("[v0] Creating literature entry:", body)

  return NextResponse.json({
    success: true,
    message: "Literature entry created",
    id: `lit_${Date.now()}`,
  })
}
