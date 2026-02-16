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
import { BookOpen, Plus, Loader2, LogOut, UserCircle, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // SAFE DEFAULTS TO PREVENT CRASHES
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")
  const [isAuthReady, setIsAuthReady] = useState(false)

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  // 1. SECURE ROLE FETCHING
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
        
        if (error) console.error("DB Role Error:", error)
        
        // Clean the string (remove spaces, lowercase it) to prevent typo errors
        const cleanRole = data?.role?.trim().toLowerCase() || "author"
        setUserRole(cleanRole)
      }
    } catch (err) {
      console.error("Critical Auth Error:", err)
      setUserRole("author") 
    } finally {
      setIsAuthReady(true)
    }
  }, [])

  // 2. SECURE DATA FETCHING
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      
      const formatted: AcademicEntry[] = (data || []).map((item) => ({
        id: item.id?.toString() || Math.random().toString(),
        type: "academic",
        status: item.status || "draft",
        title: item.title || "Untitled Submission",
        authors: item.authors || "Unknown",
        publicationType: item.publication_type || "journal_article",
        year: item.publication_year || "2026",
        department: item.department || "Unassigned",
        journal: item.journal || "",
        abstract: item.abstract || "",
        keywords: item.keywords || "",
        createdBy: item.created_by || "system",
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.created_at || new Date().toISOString(),
      }))
      setEntries(formatted)
    } catch (err) {
      console.error("Data Fetch Error:", err)
      toast.error("Database connection issue.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Research Portal</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <UserCircle className="h-4 w-4" /> {userEmail}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-blue-50 text-blue-700">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")}>
               <LogOut className="h-4 w-4 mr-2" /> Logout
             </Button>
             <Button size="sm" onClick={() => setShowForm(!showForm)}>
               <Plus className="h-4 w-4 mr-1" /> New Entry
             </Button>
          </div>
        </header>

        {showForm && (
          <Card className="animate-in slide-in-from-top-4 duration-300 shadow-xl border-primary/20">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Step {step} of 2</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {step === 1 ? (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={formData.title || ""} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Authors *</Label>
                      <Input value={formData.authors || ""} onChange={(e) => setFormData({...formData, authors: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year *</Label>
                      <Input value={formData.year || ""} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setStep(2)}>Continue</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Abstract *</Label>
                    <Textarea className="min-h-[120px]" value={formData.abstract || ""} onChange={(e) => setFormData({...formData, abstract: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1" onClick={async () => {
                      setIsSubmitting(true)
                      const { error } = await supabase.from("portal_data").insert([{
                        ...formData,
                        publication_type: formData.publicationType,
                        publication_year: formData.year,
                        status: "draft",
                        created_by: userEmail
                      }])
                      if (error) toast.error("Save failed")
                      else {
                        toast.success("Saved!")
                        setShowForm(false)
                        fetchEntries()
                      }
                      setIsSubmitting(false)
                    }} disabled={isSubmitting}>Submit Draft</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Live Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-slate-200" /></div>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex items-center justify-between">
                    <div>
                      <StatusBadge status={entry.status} />
                      <h3 className="font-bold mt-2">{entry.title}</h3>
                      <p className="text-xs text-slate-500">{entry.authors} • {entry.year}</p>
                    </div>
                    {/* PASSING THE CLEANED ROLE */}
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