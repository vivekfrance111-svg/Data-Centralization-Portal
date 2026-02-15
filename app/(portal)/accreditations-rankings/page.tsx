"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { rankingSchema, type RankingEntry, type RankingFormData } from "@/lib/types"
import { addEntry, getEntriesByType, getCurrentUser } from "@/lib/store"
import { Trophy, Plus, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "sonner"

function RankTrend({ current, previous }: { current: string; previous?: string }) {
  if (!previous) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  const curr = parseInt(current)
  const prev = parseInt(previous)
  if (isNaN(curr) || isNaN(prev)) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (curr < prev) return <TrendingUp className="h-3.5 w-3.5 text-success" />
  if (curr > prev) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

export default function AccreditationsRankingsPage() {
  const [tick, setTick] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<RankingFormData>>({
    year: "2026",
    category: "Masters in AI",
  })

  const entries = getEntriesByType("ranking") as RankingEntry[]
  const user = getCurrentUser()

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleSaveDraft() {
    const result = rankingSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message
      })
      setErrors(fieldErrors)
      toast.error("Please fix the validation errors before saving.")
      return
    }

    const entry: RankingEntry = {
      id: `r${Date.now()}`,
      type: "ranking",
      status: "draft",
      createdBy: user.id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      ...result.data,
    }

    addEntry(entry)
    toast.success("Ranking saved as draft successfully.")
    setShowForm(false)
    setFormData({ year: "2026", category: "Masters in AI" })
    setErrors({})
    refresh()
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
            <Trophy className="h-6 w-6 text-warning" />
            Rankings & Accreditations
          </h1>
          <p className="text-muted-foreground mt-1">
            Course rankings, visas, labels, and accreditation data
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Ranking / Accreditation</CardTitle>
            <CardDescription>Record a new ranking result or accreditation milestone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rankingBody">Ranking Body *</Label>
                <Input
                  id="rankingBody"
                  value={formData.rankingBody || ""}
                  onChange={(e) => updateField("rankingBody", e.target.value)}
                  placeholder="e.g., Le Figaro Etudiant"
                />
                <FieldError field="rankingBody" />
              </div>
              <div>
                <Label htmlFor="programName">Program Name *</Label>
                <Input
                  id="programName"
                  value={formData.programName || ""}
                  onChange={(e) => updateField("programName", e.target.value)}
                  placeholder="e.g., MSc Artificial Intelligence"
                />
                <FieldError field="programName" />
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
                <Label htmlFor="rank">Rank *</Label>
                <Input
                  id="rank"
                  value={formData.rank || ""}
                  onChange={(e) => updateField("rank", e.target.value)}
                  placeholder="e.g., 3"
                />
                <FieldError field="rank" />
              </div>
              <div>
                <Label htmlFor="previousRank">Previous Rank</Label>
                <Input
                  id="previousRank"
                  value={formData.previousRank || ""}
                  onChange={(e) => updateField("previousRank", e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField("category", v)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masters in AI">Masters in AI</SelectItem>
                    <SelectItem value="Undergraduate AI Programs">Undergraduate AI Programs</SelectItem>
                    <SelectItem value="Data Science & AI">Data Science & AI</SelectItem>
                    <SelectItem value="Business & Tech">Business & Tech</SelectItem>
                    <SelectItem value="General University Ranking">General University Ranking</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError field="category" />
              </div>
              <div>
                <Label htmlFor="accreditationType">Accreditation Type</Label>
                <Input
                  id="accreditationType"
                  value={formData.accreditationType || ""}
                  onChange={(e) => updateField("accreditationType", e.target.value)}
                  placeholder="e.g., RNCP Level 7, CGE Label"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex items-center justify-end mt-6 pt-4 border-t gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setErrors({}) }}>
                Cancel
              </Button>
              <Button onClick={handleSaveDraft}>
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rankings Table</CardTitle>
          <CardDescription>{entries.length} ranking entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Ranking Body</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Accreditation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="font-medium">{entry.rankingBody}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.programName}</TableCell>
                    <TableCell className="text-center">{entry.year}</TableCell>
                    <TableCell className="text-center font-bold">#{entry.rank}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <RankTrend current={entry.rank} previous={entry.previousRank} />
                        {entry.previousRank && (
                          <span className="text-xs text-muted-foreground">
                            (was #{entry.previousRank})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.accreditationType || "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      <WorkflowActions entry={entry} user={user} onUpdate={refresh} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
