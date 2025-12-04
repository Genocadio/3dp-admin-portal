import { NextResponse, type NextRequest } from "next/server"
import { decodeToken, isTokenExpired, type UserData } from "@/lib/auth/token"

const TOKEN_COOKIE_NAME = "auth_token"
const USER_DATA_COOKIE_NAME = "user_data"

function getUserDataFromCookie(request: NextRequest): UserData | null {
  const userDataCookie = request.cookies.get(USER_DATA_COOKIE_NAME)?.value
  if (!userDataCookie) return null
  try {
    return JSON.parse(decodeURIComponent(userDataCookie)) as UserData
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  const isAuthenticated = token && !isTokenExpired(token)
  
  const { pathname } = request.nextUrl

  // Redirect unauthenticated users to login (but allow API routes and auth pages)
  if (
    !isAuthenticated &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api") &&
    pathname !== "/"
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (except forgot-password)
  if (
    isAuthenticated &&
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/forgot-password") &&
    !pathname.startsWith("/auth/reset-password")
  ) {
    // Get user role from cookie (preferred) or token
    const userData = getUserDataFromCookie(request)
    const userRole = userData?.role?.toUpperCase() || "user"
    
    const url = request.nextUrl.clone()
    url.pathname = userRole === "ADMIN" ? "/admin" : "/dashboard"
    return NextResponse.redirect(url)
  }

  // Protect admin routes - only allow ADMIN users
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
    
    const userData = getUserDataFromCookie(request)
    const userRole = userData?.role?.toUpperCase() || "user"
    
    if (userRole !== "ADMIN") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
