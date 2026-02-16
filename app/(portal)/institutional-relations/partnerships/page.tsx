"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge" // Added the missing import
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { Handshake, Plus, Loader2, ChevronRight, LayoutGrid, Globe, Building2 } from "lucide-react"
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
    startDate: "2026-01-01",
    contactPerson: "",
  })

  // Auth & Permissions
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
        
        if (roleData) setUserRole(roleData.role.trim().toLowerCase())
      }
    } catch (err) {
      console.error("Auth error:", err)
    }
  }, [])

  // Database Fetching
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .eq("type", "partnership")
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      toast.error("Failed to load partnerships.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    if (!formData.partnerName || !formData.country) {
      toast.error("Partner Name and Country are required.")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from("portal_data").insert([{
        type: "partnership",
        title: formData.partnerName, 
        partner_name: formData.partnerName,
        partner_type: formData.partnerType,
        country: formData.country,
        description: formData.description,
        status: "draft",
        created_by: userEmail
      }])

      if (error) throw error
      toast.success("Partnership draft saved!")
      setShowForm(false)
      setStep(1)
      setFormData({
        partnerName: "",
        partnerType: "corporate",
        country: "",
        description: "",
        startDate: "2026-01-01",
        contactPerson: "",
      })
      fetchEntries()
    } catch (err) {
      toast.error("Failed to save.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-8 w-full">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Handshake className="h-6 w-6 text-primary" />
              Institutional Partnerships
            </h1>
            <p className="text-slate-500 mt-1">Manage global corporate and academic alliances.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="shadow-md">
            <Plus className="h-4 w-4 mr-1" /> New Partnership
          </Button>
        </div>

        {/* Multi-Step Form */}
        {showForm && (
          <Card className="border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Register New Alliance</CardTitle>
                <div className="flex gap-2">
                  <div className={`h-2 w-12 rounded-full ${step === 1 ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div className={`h-2 w-12 rounded-full ${step === 2 ? 'bg-primary' : 'bg-slate-200'}`} />
                </div>
              </div>
              <CardDescription>Step {step}: {step === 1 ? "Organization Details" : "Strategic Objectives"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {step === 1 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-semibold">Partner Organization Name *</Label>
                        <Input className="h-12" placeholder="e.g., Microsoft France, MIT, etc." value={formData.partnerName} onChange={(e) => updateField("partnerName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Partner Type</Label>
                        <Select value={formData.partnerType} onValueChange={(val) => updateField("partnerType", val)}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="government">Government</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Country / Region *</Label>
                        <Input className="h-12" placeholder="France, Global, etc." value={formData.country} onChange={(e) => updateField("country", e.target.value)} />
                    </div>
                 </div>
              ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Strategic Description *</Label>
                      <Textarea className="min-h-[180px]" placeholder="Outline the main goals of this partnership..." value={formData.description} onChange={(e) => updateField("description", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Main Contact Person</Label>
                      <Input className="h-12" placeholder="Name of primary stakeholder" value={formData.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
                    </div>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
                <Button variant="ghost" onClick={() => { setShowForm(false); setStep(1); }}>Cancel</Button>
                {step === 1 ? (
                  <Button className="px-10 h-12" onClick={() => setStep(2)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-12" onClick={() => setStep(1)}>Back</Button>
                    <Button className="px-10 h-12 shadow-lg" onClick={handleSaveDraft} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Save Partnership"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registry List */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg font-bold text-slate-800">Partnership Registry</CardTitle>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} Alliances</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-sm font-medium">Loading alliance data...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic bg-slate-50/30">No partnerships registered yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-slate-50/50 group">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.status} />
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                          {entry.partner_type || 'corporate'}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">
                        {entry.partner_name || entry.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {entry.country}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1.5 capitalize"><Building2 className="h-3.5 w-3.5" /> {entry.partner_type} Alliance</span>
                      </div>
                    </div>
                    {/* Role-Based Workflow Actions */}
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