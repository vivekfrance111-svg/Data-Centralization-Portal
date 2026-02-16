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
import { getCurrentUser } from "@/lib/store"
import { BookOpen, Plus, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AcademicResearchPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // NEW: State to hold your REAL database entries
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [formData, setFormData] = useState<Partial<AcademicFormData>>({
    publicationType: "journal_article",
    year: "2026",
    department: "AI & Data Science",
  })

  const user = getCurrentUser()

  // NEW: Function to pull data from Supabase
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false }) // Shows newest first!

      if (error) throw error

      if (data) {
        // Translate Supabase columns into the format your UI expects
        const formattedData: AcademicEntry[] = data.map((item) => ({
          id: item.id.toString(),
          type: "academic",
          status: item.status || "draft",
          title: item.title || "Untitled",
          authors: item.authors || "Unknown",
          publicationType: item.publication_type || "journal_article",
          year: item.publication_year || "",
          department: item.department || "",
          journal: item.journal || "",
          abstract: item.abstract || "",
          keywords: item.keywords || "",
          createdBy: "user", // Defaulting since we don't have auth yet
          createdAt: item.created_at.split("T")[0],
          updatedAt: item.created_at.split("T")[0],
        }))
        setEntries(formattedData)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      toast.error("Failed to load submissions from database.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  // NEW: Run the fetch function as soon as the page loads
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  function updateField(field: keyof AcademicFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validateStep(s: number): boolean {
    const result = academicSchema.safeParse(formData)
    if (result.success) {
      setErrors({})
      return true
    }

    const fieldErrors: Record<string, string> = {}
    result.error.errors.forEach((e) => {
      if (e.path[0]) {
        fieldErrors[e.path[0].toString()] = e.message
      }
    })

    const step1Fields = ["title", "authors", "publicationType", "year", "department"]
    const step2Fields = ["abstract", "keywords"]
    const relevantFields = s === 1 ? step1Fields : step2Fields
    const relevantErrors: Record<string, string> = {}

    relevantFields.forEach((f) => {
      if (fieldErrors[f]) relevantErrors[f] = fieldErrors[f]
    })

    setErrors(relevantErrors)
    return Object.keys(relevantErrors).length === 0
  }

  async function handleSaveDraft() {
    setIsSubmitting(true)

    const result = academicSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message
      })
      setErrors(fieldErrors)
      toast.error("Please fix the validation errors before saving.")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from("portal_data")
        .insert([
          {
            title: result.data.title,
            authors: result.data.authors,
            publication_type: result.data.publicationType,
            journal: result.data.journal || "",
            publication_year: result.data.year,
            doi: result.data.doi || "",
            department: result.data.department,
            abstract: result.data.abstract,
            keywords: result.data.keywords,
            status: "draft",
          },
        ])

      if (error) throw error

      toast.success("Entry saved to database successfully!")

      // Reset Form
      setShowForm(false)
      setStep(1)
      setFormData({
        publicationType: "journal_article",
        year: "2026",
        department: "AI & Data Science",
      })
      setErrors({})
      
      // NEW: Refresh the data list instantly after saving!
      fetchEntries()

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Database Error"
      console.error("Supabase Database Error:", err)
      toast.error(errorMessage || "Failed to save data. Check the console.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function FieldError({ field }: { field: string }) {
    if (!errors[field]) return null
    return (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-info" />
            Academic Research
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit publications, blog posts, and research papers
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Academic Submission</CardTitle>
            <CardDescription>
              Step {step} of 2 &mdash; {step === 1 ? "Publication Details" : "Content & Keywords"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Full title of the publication"
                  />
                  <FieldError field="title" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="authors">Authors *</Label>
                  <Input
                    id="authors"
                    value={formData.authors || ""}
                    onChange={(e) => updateField("authors", e.target.value)}
                    placeholder="e.g., Jean-Luc Martin, Marie Dupont"
                  />
                  <FieldError field="authors" />
                </div>
                <div>
                  <Label htmlFor="publicationType">Publication Type *</Label>
                  <Select
                    value={formData.publicationType}
                    onValueChange={(v) => updateField("publicationType", v)}
                  >
                    <SelectTrigger id="publicationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journal_article">Journal Article</SelectItem>
                      <SelectItem value="conference_paper">Conference Paper</SelectItem>
                      <SelectItem value="book_chapter">Book Chapter</SelectItem>
                      <SelectItem value="working_paper">Working Paper</SelectItem>
                      <SelectItem value="blog_post">Blog Post</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError field="publicationType" />
                </div>
                <div>
                  <Label htmlFor="journal">Journal / Conference</Label>
                  <Input
                    id="journal"
                    value={formData.journal || ""}
                    onChange={(e) => updateField("journal", e.target.value)}
                    placeholder="Journal or conference name"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    value={formData.year || ""}
                    onChange={(e) => updateField("year", e.target.value)}
                    placeholder="2026"
                  />
                  <FieldError field="year" />
                </div>
                <div>
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi || ""}
                    onChange={(e) => updateField("doi", e.target.value)}
                    placeholder="10.xxxx/xxxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) => updateField("department", v)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI & Data Science">AI & Data Science</SelectItem>
                      <SelectItem value="Business & Management">Business & Management</SelectItem>
                      <SelectItem value="Ethics & Society">Ethics & Society</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError field="department" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="abstract">Abstract *</Label>
                  <Textarea
                    id="abstract"
                    value={formData.abstract || ""}
                    onChange={(e) => updateField("abstract", e.target.value)}
                    placeholder="Provide a comprehensive abstract..."
                    className="min-h-[140px]"
                  />
                  <FieldError field="abstract" />
                </div>
                <div>
                  <Label htmlFor="keywords">Keywords *</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords || ""}
                    onChange={(e) => updateField("keywords", e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                  <FieldError field="keywords" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setStep(1); setErrors({}) }}>
                  Cancel
                </Button>
                {step < 2 ? (
                  <Button onClick={() => { if (validateStep(1)) setStep(2) }}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSaveDraft} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save as Draft"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submissions</CardTitle>
          <CardDescription>
            {isLoadingData ? "Loading from database..." : `${entries.length} academic entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No entries found. Create your first submission above!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {String(entry.publicationType).replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium leading-relaxed">{entry.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.authors} &middot; {entry.year} &middot; {entry.department}
                      </p>
                      {entry.journal && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">{entry.journal}</p>
                      )}
                    </div>
                    {/* Pass the user and a refresh function so workflow actions can trigger a re-fetch */}
                    <WorkflowActions entry={entry} user={user!} onUpdate={fetchEntries} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}