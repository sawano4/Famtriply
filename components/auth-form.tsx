"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Plane, TestTube, Eye, EyeOff, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  // Quick test credentials
  const testCredentials = {
    email: "demo@famtriply.com",
    password: "Demo123!",
    fullName: "Demo User",
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    try {
      const result = await signUp(email, password, fullName)

      if (result.user && !result.session) {
        // User created but needs email confirmation
        setSuccess(
          "Account created! Please check your email for a confirmation link. The link will redirect you back to this site.",
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quickTestLogin = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Try to create account first, then sign in
      try {
        const result = await signUp(testCredentials.email, testCredentials.password, testCredentials.fullName)

        if (result.user && !result.session) {
          setSuccess(
            "Demo account created! Please check your email for confirmation, or try signing in if the account already exists.",
          )
          return
        }
      } catch (err: any) {
        // If account exists, just sign in
        if (err.message.includes("already registered")) {
          await signIn(testCredentials.email, testCredentials.password)
        } else {
          throw err
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillTestCredentials = (formType: "signin" | "signup") => {
    const emailInput = document.getElementById(`${formType}-email`) as HTMLInputElement
    const passwordInput = document.getElementById(`${formType}-password`) as HTMLInputElement

    if (emailInput) emailInput.value = testCredentials.email
    if (passwordInput) passwordInput.value = testCredentials.password

    if (formType === "signup") {
      const nameInput = document.getElementById("signup-name") as HTMLInputElement
      if (nameInput) nameInput.value = testCredentials.fullName
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-full">
              <Plane className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">FamTriply</CardTitle>
          <CardDescription>Plan amazing family trips together</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Test Login */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-yellow-800">Quick Test Login</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="text-yellow-700 hover:text-yellow-800"
              >
                <TestTube className="h-4 w-4 mr-1" />
                {showTestAccounts ? "Hide" : "More"} Options
              </Button>
            </div>
            <p className="text-sm text-yellow-700 mb-3">Use demo account for testing (no email confirmation needed)</p>
            <Button
              onClick={quickTestLogin}
              disabled={loading}
              className="w-full mb-2 bg-transparent"
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
              Login as Demo User
            </Button>
            {showTestAccounts && (
              <div className="text-xs text-yellow-700 space-y-1 mt-2 p-2 bg-yellow-100 rounded">
                <p>
                  <strong>Email:</strong> {testCredentials.email}
                </p>
                <p>
                  <strong>Password:</strong> {testCredentials.password}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-yellow-700"
                  onClick={() => (window.location.href = "/test-accounts")}
                >
                  View all test accounts →
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-email">Email</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600"
                      onClick={() => fillTestCredentials("signin")}
                    >
                      Use test credentials
                    </Button>
                  </div>
                  <Input id="signin-email" name="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600"
                      onClick={() => fillTestCredentials("signup")}
                    >
                      Use test credentials
                    </Button>
                  </div>
                  <Input id="signup-name" name="fullName" type="text" placeholder="Enter your full name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    After signing up, you'll receive a confirmation email. The link will redirect you back to this site
                    automatically.
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/auth/resend")}
              className="text-xs text-gray-600"
            >
              Didn't receive confirmation email?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
