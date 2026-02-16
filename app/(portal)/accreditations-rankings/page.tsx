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
    rankingBody: "", programName: "", year: "2026", rank: "", category: "",
  })

  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("email", user.email).maybeSingle()
        if (roleData) setUserRole(roleData.role.trim().toLowerCase())
      }
    } catch (err) { console.error("Auth error:", err) }
  }, [])

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const { data, error } = await supabase.from("portal_data").select("*").eq("type", "ranking").order("created_at", { ascending: false })
      if (error) throw error
      setEntries(data || [])
    } catch (err) { toast.error("Database sync failed.") } finally { setIsLoadingData(false) }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  const handleSaveRanking = async () => {
    if (!formData.rankingBody || !formData.rank) return toast.error("Ranking Body and Rank are required.")
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("portal_data").insert([{
        type: "ranking", title: `${formData.rankingBody} - ${formData.programName}`, ranking_body: formData.rankingBody,
        program_name: formData.programName, publication_year: formData.year, rank_score: formData.rank,
        category: formData.category, status: "draft", created_by: userEmail
      }])
      if (error) throw error
      toast.success("Saved to live registry!")
      setShowForm(false)
      setFormData({ rankingBody: "", programName: "", year: "2026", rank: "", category: "" })
      fetchEntries()
    } catch (err) { toast.error("Failed to save.") } finally { setIsSubmitting(false) }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col gap-8 w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-xl"><Trophy className="h-7 w-7 text-amber-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Rankings & Accreditations</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 gap-1"><Database className="h-3 w-3" /> Live</Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> New Entry</Button>
        </div>

        {showForm && (
          <Card className="border-amber-200 shadow-xl">
            <CardHeader className="bg-amber-50/30 border-b"><CardTitle>New Performance Record</CardTitle></CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2"><Label>Ranking Body *</Label><Input value={formData.rankingBody} onChange={(e) => setFormData({...formData, rankingBody: e.target.value})} /></div>
                <div className="space-y-2"><Label>Program</Label><Input value={formData.programName} onChange={(e) => setFormData({...formData, programName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Rank / Score *</Label><Input className="font-bold text-emerald-600" value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSaveRanking} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="border-b py-5 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-slate-400" /> Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div> : entries.length === 0 ? <div className="p-20 text-center text-slate-400">No data found.</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Body</TableHead><TableHead>Program</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell><StatusBadge status={entry.status} /></TableCell>
                      <TableCell className="font-bold">{entry.ranking_body || entry.title}</TableCell>
                      <TableCell>{entry.program_name || "Institutional"}</TableCell>
                      <TableCell><div className="flex items-center gap-1 font-bold text-emerald-700"><TrendingUp className="h-3 w-3" />{entry.rank_score || entry.rank}</div></TableCell>
                      <TableCell className="text-right"><WorkflowActions entry={entry} user={{ role: userRole }} onUpdate={fetchEntries} /></TableCell>
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