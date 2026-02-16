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
import { BookOpen, Plus, Loader2, LogOut, UserCircle, ShieldCheck, ChevronRight, LayoutGrid } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
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
        
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle() 
        
        if (roleData && roleData.role) {
          setUserRole(roleData.role.trim().toLowerCase())
        }
      }
    } catch (err) {
      console.error("Auth process error:", err)
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
      
      if (data) {
        const formatted: AcademicEntry[] = data.map((item) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: "academic",
          status: item.status || "draft",
          title: item.title || "Untitled",
          authors: item.authors || "Unknown",
          publicationType: item.publication_type || "journal_article",
          year: item.publication_year || "2026",
          department: item.department || "Unassigned",
          journal: item.journal || "",
          abstract: item.abstract || "",
          keywords: item.keywords || "",
          createdBy: item.created_by || "user",
          createdAt: item.created_at ? item.created_at.split("T")[0] : "",
          updatedAt: item.created_at ? item.created_at.split("T")[0] : "",
        }))
        setEntries(formatted)
      }
    } catch (err) {
      console.error("Data fetch error:", err)
      toast.error("Failed to load submissions.")
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

  async function handleSaveDraft() {
    setIsSubmitting(true)
    const result = academicSchema.safeParse(formData)
    
    if (!result.success) {
      toast.error("Please fill in all required fields.")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from("portal_data").insert([{
        ...result.data,
        publication_type: result.data.publicationType,
        publication_year: result.data.year,
        status: "draft",
        created_by: userEmail
      }])

      if (error) throw error
      toast.success("Draft saved successfully!")
      setShowForm(false)
      setStep(1)
      setFormData({ publicationType: "journal_article", year: "2026", department: "AI & Data Science" })
      fetchEntries()
    } catch (err) {
      console.error("Save error:", err)
      toast.error("Failed to save draft.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-8 p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
        
        <nav className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Academic Portal</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <UserCircle className="h-4 w-4" /> {userEmail || "Loading..."}
                </span>
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                  <ShieldCheck className="h-3 w-3" /> {userRole}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
            <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> New Submission
            </Button>
          </div>
        </nav>

        {showForm && (
          <Card className="border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">New Research Submission</CardTitle>
                <div className="flex gap-2">
                  <div className={`h-2 w-12 rounded-full ${step === 1 ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div className={`h-2 w-12 rounded-full ${step === 2 ? 'bg-primary' : 'bg-slate-200'}`} />
                </div>
              </div>
              <CardDescription>Step {step}: {step === 1 ? "Basic Publication Info" : "Abstract & Metadata"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {step === 1 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-semibold">Full Title *</Label>
                        <Input className="h-12" placeholder="The impact of AI on modern education..." value={formData.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Lead Authors *</Label>
                        <Input className="h-12" placeholder="John Doe, Jane Smith" value={formData.authors || ""} onChange={(e) => updateField("authors", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Publication Year *</Label>
                        <Input className="h-12" placeholder="2026" value={formData.year || ""} onChange={(e) => updateField("year", e.target.value)} />
                    </div>
                 </div>
              ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Abstract *</Label>
                      <Textarea className="min-h-[180px] text-base leading-relaxed" placeholder="Briefly describe your research findings..." value={formData.abstract || ""} onChange={(e) => updateField("abstract", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Keywords *</Label>
                      <Input className="h-12" placeholder="Machine Learning, Pedagogy, Ethics" value={formData.keywords || ""} onChange={(e) => updateField("keywords", e.target.value)} />
                    </div>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
                <Button variant="ghost" onClick={() => { setShowForm(false); setStep(1); }}>Cancel</Button>
                {step === 1 ? (
                  <Button className="px-10 h-12" onClick={() => setStep(2)}>Next Step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-12" onClick={() => setStep(1)}>Back</Button>
                    <Button className="px-10 h-12 shadow-lg" onClick={handleSaveDraft} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Save Submission"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg font-bold text-slate-800">Research Registry</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} Submissions</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-sm font-medium animate-pulse">Syncing with school database...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic bg-slate-50/30">No submissions found in your department.</div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-slate-50/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">ID-{entry.id.substring(0,6)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{entry.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="text-slate-900">{entry.authors}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{entry.year}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-primary/70">{entry.department}</span>
                      </div>
                    </div>
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