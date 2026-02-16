"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { academicSchema, type AcademicEntry, type AcademicFormData } from "@/lib/types"
import { BookOpen, Plus, AlertCircle, Loader2, LogOut, UserCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Real Auth State
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  // 1. Fetch User Role safely
  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError

      if (user) {
        setUserEmail(user.email || "")
        
        // Use maybeSingle to prevent 406/404 crashes
        const { data: roleData, error: dbError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle()
        
        if (dbError) throw dbError
        if (roleData) {
          setUserRole(roleData.role)
        } else {
          setUserRole("author") // Default fallback
        }
      }
    } catch (err) {
      console.error("Permission system failure:", err)
      setUserRole("author")
    }
  }, [])

  // 2. Fetch submissions from the portal table
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      
      if (data) {
        const formatted: AcademicEntry[] = data.map((item) => ({
          id: item.id.toString(),
          type: "academic",
          status: item.status || "draft",
          title: item.title || "Untitled",
          authors: item.authors || "Unknown",
          publicationType: item.publication_type || "journal_article",
          year: item.publication_year || "2026",
          department: item.department || "General",
          journal: item.journal || "",
          abstract: item.abstract || "",
          keywords: item.keywords || "",
          createdBy: item.created_by || "system",
          createdAt: item.created_at ? item.created_at.split("T")[0] : "",
          updatedAt: item.created_at ? item.created_at.split("T")[0] : "",
        }))
        setEntries(formatted)
      }
    } catch (err) {
      console.error("Database fetch failure:", err)
      toast.error("Could not load submissions.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  function updateField(field: keyof AcademicFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // 3. Save as Draft
  async function handleSaveDraft() {
    setIsSubmitting(true)
    const result = academicSchema.safeParse(formData)
    
    if (!result.success) {
      toast.error("Missing required fields. Please check your entries.")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from("portal_data").insert([{
        title: result.data.title,
        authors: result.data.authors,
        publication_type: result.data.publicationType,
        publication_year: result.data.year,
        journal: result.data.journal || "",
        department: result.data.department,
        abstract: result.data.abstract,
        keywords: result.data.keywords,
        status: "draft",
        created_by: userEmail
      }])

      if (error) throw error
      toast.success("Submission saved as Draft!")
      setShowForm(false)
      setStep(1)
      fetchEntries()
    } catch (err) {
      console.error("Save failure:", err)
      toast.error("Database error while saving.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Research Portal</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <UserCircle className="h-4 w-4" />
                  {userEmail || "Loading..."}
                </div>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  <ShieldCheck className="h-3 w-3" />
                  {userRole}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
            <Button className="flex-1 md:flex-none shadow-sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> New Submission
            </Button>
          </div>
        </header>

        {showForm && (
          <Card className="border-primary/20 shadow-2xl animate-in slide-in-from-top duration-300">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle>Submit Publication — Step {step} of 2</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {step === 1 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="font-semibold text-slate-700">Full Title *</Label>
                        <Input placeholder="Enter research title" value={formData.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Authors *</Label>
                        <Input placeholder="Separated by commas" value={formData.authors || ""} onChange={(e) => updateField("authors", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">Year *</Label>
                        <Input placeholder="2026" value={formData.year || ""} onChange={(e) => updateField("year", e.target.value)} />
                    </div>
                 </div>
              ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700">Abstract *</Label>
                      <Textarea 
                        placeholder="Write a brief summary..." 
                        className="min-h-[160px]"
                        value={formData.abstract || ""} 
                        onChange={(e) => updateField("abstract", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700">Keywords *</Label>
                      <Input placeholder="e.g. AI, Health, Robotics" value={formData.keywords || ""} onChange={(e) => updateField("keywords", e.target.value)} />
                    </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={() => { setShowForm(false); setStep(1); }}>Cancel</Button>
                {step === 1 ? (
                  <Button className="w-32" onClick={() => setStep(2)}>Next Step</Button>
                ) : (
                  <Button className="w-32 shadow-lg" onClick={handleSaveDraft} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Draft"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b bg-white py-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Registry Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                <p className="text-sm text-slate-400 font-medium">Loading school database...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic">No submissions found in this category.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">ID: {entry.id}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 leading-snug">{entry.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span>{entry.authors}</span>
                        <span className="text-slate-200">|</span>
                        <span>{entry.year}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-primary/70">{entry.department}</span>
                      </div>
                    </div>
                    {/* Role-based action buttons */}
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