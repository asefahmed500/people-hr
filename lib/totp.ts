import { createHash, randomInt } from "node:crypto"

import { generateSecret, generateURI, verifySync } from "otplib"

export function generateSecretKey(): string {
  return generateSecret()
}

export function otpauthUrl(account: string, secret: string): string {
  return generateURI({ issuer: "PeopleHR", label: account, secret })
}

export function verifyTotp(token: string, secret: string): boolean {
  if (!token || !secret) return false
  try {
    const result = verifySync({ token: token.trim().replace(/\s+/g, ""), secret })
    return result.valid
  } catch {
    return false
  }
}

/** Backup codes are authentication credentials — they must be unpredictable. */
export function generateBackupCodes(count = 8): string[] {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const codes: string[] = []
  for (let i = 0; i < count; i += 1) {
    let code = ""
    for (let j = 0; j < 8; j += 1) {
      code += chars[randomInt(chars.length)]
    }
    codes.push(code)
  }
  return codes
}

/** Store a one-way digest; a database read must not yield usable 2FA codes. */
export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex")
}
