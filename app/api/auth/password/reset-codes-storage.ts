/**
 * Shared in-memory storage for password reset codes
 * In production, this should use a database like Redis or PostgreSQL
 */

export type ResetCodeData = {
  code: string
  email: string
  expiresAt: number
  attempts: number
}

// Shared Map instance for all password reset routes
export const resetCodes = new Map<string, ResetCodeData>()

// Cleanup expired codes periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of resetCodes.entries()) {
    if (value.expiresAt < now) {
      resetCodes.delete(key)
    }
  }
}, 60000) // Every minute

