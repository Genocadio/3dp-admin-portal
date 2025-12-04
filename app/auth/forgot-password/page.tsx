"use client"

import { useState } from "react"
import { useMutation } from "@apollo/client/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { REQUEST_PASSWORD_RESET_MUTATION, RESET_PASSWORD_MUTATION } from "@/lib/graphql/mutations"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "success">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  
  const [requestPasswordReset, { loading: requestingCode }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION)
  const [resetPassword, { loading: resettingPassword }] = useMutation(RESET_PASSWORD_MUTATION)
  
  const isLoading = requestingCode || resettingPassword

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    try {
      await requestPasswordReset({
        variables: {
          input: {
            email,
          },
        },
      })

      setMessage("Reset code sent to your email. It will expire in 15 minutes.")
      setStep("code")
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code")
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      await resetPassword({
        variables: {
          input: {
            email,
            code,
            newPassword,
          },
        },
      })

      setStep("success")
      setMessage("Password has been reset successfully")
    } catch (err: any) {
      setError(err?.message || "Failed to reset password")
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {step === "email" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Forgot Password</CardTitle>
              <CardDescription>Enter your email address and we'll send you a reset code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {message && (
                  <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{message}</p>
                  </div>
                )}


                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <Link href="/" className="underline underline-offset-4 hover:text-primary">
                  Back to Login
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "code" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter the code from your email and set a new password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">

                <div className="grid gap-2">
                  <Label htmlFor="code">Reset Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">6-digit code from your email</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  onClick={() => {
                    setStep("email")
                    setError(null)
                    setMessage(null)
                  }}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Try different email
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
                  <CardDescription>Your password has been updated successfully</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can now log in with your new password.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
