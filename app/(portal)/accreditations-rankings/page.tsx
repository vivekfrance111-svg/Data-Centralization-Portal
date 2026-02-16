"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { Trophy, Plus, Loader2, TrendingUp, Database, LayoutGrid } from "lucide-react"
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
  })

  // Fetch real user permissions
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

  // Fetch REAL entries from portal_data
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
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`)
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  // Save to database with DETAILED error logging
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
      
      toast.success("Saved to live registry!")
      setShowForm(false)
      setFormData({ rankingBody: "", programName: "", year: "2026", rank: "", category: "" })
      fetchEntries()
    } catch (err: any) {
      console.error("Supabase Save Error:", err)
      // THIS IS THE FIX: It will now tell you EXACTLY why it failed on the screen!
      toast.error(`Database Error: ${err.message || "Unknown error occurred"}`)
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
            <div className="bg-amber-100 p-3 rounded-xl border border-amber-200 shadow-sm">
              <Trophy className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rankings & Accreditations</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-2">
                  <Database className="h-3 w-3" /> Live Connection
                </Badge>
              </div>
              <p className="text-slate-500 text-sm mt-1 font-medium">Verified institutional performance and global standing.</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-slate-900 hover:bg-slate-800 shadow-lg">
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <Card className="border-amber-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="bg-amber-50/30 border-b py-4">
              <CardTitle className="text-lg font-bold text-amber-900">New Performance Record</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Ranking Body / Accreditation *</Label>
                  <Input className="h-12 border-slate-200" placeholder="e.g., Financial Times, QS World Rankings" value={formData.rankingBody} onChange={(e) => setFormData({...formData, rankingBody: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Year *</Label>
                  <Input className="h-12 border-slate-200" type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Program / Category</Label>
                  <Input className="h-12 border-slate-200" placeholder="e.g., MSc Data Science" value={formData.programName} onChange={(e) => setFormData({...formData, programName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Rank / Score *</Label>
                  <Input className="h-12 font-bold text-emerald-600 border-slate-200" placeholder="e.g., #3 or 5-Star" value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Global Category</Label>
                  <Input className="h-12 border-slate-200" placeholder="e.g., Global MBA" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-10 pt-6 border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="px-8 shadow-md" onClick={handleSaveRanking} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save to Registry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Registry Table */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b py-5 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg font-bold text-slate-800">Rankings Registry</CardTitle>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entries.length} Live Records</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-24 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500/50" />
                <p className="text-sm font-medium animate-pulse">Syncing with database...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-20 text-center text-slate-400 italic bg-slate-50/30">No real ranking data found in database.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[120px] px-6">Status</TableHead>
                    <TableHead>Ranking Body</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6"><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className="font-extrabold text-slate-900">{entry.ranking_body || entry.title}</TableCell>
                      <TableCell className="text-slate-600 font-medium">{entry.program_name || "Institutional"}</TableCell>
                      <TableCell className="text-slate-500">{entry.publication_year || entry.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                          <TrendingUp className="h-4 w-4" />
                          {entry.rank_score || entry.rank}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
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