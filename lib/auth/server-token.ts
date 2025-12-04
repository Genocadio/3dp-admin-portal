import { cookies } from "next/headers"
import { decodeToken, isTokenExpired, type UserData } from "./token"

const TOKEN_COOKIE_NAME = "auth_token"
const USER_DATA_COOKIE_NAME = "user_data"

/**
 * Get JWT token from cookies (server-side)
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value || null
}

/**
 * Validate JWT token from cookie (server-side)
 */
export async function validateTokenFromCookie(): Promise<boolean> {
  const token = await getTokenFromCookie()
  if (!token) return false
  return !isTokenExpired(token)
}

/**
 * Get user info from JWT token (server-side)
 * Note: This decodes the token without verification. For production, verify the token signature.
 */
export async function getUserFromToken(): Promise<{ id?: string; role?: string; [key: string]: any } | null> {
  const token = await getTokenFromCookie()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded || null
}

/**
 * Get user data from cookie (server-side)
 */
export async function getUserDataFromCookie(): Promise<UserData | null> {
  const cookieStore = await cookies()
  const userDataCookie = cookieStore.get(USER_DATA_COOKIE_NAME)?.value
  if (!userDataCookie) return null
  try {
    return JSON.parse(decodeURIComponent(userDataCookie)) as UserData
  } catch {
    return null
  }
}

