const TOKEN_KEY = "auth_token"
const USER_DATA_KEY = "user_data"

export interface UserData {
  id: string
  email: string
  name: string
  role: string
  organizationName?: string | null
  phone?: string | null
  roleInOrganization?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Save JWT token to localStorage
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

/**
 * Save user data to localStorage and cookie
 */
export function saveUserData(user: UserData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    // Also save to cookie for server-side access
    const userDataJson = JSON.stringify(user)
    document.cookie = `user_data=${encodeURIComponent(userDataJson)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  }
}

/**
 * Get user data from localStorage
 */
export function getUserData(): UserData | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(USER_DATA_KEY)
    if (data) {
      try {
        return JSON.parse(data) as UserData
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Remove user data from localStorage and cookie
 */
export function removeUserData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_DATA_KEY)
    document.cookie = "user_data=; path=/; max-age=0"
  }
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

/**
 * Remove JWT token from localStorage (logout)
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
    document.cookie = "auth_token=; path=/; max-age=0"
  }
  removeUserData()
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null
}

/**
 * Decode JWT token to get payload (without verification)
 * Note: This is for client-side use only. Server should verify the token properly.
 */
export function decodeToken(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  return Date.now() >= decoded.exp * 1000
}

/**
 * Validate token (exists and not expired)
 */
export function isValidToken(): boolean {
  const token = getToken()
  if (!token) return false
  return !isTokenExpired(token)
}

