"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // 1. Check if the user has a valid "VIP Pass" (session) right now
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Kick them to the login page if they aren't logged in
        window.location.href = "/login" 
      } else {
        setIsAuthorized(true) // Let them in
      }
    })

    // 2. Listen in case they log out while using the app
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        window.location.href = "/login"
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  // Show a loading spinner while we check their credentials
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying secure access...</p>
      </div>
    )
  }

  // If they are authorized, render the actual page
  return <>{children}</>
}