import crypto from "crypto"

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateToken(length = 48): string {
  const buf = crypto.randomBytes(length)
  return buf.toString("base64url")
}

export async function verifyApiToken(token: string): Promise<{ valid: boolean; userId?: string; scope?: string }> {
  // In production, this would check against Supabase api_tokens table
  // For now, simulate validation
  const hash = hashToken(token)

  // Mock validation - accept any token that starts with "gait_"
  if (token.startsWith("gait_")) {
    return {
      valid: true,
      userId: "user_api",
      scope: "read",
    }
  }

  return { valid: false }
}
