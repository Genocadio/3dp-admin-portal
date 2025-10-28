"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  // Login states
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Sign up states
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [organisationName, setOrganisationName] = useState("")
  const [userRole, setUserRole] = useState("manager")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [signupError, setSignupError] = useState<string | null>(null)
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginLoading(true)
    setLoginError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (signInError) throw signInError

      // Get user profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single()

      // Redirect based on role
      if (profile?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSignupLoading(true)
    setSignupError(null)

    if (signupPassword !== repeatPassword) {
      setSignupError("Passwords do not match")
      setIsSignupLoading(false)
      return
    }

    if (!organisationName.trim()) {
      setSignupError("Organisation name is required")
      setIsSignupLoading(false)
      return
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: "user",
            organisation_name: organisationName,
            user_role: userRole,
          },
        },
      })

      if (signUpError) throw signUpError
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setSignupError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSignupLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/loggo.webp" alt="3DP Logo" width={80} height={80} className="h-20 w-auto mb-4" />
          <h1 className="text-3xl font-bold">Welcome to 3DP</h1>
          <p className="text-sm text-muted-foreground mt-2">Application Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                    <Button type="submit" className="w-full" disabled={isLoginLoading}>
                      {isLoginLoading ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full-name">Full Name</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="organisation">Organisation Name</Label>
                      <Input
                        id="organisation"
                        type="text"
                        placeholder="Your Company Inc."
                        required
                        value={organisationName}
                        onChange={(e) => setOrganisationName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="user-role">Your Role in Organisation</Label>
                      <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger id="user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="ceo">CEO</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-password">Repeat Password</Label>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                      />
                    </div>
                    {signupError && <p className="text-sm text-red-500">{signupError}</p>}
                    <Button type="submit" className="w-full" disabled={isSignupLoading}>
                      {isSignupLoading ? "Creating account..." : "Sign up"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
