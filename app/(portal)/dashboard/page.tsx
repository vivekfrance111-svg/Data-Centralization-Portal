"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Clock,
  CheckCircle,
  Globe,
  XCircle,
  BookOpen,
  Handshake,
  Trophy,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import AuthGuard from "@/components/auth-guard"

// Define our workflow steps visually
const workflowSteps = [
  { step: 1, title: "Draft", description: "Author creates and saves entry", icon: FileText, color: "bg-slate-100 text-slate-500" },
  { step: 2, title: "Pending Review", description: "Submitted for departmental review", icon: Clock, color: "bg-blue-100 text-blue-600" },
  { step: 3, title: "Published", description: "Released by Administrator", icon: Globe, color: "bg-green-100 text-green-600" },
]

export default function DashboardPage() {
  const [userName, setUserName] = useState("User")
  const [isLoading, setIsLoading] = useState(true)
  
  // Real stats from database
  const [stats, setStats] = useState({
    drafts: 0,
    pending: 0,
    published: 0,
    academic: 0,
    partnerships: 0,
    rankings: 0,
  })
  
  // Real recent entries
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true)
        
        // 1. Get the current logged-in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
          // Extract the first part of the email to use as a name (e.g., v@v.com -> v)
          setUserName(user.email.split("@")[0].toUpperCase())
        }

        // 2. Fetch ALL entries from the portal_data table to calculate stats
        const { data, error } = await supabase
          .from("portal_data")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        if (data) {
          let drafts = 0, pending = 0, published = 0
          let academic = 0, partnerships = 0, rankings = 0

          // Calculate our live statistics
          data.forEach((item) => {
            // Status counts
            if (item.status === "draft") drafts++
            if (item.status === "pending_review") pending++
            if (item.status === "published") published++
            
            // Type counts (Defaulting to academic since that's what we built so far)
            const type = item.type || "academic"
            if (type === "academic") academic++
            if (type === "partnership") partnerships++
            if (type === "ranking") rankings++
          })

          setStats({ drafts, pending, published, academic, partnerships, rankings })

          // 3. Grab the 6 most recent entries for the list
          const formattedEntries = data.slice(0, 6).map(item => ({
            id: item.id.toString(),
            type: item.type || "academic",
            title: item.title || item.partner_name || item.program_name || "Untitled",
            status: item.status || "draft",
            updatedAt: item.created_at ? item.created_at.split("T")[0] : "Unknown"
          }))
          
          setRecentEntries(formattedEntries)
        }
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Aivancity Institutional Data Centralization Portal
          </p>
        </div>

        {/* Workflow Explainer */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 bg-white border-b">
            <CardTitle className="text-base text-slate-800">Publication Workflow</CardTitle>
            <CardDescription>All data entries follow this approval pipeline before publication</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {workflowSteps.map((ws, i) => (
                <div key={ws.step} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ws.color}`}>
                    <ws.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{ws.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{ws.description}</p>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-slate-300 shrink-0 hidden sm:block mt-2.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <FileText className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.drafts}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Drafts</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Clock className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Review</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <Globe className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.published}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="pt-6 pb-6 px-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                    <BookOpen className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900">{stats.academic + stats.partnerships + stats.rankings}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Entries</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Module Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm hover:border-primary/50 transition-colors group">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                        <BookOpen className="h-5 w-5 text-indigo-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Academic Research</p>
                        <p className="text-xl font-bold text-indigo-700">{stats.academic}</p>
                      </div>
                    </div>
                    <Link href="/academic-research/submission">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:border-primary/50 transition-colors group">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                        <Handshake className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Partnerships</p>
                        <p className="text-xl font-bold text-emerald-700">{stats.partnerships}</p>
                      </div>
                    </div>
                    <Link href="/institutional-relations/partnerships">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:border-primary/50 transition-colors group">
                <CardContent className="pt-5 pb-5 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                        <Trophy className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Rankings</p>
                        <p className="text-xl font-bold text-amber-700">{stats.rankings}</p>
                      </div>
                    </div>
                    <Link href="/accreditations-rankings">
                      <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <Card className="shadow-sm">
              <CardHeader className="bg-white border-b py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Recent Entries</CardTitle>
                  </div>
                  <Link href="/review">
                    <Button variant="outline" size="sm">
                      View All Inbox
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentEntries.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 italic">No entries found yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 border">
                            {entry.type === "academic" && <BookOpen className="h-4 w-4 text-slate-500" />}
                            {entry.type === "partnership" && <Handshake className="h-4 w-4 text-slate-500" />}
                            {entry.type === "ranking" && <Trophy className="h-4 w-4 text-slate-500" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {entry.title}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                              <span className="capitalize text-slate-700">{entry.type}</span>
                              {" \u00B7 "}
                              Updated: {entry.updatedAt}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={entry.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthGuard>
  )
}