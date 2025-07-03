"use client"

import * as React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AuthPage } from "../auth/AuthPage"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authDismissed, setAuthDismissed] = useState(false)

  // Show auth page immediately if no user and not loading
  if (loading) {
    // Show a minimal loading state instead of blank page
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sidebar-foreground border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // If user is authenticated, show the app
  if (user) {
    return <>{children}</>
  }

  // If no user and not loading, show auth page immediately
  if (!user && !loading) {
    return (
      <AuthPage 
        onClose={() => {
          setAuthDismissed(true)
        }} 
      />
    )
  }

  // If auth was dismissed, show the app without authentication
  if (authDismissed) {
    return <>{children}</>
  }

  return <>{children}</>
}