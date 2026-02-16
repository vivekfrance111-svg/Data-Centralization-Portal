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
import { BookOpen, Plus, AlertCircle, Loader2, LogOut, UserCircle } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Auth & Permissions State
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  // FIX: Using maybeSingle() to prevent the 406 "client-side exception"
  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle() // Prevents crash if no role is found
        
        if (error) throw error
        if (roleData) setUserRole(roleData.role)
      }
    } catch (err) {
      console.error("Permission error:", err)
      setUserRole("author") // Safety fallback
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
          id: item.id.toString(),
          type: "academic",
          status: item.status || "draft",
          title: item.title,
          authors: item.authors,
          publicationType: item.publication_type,
          year: item.publication_year,
          department: item.department,
          journal: item.journal,
          abstract: item.abstract,
          keywords: item.keywords,
          createdBy: item.created_by || "user",
          createdAt: item.created_at.split("T")[0],
          updatedAt: item.created_at.split("T")[0],
        }))
        setEntries(formatted)
      }
    } catch (err) {
      console.error("Fetch error:", err)
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
      toast.error("Please fill all required fields.")
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
      toast.success("Draft saved successfully!")
      setShowForm(false)
      fetchEntries()
    } catch (err) {
      console.error("Save error:", err)
      toast.error("Failed to save to database.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto min-h-screen bg-background text-foreground">
        
        {/* Professional Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Academic Portal</h1>
              <div className="flex items-center gap-2 mt-1">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">{userEmail}</span>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
            <Button className="flex-1 md:flex-none shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> New Entry
            </Button>
          </div>
        </header>

        {showForm && (
          <Card className="border-primary/20 shadow-xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle>Submit Research - Step {step} of 2</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {step === 1 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-semibold">Publication Title *</Label>
                        <Input 
                          placeholder="Enter the full title..." 
                          value={formData.title || ""} 
                          onChange={(e) => updateField("title", e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Author(s) *</Label>
                        <Input 
                          placeholder="Comma separated names" 
                          value={formData.authors || ""} 
                          onChange={(e) => updateField("authors", e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Year *</Label>
                        <Input 
                          placeholder="e.g. 2026" 
                          value={formData.year || ""} 
                          onChange={(e) => updateField("year", e.target.value)} 
                        />
                    </div>
                 </div>
              ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Abstract *</Label>
                      <Textarea 
                        placeholder="Brief summary of your work..." 
                        className="min-h-[150px]"
                        value={formData.abstract || ""} 
                        onChange={(e) => updateField("abstract", e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Keywords *</Label>
                      <Input 
                        placeholder="AI, Machine Learning, Ethics..." 
                        value={formData.keywords || ""} 
                        onChange={(e) => updateField("keywords", e.target.value)} 
                      />
                    </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                {step === 1 ? (
                  <Button className="px-8" onClick={() => setStep(2)}>Next Step</Button>
                ) : (
                  <Button className="px-8" onClick={handleSaveDraft} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database entries with professional layout */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Submissions Registry</CardTitle>
              {!isLoadingData && (
                <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium text-muted-foreground">
                  {entries.length} Total
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm animate-pulse">Syncing with school database...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">
                No entries found in your account.
              </div>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-muted/5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 rounded uppercase">
                          ID: {entry.id}
                        </span>
                      </div>
                      <h3 className="font-bold text-base leading-tight">{entry.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{entry.authors}</span>
                        <span>•</span>
                        <span>{entry.year}</span>
                        <span>•</span>
                        <span className="italic">{entry.department}</span>
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