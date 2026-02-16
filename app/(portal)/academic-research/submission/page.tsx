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
import { BookOpen, Plus, AlertCircle, Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // REAL AUTH STATE
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  // FETCH USER ROLE FROM DATABASE
  const fetchUserPermissions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || "")
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", user.email)
        .single()
      
      if (roleData) setUserRole(roleData.role)
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
      console.error(err)
      toast.error("Failed to load data.")
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
      toast.error("Validation failed.")
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
      toast.success("Draft saved!")
      setShowForm(false)
      fetchEntries()
    } catch (err) {
      toast.error("Save failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Academic Portal
            </h1>
            <p className="text-sm text-muted-foreground">Logged in as: {userEmail} ({userRole})</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" /> New Entry
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>Step {step} of 2</CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label>Title *</Label>
                        <Input value={formData.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Authors *</Label>
                        <Input value={formData.authors || ""} onChange={(e) => updateField("authors", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Year *</Label>
                        <Input value={formData.year || ""} onChange={(e) => updateField("year", e.target.value)} />
                    </div>
                 </div>
              ) : (
                <div className="space-y-4">
                    <Label>Abstract *</Label>
                    <Textarea value={formData.abstract || ""} onChange={(e) => updateField("abstract", e.target.value)} />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                {step === 1 ? (
                  <Button onClick={() => setStep(2)}>Next</Button>
                ) : (
                  <Button onClick={handleSaveDraft} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-muted/10">
                    <div>
                      <div className="flex gap-2 mb-1"><StatusBadge status={entry.status} /></div>
                      <h3 className="font-semibold">{entry.title}</h3>
                      <p className="text-xs text-muted-foreground">{entry.authors} • {entry.year}</p>
                    </div>
                    {/* Securely passing the role to the buttons */}
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