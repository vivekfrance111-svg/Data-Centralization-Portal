"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { partnershipSchema, type PartnershipEntry, type PartnershipFormData } from "@/lib/types"
import { addEntry, getEntriesByType, getCurrentUser } from "@/lib/store"
import { Handshake, Plus, AlertCircle, Building2, GraduationCap, Landmark, Heart } from "lucide-react"
import { toast } from "sonner"

const partnerTypeIcons = {
  corporate: Building2,
  academic: GraduationCap,
  government: Landmark,
  ngo: Heart,
}

export default function PartnershipsPage() {
  const [tick, setTick] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Partial<PartnershipFormData>>({
    partnerType: "corporate",
  })

  const entries = getEntriesByType("partnership") as PartnershipEntry[]
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
    const result = partnershipSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message
      })
      setErrors(fieldErrors)
      toast.error("Please fix the validation errors before saving.")
      return
    }

    const entry: PartnershipEntry = {
      id: `p${Date.now()}`,
      type: "partnership",
      status: "draft",
      createdBy: user.id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      ...result.data,
    }

    addEntry(entry)
    toast.success("Partnership saved as draft successfully.")
    setShowForm(false)
    setFormData({ partnerType: "corporate" })
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
            <Handshake className="h-6 w-6 text-success" />
            Partnerships
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage corporate, academic, and institutional partnerships
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Partnership
        </Button>
      </div>

      {/* Submission Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Partnership Entry</CardTitle>
            <CardDescription>Enter details about the corporate or institutional partnership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="partnerName">Partner Name *</Label>
                <Input
                  id="partnerName"
                  value={formData.partnerName || ""}
                  onChange={(e) => updateField("partnerName", e.target.value)}
                  placeholder="Company or institution name"
                />
                <FieldError field="partnerName" />
              </div>
              <div>
                <Label htmlFor="partnerType">Partner Type *</Label>
                <Select
                  value={formData.partnerType}
                  onValueChange={(v) => updateField("partnerType", v)}
                >
                  <SelectTrigger id="partnerType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="ngo">NGO / Non-Profit</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError field="partnerType" />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country || ""}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="e.g., France"
                />
                <FieldError field="country" />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
                <FieldError field="startDate" />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => updateField("endDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson || ""}
                  onChange={(e) => updateField("contactPerson", e.target.value)}
                  placeholder="Primary contact name"
                />
                <FieldError field="contactPerson" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ""}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  placeholder="contact@example.com"
                />
                <FieldError field="contactEmail" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="strategicObjectives">Strategic Objectives *</Label>
                <Textarea
                  id="strategicObjectives"
                  value={formData.strategicObjectives || ""}
                  onChange={(e) => updateField("strategicObjectives", e.target.value)}
                  placeholder="Key strategic objectives of this partnership..."
                  className="min-h-[80px]"
                />
                <FieldError field="strategicObjectives" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Detailed description of the partnership..."
                  className="min-h-[100px]"
                />
                <FieldError field="description" />
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

      {/* Existing Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Partnerships</CardTitle>
          <CardDescription>{entries.length} partnership entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const TypeIcon = partnerTypeIcons[entry.partnerType]
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {entry.partnerType}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium">{entry.partnerName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.country} &middot; {entry.startDate}
                        {entry.endDate ? ` to ${entry.endDate}` : " (ongoing)"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {entry.strategicObjectives}
                      </p>
                      {entry.rejectionReason && (
                        <p className="text-xs text-destructive mt-1 bg-destructive/5 rounded px-2 py-1">
                          Rejection reason: {entry.rejectionReason}
                        </p>
                      )}
                    </div>
                    <WorkflowActions entry={entry} user={user} onUpdate={refresh} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
