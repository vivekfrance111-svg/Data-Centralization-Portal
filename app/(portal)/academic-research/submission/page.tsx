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

  const entries = (getEntriesByType("academic") || []) as AcademicEntry[]
  const user = getCurrentUser()
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }; delete next[field]; return next;
      })
    }
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
      toast.error("Validation failed");
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
        createdBy: user?.id || "unknown",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        ...result.data,
      }

      addEntry(entry);
      toast.success("Saved successfully!");
      setShowForm(false);
      setStep(1);
      setFormData({ publicationType: "journal_article", year: "2026", department: "AI & Data Science" });
      refresh();
    } catch (err: any) {
      console.error("Database Error:", err);
      toast.error(err.message || "Failed to connect to Supabase");
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
            <CardTitle className="text-base">New Academic Submission</CardTitle>
            <CardDescription>Step {step} of 2 &mdash; {step === 1 ? "Details" : "Content"}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={formData.title || ""} onChange={(e) => updateField("title", e.target.value)} />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="authors">Authors *</Label>
                  <Input id="authors" value={formData.authors || ""} onChange={(e) => updateField("authors", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.publicationType} onValueChange={(v) => updateField("publicationType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journal_article">Journal Article</SelectItem>
                      <SelectItem value="conference_paper">Conference Paper</SelectItem>
                      <SelectItem value="blog_post">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input id="year" value={formData.year || ""} onChange={(e) => updateField("year", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dept">Department *</Label>
                  <Select value={formData.department} onValueChange={(v) => updateField("department", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI & Data Science">AI & Data Science</SelectItem>
                      <SelectItem value="Business & Management">Business & Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="abstract">Abstract *</Label>
                  <Textarea id="abstract" value={formData.abstract || ""} onChange={(e) => updateField("abstract", e.target.value)} className="min-h-[120px]" />
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords *</Label>
                  <Input id="keywords" value={formData.keywords || ""} onChange={(e) => updateField("keywords", e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => { setShowForm(false); setStep(1); }}>Cancel</Button>
              {step === 1 ? (
                <Button onClick={() => { if (validateStep(1)) setStep(2) }}>Next Step</Button>
              ) : (
                <Button onClick={handleSaveDraft} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save as Draft"}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submissions</CardTitle>
          <CardDescription>{entries.length} entries total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={entry.status} />
                    <span className="text-xs text-muted-foreground capitalize">{entry.publicationType}</span>
                  </div>
                  <h3 className="text-sm font-medium">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{entry.authors} · {entry.year}</p>
                </div>
                <WorkflowActions entry={entry} user={user} onUpdate={refresh} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}