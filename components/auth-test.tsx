"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function AuthTest() {
  const { signIn, signUp, signOut, user, loading } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testLoading, setTestLoading] = useState(false)
  const [testCredentials, setTestCredentials] = useState({
    email: "test@famtriply.com",
    password: "TestPassword123!",
    fullName: "Test User",
  })

  const addTestResult = (result: TestResult) => {
    setTestResults((prev) => [...prev, { ...result, timestamp: Date.now() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const runFullAuthTest = async () => {
    setTestLoading(true)
    clearResults()

    try {
      // Test 1: Sign Up
      addTestResult({ name: "Starting Sign Up Test", status: "warning", message: "Creating new test account..." })

      try {
        const signUpResult = await signUp(testCredentials.email, testCredentials.password, testCredentials.fullName)
        addTestResult({
          name: "Sign Up",
          status: "success",
          message: "Account created successfully",
          details: { userId: signUpResult.user?.id },
        })

        // Wait a moment for the auth state to update
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error: any) {
        if (error.message.includes("already registered")) {
          addTestResult({
            name: "Sign Up",
            status: "warning",
            message: "Account already exists, proceeding with sign in test",
          })
        } else {
          addTestResult({
            name: "Sign Up",
            status: "error",
            message: error.message,
          })
        }
      }

      // Test 2: Sign Out (if signed in)
      if (user) {
        try {
          await signOut()
          addTestResult({
            name: "Sign Out",
            status: "success",
            message: "Successfully signed out",
          })
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error: any) {
          addTestResult({
            name: "Sign Out",
            status: "error",
            message: error.message,
          })
        }
      }

      // Test 3: Sign In
      try {
        const signInResult = await signIn(testCredentials.email, testCredentials.password)
        addTestResult({
          name: "Sign In",
          status: "success",
          message: "Successfully signed in",
          details: { userId: signInResult.user?.id },
        })

        // Wait for auth state to update
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error: any) {
        addTestResult({
          name: "Sign In",
          status: "error",
          message: error.message,
        })
      }

      // Test 4: Session Persistence
      try {
        // Simulate page refresh by checking session
        const {
          data: { session },
        } = await import("@/lib/supabase").then((m) => m.supabase.auth.getSession())

        if (session) {
          addTestResult({
            name: "Session Persistence",
            status: "success",
            message: "Session persisted successfully",
          })
        } else {
          addTestResult({
            name: "Session Persistence",
            status: "error",
            message: "Session not found after sign in",
          })
        }
      } catch (error: any) {
        addTestResult({
          name: "Session Persistence",
          status: "error",
          message: error.message,
        })
      }

      // Test 5: Profile Creation
      if (user) {
        try {
          const { supabase } = await import("@/lib/supabase")
          const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          if (error) throw error

          addTestResult({
            name: "Profile Creation",
            status: "success",
            message: "Profile created and accessible",
            details: profile,
          })
        } catch (error: any) {
          addTestResult({
            name: "Profile Creation",
            status: "error",
            message: error.message,
          })
        }
      }
    } catch (error: any) {
      addTestResult({
        name: "General Test Error",
        status: "error",
        message: error.message,
      })
    } finally {
      setTestLoading(false)
    }
  }

  const testSignUp = async () => {
    setTestLoading(true)
    try {
      const result = await signUp(testCredentials.email, testCredentials.password, testCredentials.fullName)
      addTestResult({
        name: "Manual Sign Up",
        status: "success",
        message: "Account created successfully",
        details: result,
      })
    } catch (error: any) {
      addTestResult({
        name: "Manual Sign Up",
        status: "error",
        message: error.message,
      })
    } finally {
      setTestLoading(false)
    }
  }

  const testSignIn = async () => {
    setTestLoading(true)
    try {
      const result = await signIn(testCredentials.email, testCredentials.password)
      addTestResult({
        name: "Manual Sign In",
        status: "success",
        message: "Successfully signed in",
        details: result,
      })
    } catch (error: any) {
      addTestResult({
        name: "Manual Sign In",
        status: "error",
        message: error.message,
      })
    } finally {
      setTestLoading(false)
    }
  }

  const testSignOut = async () => {
    setTestLoading(true)
    try {
      await signOut()
      addTestResult({
        name: "Manual Sign Out",
        status: "success",
        message: "Successfully signed out",
      })
    } catch (error: any) {
      addTestResult({
        name: "Manual Sign Out",
        status: "error",
        message: error.message,
      })
    } finally {
      setTestLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <TestTube className="h-6 w-6 mr-2" />
          Authentication Testing Suite
        </h1>
        <p className="text-gray-600 mt-2">Test sign-up, sign-in, and session persistence functionality</p>
      </div>

      <Tabs defaultValue="automated" className="space-y-6">
        <TabsList>
          <TabsTrigger value="automated">Automated Tests</TabsTrigger>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="automated">
          <Card>
            <CardHeader>
              <CardTitle>Automated Authentication Flow Test</CardTitle>
              <CardDescription>
                Runs a complete test of sign-up, sign-out, sign-in, and session persistence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="test-email">Test Email</Label>
                  <Input
                    id="test-email"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="test-password">Test Password</Label>
                  <Input
                    id="test-password"
                    type="password"
                    value={testCredentials.password}
                    onChange={(e) => setTestCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="test-name">Full Name</Label>
                  <Input
                    id="test-name"
                    value={testCredentials.fullName}
                    onChange={(e) => setTestCredentials((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create a test account and run through the complete authentication flow. Make sure you're
                  using test credentials.
                </AlertDescription>
              </Alert>

              <Button onClick={runFullAuthTest} disabled={testLoading || loading} className="w-full">
                {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Full Authentication Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up Test</CardTitle>
                <CardDescription>Test account creation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testSignUp} disabled={testLoading} className="w-full">
                  {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Sign Up
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sign In Test</CardTitle>
                <CardDescription>Test account login</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testSignIn} disabled={testLoading} className="w-full">
                  {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Sign In
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sign Out Test</CardTitle>
                <CardDescription>Test account logout</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testSignOut} disabled={testLoading || !user} className="w-full">
                  {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Test Results
                <Button onClick={clearResults} variant="outline" size="sm">
                  Clear Results
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No test results yet. Run some tests to see results here.
                </p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{result.name}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">Show Details</summary>
                            <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Auth State */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Authentication State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <p className="font-medium">{loading ? "Loading..." : user ? "Authenticated" : "Not Authenticated"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">User Email</span>
              <p className="font-medium">{user?.email || "None"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
