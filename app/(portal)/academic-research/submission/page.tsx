"use client"
import { supabase } from "@/lib/supabase"
import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { academicSchema, type AcademicEntry, type AcademicFormData } from "@/lib/types"
import { addEntry, getEntriesByType, getCurrentUser } from "@/lib/store"
import { BookOpen, Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function AcademicResearchPage() {
  const [tick, setTick] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  const entries = getEntriesByType("academic") as AcademicEntry[]
  const user = getCurrentUser()
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }; delete next[field]; return next;
    })
  }

  function validateStep(s: number): boolean {
    const result = academicSchema.safeParse(formData)
    if (result.success) { setErrors({}); return true; }

    const fieldErrors: Record<string, string> = {}
    result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message })

    const step1Fields = ["title", "authors", "publicationType", "year", "department"]
    const step2Fields = ["abstract", "keywords"]
    const relevantFields = s === 1 ? step1Fields : step2Fields
    const relevantErrors: Record<string, string> = {}
    relevantFields.forEach((f) => { if (fieldErrors[f]) relevantErrors[f] = fieldErrors[f] })

    setErrors(relevantErrors);
    return Object.keys(relevantErrors).length === 0;
  }

  async function handleSaveDraft() {
    setIsSubmitting(true);
    const result = academicSchema.safeParse(formData)
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message })
      setErrors(fieldErrors);
      toast.error("Please fix validation errors.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portal_data')
        .insert([{
          title: result.data.title,
          authors: result.data.authors,
          publication_type: result.data.publicationType,
          journal: result.data.journal || "",
          publication_year: result.data.year,
          doi: result.data.doi || "",
          department: result.data.department,
          abstract: result.data.abstract,
          keywords: result.data.keywords,
          status: "draft"
        }])
        .select()

      if (error) throw error;

      const entry: AcademicEntry = {
        id: data?.[0]?.id?.toString() || `a${Date.now()}`,
        type: "academic",
        status: "draft",
        createdBy: user.id,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        ...result.data,
      }

      addEntry(entry);
      toast.success("Saved to database!");
      setShowForm(false);
      setStep(1);
      setFormData({ publicationType: "journal_article", year: "2026", department: "AI & Data Science" });
      refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Database Error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-info" /> Academic Research
          </h1>
          <p className="text-muted-foreground mt-1">Submit publications and research papers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-1.5 h-4 w-4" /> New Entry</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Submission</CardTitle>
            <CardDescription>Step {step} of 2</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Title *</Label>
                  <Input value={formData.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label>Authors *</Label>
                  <Input value={formData.authors || ""} onChange={(e) => updateField("authors", e.target.value)} />
                </div>
                <div>
                  <Label>Publication Type *</Label>
                  <Select value={formData.publicationType} onValueChange={(v) => updateField("publicationType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journal_article">Journal Article</SelectItem>
                      <SelectItem value="blog_post">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year *</Label>
                  <Input value={formData.year || ""} onChange={(e) => updateField("year", e.target.value)} />
                </div>
                <div>
                  <Label>Department *</Label>
                  <Select value={formData.department} onValueChange={(v) => updateField("department", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI & Data Science">AI & Data Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Label>Abstract *</Label>
                <Textarea value={formData.abstract || ""} onChange={(e) => updateField("abstract", e.target.value)} />
                <Label>Keywords *</Label>
                <Input value={formData.keywords || ""} onChange={(e) => updateField("keywords", e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowForm(false); setStep(1); }}>Cancel</Button>
              {step === 1 ? (
                <Button onClick={() => { if (validateStep(1)) setStep(2) }}>Next</Button>
              ) : (
                <Button onClick={handleSaveDraft} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save as Draft"}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Submissions</CardTitle></CardHeader>
        <CardContent>
          {entries.map((entry) => (
            <div key={entry.id} className="border-b p-4 flex justify-between">
              <div>
                <StatusBadge status={entry.status} />
                <h3 className="font-medium">{entry.title}</h3>
              </div>
              <WorkflowActions entry={entry} user={user} onUpdate={refresh} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}