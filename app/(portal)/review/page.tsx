"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import {
  ClipboardCheck,
  BookOpen,
  Handshake,
  Trophy,
  FileText,
  Clock,
  CheckCircle,
  Globe,
  Filter,
  User,
  Calendar,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import AuthGuard from "@/components/auth-guard"

// Status configurations for the tabs
const statusTabs = [
  { value: "all", label: "All", icon: FileText },
  { value: "draft", label: "Drafts", icon: FileText },
  { value: "pending_review", label: "Review", icon: Clock },
  { value: "published", label: "Published", icon: Globe },
]

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [userRole, setUserRole] = useState<string>("author")
  const [userEmail, setUserEmail] = useState<string>("")

  // 1. Fetch User Role safely
  const fetchUserPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("email", user.email)
          .maybeSingle()
        
        if (data) setUserRole(data.role.trim().toLowerCase())
      }
    } catch (err) {
      console.error("Auth error:", err)
    }
  }, [])

  // 2. Fetch all entries from the database
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      toast.error("Failed to fetch registry.")
      console.error(err)
    } finally {
      setIsLoading(false) // FIXED: Changed from setIsLoadingData to setIsLoading
    }
  }, [])

  useEffect(() => {
    fetchUserPermissions()
    fetchEntries()
  }, [fetchUserPermissions, fetchEntries])

  // 3. Filter logic for the UI
  const filteredEntries = useMemo(() => {
    let result = entries
    if (activeTab !== "all") {
      result = result.filter((e) => e.status === activeTab)
    }
    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter)
    }
    return result
  }, [entries, activeTab, typeFilter])

  // 4. Calculate counts for the tab badges
  const counts = useMemo(() => {
    return {
      all: entries.length,
      draft: entries.filter(e => e.status === 'draft').length,
      pending_review: entries.filter(e => e.status === 'pending_review').length,
      published: entries.filter(e => e.status === 'published').length,
    }
  }, [entries])

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Review & Publish
            </h1>
            <p className="text-slate-500 mt-1">
              Centralized pipeline for institutional data verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="academic">Research</SelectItem>
                <SelectItem value="partnership">Partnerships</SelectItem>
                <SelectItem value="ranking">Rankings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Permissions Badge Area */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-sm text-indigo-900 font-medium">
            Active Role: <span className="uppercase font-bold">{userRole}</span>. 
            {userRole === "admin" ? " Full administrative control enabled." : " View-only access to community submissions."}
          </p>
        </div>

        {/* Tabs Control */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 p-1">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-6">
                {tab.label}
                <Badge variant="secondary" className="ml-2 bg-white text-slate-900">
                  {counts[tab.value as keyof typeof counts] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="animate-spin text-primary/40 h-10 w-10" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-20 text-center text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No entries found matching this status.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow overflow-hidden border-slate-200">
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border">
                          {entry.type === 'academic' ? <BookOpen className="h-5 w-5 text-slate-500" /> : <Handshake className="h-5 w-5 text-slate-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={entry.status} />
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                              {entry.type || 'Academic'}
                            </Badge>
                          </div>
                          <h3 
                            className="font-bold text-slate-900 truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                          >
                            {entry.title || entry.partner_name || "Untitled Entry"}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium"><User className="h-3 w-3" /> {entry.created_by || "system"}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {entry.created_at?.split("T")[0]}</span>
                          </div>
                          
                          {expandedId === entry.id && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 leading-relaxed border border-slate-100 animate-in fade-in slide-in-from-top-2">
                              {entry.abstract || entry.description || "No description or abstract provided for this entry."}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Workflow Logic */}
                      <WorkflowActions entry={entry} user={{ role: userRole }} onUpdate={fetchEntries} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Global Pipeline Graphic */}
        <Card className="bg-slate-900 text-white border-none shadow-xl">
          <CardContent className="p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Master Verification Pipeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">1</div>
                  <span className="font-bold text-slate-100 italic">Submission</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Authors submit research, partnerships, or rankings. Data is initially locked to the creator.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">2</div>
                  <span className="font-bold text-slate-100 italic">Validation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Admins/Reviewers verify data against institutional evidence. Rejected items return to Draft status.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">3</div>
                  <span className="font-bold text-slate-100 italic">Publication</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Final approval pushes data to the central Aivancity database, making it available for school-wide reporting.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}