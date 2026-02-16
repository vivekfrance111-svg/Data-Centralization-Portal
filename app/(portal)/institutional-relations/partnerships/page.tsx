"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { Trophy, Plus, Loader2, Award, TrendingUp, LayoutGrid } from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

export default function RankingsPage() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  const [formData, setFormData] = useState({
    rankingBody: "",
    programName: "",
    year: "2026",
    rank: "",
    category: "",
    accreditationType: "",
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

  // Database Fetching for REAL Rankings
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .eq("type", "ranking")
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      toast.error("Failed to load real ranking data.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  const handleSaveRanking = async () => {
    if (!formData.rankingBody || !formData.rank) {
      toast.error("Ranking Body and Rank are required.")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("portal_data").insert([{
        type: "ranking",
        title: `${formData.rankingBody} - ${formData.programName}`,
        ranking_body: formData.rankingBody,
        program_name: formData.programName,
        publication_year: formData.year,
        rank_score: formData.rank,
        category: formData.category,
        status: "draft",
        created_by: userEmail
      }])

      if (error) throw error
      toast.success("Ranking successfully added to registry!")
      setShowForm(false)
      setFormData({ rankingBody: "", programName: "", year: "2026", rank: "", category: "", accreditationType: "" })
      fetchEntries()
    } catch (err) {
      toast.error("Database save failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-8 w-full">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Trophy className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rankings & Accreditations</h1>
              <p className="text-slate-500 text-sm mt-1">Institutional visas, labels, and global accreditation data.</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <Card className="border-amber-200 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CardHeader className="bg-amber-50/50 border-b">
              <CardTitle className="text-lg">Add New Performance Data</CardTitle>
              <CardDescription>Enter details exactly as they appear in the official publication.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Ranking Body / Accreditation *</Label>
                  <Input placeholder="e.g., Financial Times, QS World Rankings, EQUIS" value={formData.rankingBody} onChange={(e) => setFormData({...formData, rankingBody: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Year *</Label>
                  <Input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Program / Category</Label>
                  <Input placeholder="e.g., MSc Artificial Intelligence" value={formData.programName} onChange={(e) => setFormData({...formData, programName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Rank / Score *</Label>
                  <Input placeholder="e.g., #3, 5 Stars, or Accredited" value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Category</Label>
                  <Input placeholder="e.g., Masters in Management" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSaveRanking} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-base font-bold text-slate-800">Rankings Registry</CardTitle>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} Live Records</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm text-slate-500">Connecting to school database...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic">No rankings have been verified in the system yet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Ranking Body</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50">
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className="font-bold text-slate-900">{entry.ranking_body || entry.title}</TableCell>
                      <TableCell className="text-slate-600">{entry.program_name || "Institutional"}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{entry.publication_year || entry.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          {entry.rank_score || entry.rank}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <WorkflowActions entry={entry} user={{ role: userRole }} onUpdate={fetchEntries} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}