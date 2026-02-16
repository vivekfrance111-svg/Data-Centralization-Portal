"use client"

import { supabase } from "@/lib/supabase"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldAlert, ShieldCheck, UserCog, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

// Define the shape of our user role data
interface UserRoleData {
  email: string
  role: string
}

export default function AdminDashboard() {
  const [currentUserRole, setCurrentUserRole] = useState<string>("author")
  const [users, setUsers] = useState<UserRoleData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // States for adding a new user manually
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("author")
  const [isAdding, setIsAdding] = useState(false)

  // 1. Verify the current person looking at this page is actually an Admin
  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle()
          
        if (data && data.role) {
          setCurrentUserRole(data.role.trim().toLowerCase())
        }
      }
    } catch (err) {
      console.error("Auth error:", err)
    }
  }, [])

  // 2. Fetch all users from the user_roles table
  const fetchAllUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("email", { ascending: true })

      if (error) throw error
      if (data) setUsers(data)
    } catch (err) {
      toast.error("Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAdminStatus().then(() => fetchAllUsers())
  }, [checkAdminStatus, fetchAllUsers])

  // 3. Update a user's role instantly
  async function handleRoleChange(email: string, newRole: string) {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("email", email)

      if (error) throw error
      toast.success(`${email} is now a ${newRole.toUpperCase()}`)
      fetchAllUsers() // Refresh the list
    } catch (err) {
      toast.error("Failed to update role.")
    }
  }

  // 4. Add a new user to the roles table
  async function handleAddUser() {
    if (!newUserEmail.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }
    
    setIsAdding(true)
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ email: newUserEmail.toLowerCase(), role: newUserRole }])

      if (error) throw error
      
      toast.success("User added successfully!")
      setNewUserEmail("")
      setNewUserRole("author")
      fetchAllUsers()
    } catch (err: any) {
      toast.error(err.message || "Failed to add user.")
    } finally {
      setIsAdding(false)
    }
  }

  // 5. Delete a user from the roles table
  async function handleRemoveUser(email: string) {
    if (!confirm(`Are you sure you want to remove ${email}'s access?`)) return

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("email", email)

      if (error) throw error
      toast.success("User removed from system.")
      fetchAllUsers()
    } catch (err) {
      toast.error("Failed to remove user.")
    }
  }

  // SECURITY WALL: If they are not an admin, block the page!
  if (currentUserRole !== "admin" && !isLoading) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500 max-w-md">
            You do not have the required Administrator permissions to view or modify user roles.
          </p>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="bg-indigo-100 p-2.5 rounded-lg">
            <UserCog className="h-6 w-6 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Add users and manage their portal permissions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Add New User Panel */}
          <Card className="md:col-span-1 shadow-sm h-fit">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add User
              </CardTitle>
              <CardDescription>Grant access to a new faculty member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label>Email Address</label>
                <Input 
                  placeholder="prof@aivancity.ai" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label>Assign Role</label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="author">Author (Submit only)</SelectItem>
                    <SelectItem value="reviewer">Reviewer (Approve drafts)</SelectItem>
                    <SelectItem value="admin">Admin (Full access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full mt-2" onClick={handleAddUser} disabled={isAdding}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Grant Access
              </Button>
            </CardContent>
          </Card>

          {/* User List Panel */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Active Portal Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <div key={u.email} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="font-medium text-sm text-slate-900">{u.email}</div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          defaultValue={u.role} 
                          onValueChange={(val) => handleRoleChange(u.email, val)}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="author">Author</SelectItem>
                            <SelectItem value="reviewer">Reviewer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleRemoveUser(u.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AuthGuard>
  )
}