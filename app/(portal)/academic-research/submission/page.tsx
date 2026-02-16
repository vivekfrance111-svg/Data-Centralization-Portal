"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { academicSchema, type AcademicEntry, type AcademicFormData } from "@/lib/types"
import { BookOpen, Plus, Loader2, LogOut, UserCircle } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // SECURE AUTH STATE
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle()
        
        if (error) throw error
        // Clean and fallback
        setUserRole(data?.role?.trim().toLowerCase() || "author")
      }
    } catch (err) {
      console.error("Permission fetch error:", err)
      setUserRole("author")
    }
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      
      // EXTREME SAFETY MAPPING: Prevents crashes if any field is NULL
      const formatted: AcademicEntry[] = (data || []).map((item) => ({
        id: item?.id?.toString() || Math.random().toString(),
        type: "academic",
        status: item?.status || "draft",
        title: item?.title || "Untitled",
        authors: item?.authors || "No Authors Listed",
        publicationType: item?.publication_type || "journal_article",
        year: item?.publication_year || "N/A",
        department: item?.department || "Unassigned",
        journal: item?.journal || "",
        abstract: item?.abstract || "",
        keywords: item?.keywords || "",
        createdBy: item?.created_by || "system",
        createdAt: item?.created_at ? item.created_at.split("T")[0] : "Recent",
        updatedAt: item?.created_at ? item.created_at.split("T")[0] : "Recent",
      }))
      setEntries(formatted)
    } catch (err) {
      console.error("Data fetch error:", err)
      toast.error("Database sync error.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <header className="flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Research Portal</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserCircle className="h-3 w-3" /> {userEmail} 
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold">{userRole}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </header>

        {/* Form and List code stays mostly the same but uses safety checks */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle className="text-lg">Submissions</CardTitle>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> New Entry
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <StatusBadge status={entry.status} />
                      <h3 className="font-bold">{entry.title}</h3>
                      <p className="text-xs text-muted-foreground">{entry.authors} • {entry.year}</p>
                    </div>
                    {/* Passing User Role to Actions */}
                    <WorkflowActions entry={entry} user={{ role: userRole }} onUpdate={fetchEntries} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}