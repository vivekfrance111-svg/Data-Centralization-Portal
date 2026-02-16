"use client"

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, UserCircle, KeyRound, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("author")
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || "")
          
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("email", user.email)
            .maybeSingle()
            
          if (data && data.role) {
            setUserRole(data.role.trim().toLowerCase())
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [])

  // Functional Password Reset tied to Supabase
  async function handlePasswordReset() {
    if (!userEmail) return
    setIsResetting(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      toast.success("Password reset email sent! Check your inbox.")
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email.")
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
            <p className="text-sm text-slate-500">Manage your profile and security preferences.</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-slate-400" />
              Profile Information
            </CardTitle>
            <CardDescription>Your identity within the Aivancity portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
              <Input 
                id="email" 
                value={userEmail} 
                readOnly 
                className="bg-slate-50 text-slate-500 cursor-not-allowed" 
              />
              <p className="text-[11px] text-slate-400">Your email is tied to your authentication and cannot be changed here.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">System Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="capitalize font-medium text-slate-900">{userRole}</span>
              </div>
              <p className="text-[11px] text-slate-400">Your role determines your publishing permissions. Contact IT to request changes.</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-slate-400" />
              Security
            </CardTitle>
            <CardDescription>Update your credentials and secure your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
              <div>
                <h4 className="font-semibold text-sm text-slate-900">Password</h4>
                <p className="text-xs text-slate-500 mt-1">Receive a link to reset your current password.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handlePasswordReset}
                disabled={isResetting}
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </AuthGuard>
  )
}