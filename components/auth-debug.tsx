"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { RefreshCw, User, Database, Key, CheckCircle, XCircle } from "lucide-react"

export function AuthDebug() {
  const { user, loading, isAuthenticated } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [connectionTest, setConnectionTest] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    if (user) {
      loadSessionInfo()
      loadProfileInfo()
    }
  }, [user])

  const loadSessionInfo = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      setSessionInfo(session)
    } catch (error) {
      console.error("Error loading session:", error)
      setSessionInfo({ error: error.message })
    }
  }

  const loadProfileInfo = async () => {
    try {
      if (!user) return
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error
      setProfileInfo(data)
    } catch (error) {
      console.error("Error loading profile:", error)
      setProfileInfo({ error: error.message })
    }
  }

  const testConnection = async () => {
    setConnectionTest("testing")
    const results: any = {}

    try {
      // Test 1: Supabase connection
      const { data, error } = await supabase.from("profiles").select("count").limit(1)
      results.connection = error ? { status: "error", message: error.message } : { status: "success" }

      // Test 2: Auth session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      results.session = sessionError
        ? { status: "error", message: sessionError.message }
        : { status: session ? "success" : "warning", message: session ? "Session active" : "No session" }

      // Test 3: User profile access
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        results.profile = profileError
          ? { status: "error", message: profileError.message }
          : { status: "success", data: profile }
      }

      // Test 4: RLS policies
      if (user) {
        const { data: trips, error: tripsError } = await supabase.from("trips").select("count").limit(1)

        results.rls = tripsError
          ? { status: "error", message: tripsError.message }
          : { status: "success", message: "RLS policies working" }
      }

      setTestResults(results)
      setConnectionTest("success")
    } catch (error: any) {
      results.general = { status: "error", message: error.message }
      setTestResults(results)
      setConnectionTest("error")
    }
  }

  const refreshData = () => {
    loadSessionInfo()
    loadProfileInfo()
    testConnection()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <XCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Authentication Debug Panel</h1>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Auth Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Loading State</span>
              <Badge variant={loading ? "secondary" : "default"}>{loading ? "Loading" : "Ready"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Authenticated</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>{isAuthenticated ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">User ID</span>
              <Badge variant="outline" className="font-mono text-xs">
                {user?.id ? `${user.id.slice(0, 8)}...` : "None"}
              </Badge>
            </div>
          </div>

          {user && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">User Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Full Name:</strong> {user.user_metadata?.full_name || "Not set"}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(user.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Last Sign In:</strong>{" "}
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionInfo ? (
            sessionInfo.error ? (
              <div className="text-red-600 bg-red-50 p-3 rounded-lg">
                <strong>Session Error:</strong> {sessionInfo.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Access Token</span>
                    <p className="font-mono text-xs mt-1 break-all">
                      {sessionInfo.access_token ? `${sessionInfo.access_token.slice(0, 20)}...` : "None"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Expires At</span>
                    <p className="text-sm mt-1">
                      {sessionInfo.expires_at ? new Date(sessionInfo.expires_at * 1000).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-gray-500">No session information available</p>
          )}
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileInfo ? (
            profileInfo.error ? (
              <div className="text-red-600 bg-red-50 p-3 rounded-lg">
                <strong>Profile Error:</strong> {profileInfo.error}
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <strong>ID:</strong> <code className="text-xs">{profileInfo.id}</code>
                </p>
                <p>
                  <strong>Full Name:</strong> {profileInfo.full_name || "Not set"}
                </p>
                <p>
                  <strong>Avatar URL:</strong> {profileInfo.avatar_url || "Not set"}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(profileInfo.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated:</strong> {new Date(profileInfo.updated_at).toLocaleString()}
                </p>
              </div>
            )
          ) : (
            <p className="text-gray-500">No profile information available</p>
          )}
        </CardContent>
      </Card>

      {/* Connection Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Tests</CardTitle>
          <CardDescription>Test various aspects of the authentication system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={testConnection} disabled={connectionTest === "testing"} className="w-full">
              {connectionTest === "testing" && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Run Connection Tests
            </Button>

            {Object.keys(testResults).length > 0 && (
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-2 font-medium capitalize">{key} Test</span>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          result.status === "success"
                            ? "default"
                            : result.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {result.status}
                      </Badge>
                      {result.message && <p className="text-xs text-gray-600 mt-1">{result.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Supabase URL</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Supabase Anon Key</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
