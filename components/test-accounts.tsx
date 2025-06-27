"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Copy, User, Mail, Key, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TestAccount {
  email: string
  password: string
  fullName: string
  description: string
  status: "available" | "creating" | "created" | "error"
}

export function TestAccounts() {
  const { signIn, signUp } = useAuth()
  const [accounts, setAccounts] = useState<TestAccount[]>([
    {
      email: "demo@famtriply.com",
      password: "Demo123!",
      fullName: "Demo User",
      description: "Main demo account for testing",
      status: "available",
    },
    {
      email: "john.smith@famtriply.com",
      password: "Family123!",
      fullName: "John Smith",
      description: "Family trip planner account",
      status: "available",
    },
    {
      email: "sarah.johnson@famtriply.com",
      password: "Travel123!",
      fullName: "Sarah Johnson",
      description: "Travel enthusiast account",
      status: "available",
    },
  ])

  const [loginLoading, setLoginLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard!" })
    setTimeout(() => setMessage(null), 2000)
  }

  const createAndLoginAccount = async (account: TestAccount) => {
    setLoginLoading(account.email)
    setMessage(null)

    try {
      // Update account status
      setAccounts((prev) => prev.map((acc) => (acc.email === account.email ? { ...acc, status: "creating" } : acc)))

      // Try to create account first
      try {
        await signUp(account.email, account.password, account.fullName)
        setMessage({ type: "success", text: `Account created and logged in: ${account.email}` })
      } catch (error: any) {
        // If account already exists, just sign in
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          await signIn(account.email, account.password)
          setMessage({ type: "success", text: `Logged in to existing account: ${account.email}` })
        } else {
          throw error
        }
      }

      // Update account status to created
      setAccounts((prev) => prev.map((acc) => (acc.email === account.email ? { ...acc, status: "created" } : acc)))
    } catch (error: any) {
      console.error("Error with account:", error)
      setMessage({ type: "error", text: `Error: ${error.message}` })
      setAccounts((prev) => prev.map((acc) => (acc.email === account.email ? { ...acc, status: "error" } : acc)))
    } finally {
      setLoginLoading(null)
    }
  }

  const quickLogin = async (account: TestAccount) => {
    setLoginLoading(account.email)
    setMessage(null)

    try {
      await signIn(account.email, account.password)
      setMessage({ type: "success", text: `Successfully logged in as ${account.fullName}` })
    } catch (error: any) {
      console.error("Login error:", error)
      setMessage({ type: "error", text: `Login failed: ${error.message}` })
    } finally {
      setLoginLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="outline">Available</Badge>
      case "creating":
        return <Badge variant="secondary">Creating...</Badge>
      case "created":
        return <Badge variant="default">Ready</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Test Accounts</h1>
        <p className="text-gray-600">Pre-configured accounts for testing FamTriply authentication</p>
      </div>

      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {account.fullName}
                </CardTitle>
                {getStatusBadge(account.status)}
              </div>
              <CardDescription>{account.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-mono">{account.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.email)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <Key className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm font-mono">{account.password}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.password)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => createAndLoginAccount(account)}
                  disabled={loginLoading === account.email}
                  className="w-full"
                  variant="default"
                >
                  {loginLoading === account.email ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Create & Login
                </Button>

                <Button
                  onClick={() => quickLogin(account)}
                  disabled={loginLoading === account.email}
                  className="w-full"
                  variant="outline"
                >
                  {loginLoading === account.email ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4" />
                  )}
                  Quick Login
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Use Test Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Option 1: Create & Login</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Creates the account if it doesn't exist</li>
                <li>• Automatically logs you in</li>
                <li>• Sets up the user profile</li>
                <li>• Best for first-time testing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Option 2: Quick Login</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Logs into existing account</li>
                <li>• Faster if account already exists</li>
                <li>• Will fail if account doesn't exist</li>
                <li>• Best for repeated testing</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Manual Login Instructions</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Copy the email and password from any account above</li>
              <li>2. Go to the main login page</li>
              <li>3. Paste the credentials and sign in</li>
              <li>4. Or use the "Create & Login" button for automatic setup</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
