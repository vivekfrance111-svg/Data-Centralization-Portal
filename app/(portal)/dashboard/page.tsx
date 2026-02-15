"use client"

import { useState } from "react"
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
  TrendingUp,
} from "lucide-react"
import { getStats, getEntries, getCurrentUser } from "@/lib/store"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"

const workflowSteps = [
  { step: 1, title: "Draft", description: "Author creates and saves entry", icon: FileText, color: "bg-muted text-muted-foreground" },
  { step: 2, title: "In Review", description: "Submitted for departmental review", icon: Clock, color: "bg-info/10 text-info" },
  { step: 3, title: "Approved", description: "Verified by Department Head", icon: CheckCircle, color: "bg-success/10 text-success" },
  { step: 4, title: "Published", description: "Released by Academic Director", icon: Globe, color: "bg-primary/10 text-primary" },
]

export default function DashboardPage() {
  const [, setTick] = useState(0)
  const stats = getStats()
  const entries = getEntries()
  const user = getCurrentUser()
  const recentEntries = entries.slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aivancity Institutional Data Centralization Portal
        </p>
      </div>

      {/* Workflow Explainer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Publication Workflow</CardTitle>
          <CardDescription>All data entries follow this approval pipeline before publication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {workflowSteps.map((ws, i) => (
              <div key={ws.step} className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ws.color}`}>
                  <ws.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ws.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ws.description}</p>
                </div>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 hidden lg:block mt-2.5" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inReview}</p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <BookOpen className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">Academic Research</p>
                  <p className="text-2xl font-bold">{stats.academic}</p>
                </div>
              </div>
              <Link href="/academic-research/submission">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Handshake className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Partnerships</p>
                  <p className="text-2xl font-bold">{stats.partnerships}</p>
                </div>
              </div>
              <Link href="/institutional-relations/partnerships">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rankings</p>
                  <p className="text-2xl font-bold">{stats.rankings}</p>
                </div>
              </div>
              <Link href="/accreditations-rankings">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <CardDescription>Latest data submissions across all modules</CardDescription>
            </div>
            <Link href="/review">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    {entry.type === "academic" && <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                    {entry.type === "partnership" && <Handshake className="h-3.5 w-3.5 text-muted-foreground" />}
                    {entry.type === "ranking" && <Trophy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.type === "academic" && (entry as any).title}
                      {entry.type === "partnership" && (entry as any).partnerName}
                      {entry.type === "ranking" && `${(entry as any).rankingBody} - ${(entry as any).programName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.type === "academic" ? "Research" : entry.type === "partnership" ? "Partnership" : "Ranking"}
                      {" \u00B7 "}
                      {entry.updatedAt}
                    </p>
                  </div>
                </div>
                <StatusBadge status={entry.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
