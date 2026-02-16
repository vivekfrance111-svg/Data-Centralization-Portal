"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { Handshake, Plus, Loader2, ChevronRight, LayoutGrid, Globe, Building2, Database } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function PartnershipsPage() {
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState({
    partnerName: "",
    partnerType: "corporate",
    country: "",
    description: "",
    contactPerson: "",
  })

  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("email", user.email).maybeSingle()
        if (roleData) setUserRole(roleData.role.trim().toLowerCase())
      }
    } catch (err) { console.error(err) }
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase.from("portal_data").select("*").eq("type", "partnership").order("created_at", { ascending: false })
      if (error) throw error
      setEntries(data || [])
    } catch (err) { toast.error("Failed to load partnerships.") } finally { setIsLoadingData(false) }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSaveDraft = async () => {
    if (!formData.partnerName || !formData.country) return toast.error("Name and Country required.")
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("portal_data").insert([{
        type: "partnership", title: formData.partnerName, partner_name: formData.partnerName,
        partner_type: formData.partnerType, country: formData.country, description: formData.description,
        status: "draft", created_by: userEmail
      }])
      if (error) throw error
      toast.success("Partnership draft saved!")
      setShowForm(false); setStep(1)
      setFormData({ partnerName: "", partnerType: "corporate", country: "", description: "", contactPerson: "" })
      fetchEntries()
    } catch (err) { toast.error("Failed to save.") } finally { setIsSubmitting(false) }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-8 w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl"><Handshake className="h-7 w-7 text-emerald-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Institutional Partnerships</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 gap-1"><Database className="h-3 w-3" /> Live</Badge>
              </div>
              <p className="text-slate-500 text-sm mt-1">Global corporate and academic alliances.</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> New Partnership</Button>
        </div>

        {showForm && (
          <Card className="border-emerald-200 shadow-xl">
            <CardHeader className="bg-emerald-50/30 border-b">
              <CardTitle>Step {step}: {step === 1 ? "Details" : "Objectives"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              {step === 1 ? (
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2 space-y-2"><Label>Organization Name *</Label><Input value={formData.partnerName} onChange={(e) => updateField("partnerName", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Partner Type</Label>
                    <Select value={formData.partnerType} onValueChange={(val) => updateField("partnerType", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="academic">Academic</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Country *</Label><Input value={formData.country} onChange={(e) => updateField("country", e.target.value)} /></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2"><Label>Strategic Description *</Label><Textarea className="min-h-[150px]" value={formData.description} onChange={(e) => updateField("description", e.target.value)} /></div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                {step === 1 ? <Button onClick={() => setStep(2)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={handleSaveDraft} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Save"}</Button>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="border-b py-5 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-slate-400" /> Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div> : entries.length === 0 ? <div className="p-20 text-center text-slate-400">No alliances yet.</div> : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="flex gap-2"><StatusBadge status={entry.status} /><Badge variant="outline">{entry.partner_type}</Badge></div>
                      <h3 className="text-lg font-bold">{entry.partner_name || entry.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex gap-1"><Globe className="h-3 w-3" /> {entry.country}</span></div>
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