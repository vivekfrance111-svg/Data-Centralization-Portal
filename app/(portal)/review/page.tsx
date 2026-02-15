"use client"

import { useState, useCallback, useMemo } from "react"
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
  getEntries,
  getCurrentUser,
  users,
} from "@/lib/store"
import type { DataEntry, WorkflowStatus, AcademicEntry, PartnershipEntry, RankingEntry } from "@/lib/types"
import {
  ClipboardCheck,
  BookOpen,
  Handshake,
  Trophy,
  FileText,
  Clock,
  CheckCircle,
  Globe,
  XCircle,
  Filter,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react"

function getEntryTitle(entry: DataEntry): string {
  switch (entry.type) {
    case "academic":
      return (entry as AcademicEntry).title
    case "partnership":
      return (entry as PartnershipEntry).partnerName
    case "ranking":
      return `${(entry as RankingEntry).rankingBody} - ${(entry as RankingEntry).programName}`
  }
}

function getEntrySubtitle(entry: DataEntry): string {
  switch (entry.type) {
    case "academic": {
      const e = entry as AcademicEntry
      return `${e.authors} \u00B7 ${e.publicationType.replace(/_/g, " ")} \u00B7 ${e.year}`
    }
    case "partnership": {
      const e = entry as PartnershipEntry
      return `${e.partnerType} \u00B7 ${e.country} \u00B7 ${e.startDate}`
    }
    case "ranking": {
      const e = entry as RankingEntry
      return `Rank #${e.rank} \u00B7 ${e.category} \u00B7 ${e.year}`
    }
  }
}

function getEntryDetail(entry: DataEntry): string {
  switch (entry.type) {
    case "academic":
      return (entry as AcademicEntry).abstract
    case "partnership":
      return (entry as PartnershipEntry).description
    case "ranking":
      return (entry as RankingEntry).notes || "No additional notes."
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "academic":
      return BookOpen
    case "partnership":
      return Handshake
    case "ranking":
      return Trophy
    default:
      return FileText
  }
}

function getUserName(userId: string): string {
  return users.find((u) => u.id === userId)?.name || "Unknown"
}

const statusTabs: { value: string; label: string; icon: React.ComponentType<any>; statusFilter: WorkflowStatus | "all" }[] = [
  { value: "all", label: "All Entries", icon: FileText, statusFilter: "all" },
  { value: "draft", label: "Drafts", icon: FileText, statusFilter: "draft" },
  { value: "in_review", label: "In Review", icon: Clock, statusFilter: "in_review" },
  { value: "approved", label: "Approved", icon: CheckCircle, statusFilter: "approved" },
  { value: "published", label: "Published", icon: Globe, statusFilter: "published" },
  { value: "rejected", label: "Rejected", icon: XCircle, statusFilter: "rejected" },
]

export default function ReviewPage() {
  const [tick, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const user = getCurrentUser()
  const allEntries = getEntries()

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const filteredEntries = useMemo(() => {
    let result = allEntries
    if (activeTab !== "all") {
      result = result.filter((e) => e.status === activeTab)
    }
    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter)
    }
    return result
  }, [allEntries, activeTab, typeFilter])

  const statusCounts = useMemo(() => {
    const base = typeFilter !== "all" ? allEntries.filter((e) => e.type === typeFilter) : allEntries
    return {
      all: base.length,
      draft: base.filter((e) => e.status === "draft").length,
      in_review: base.filter((e) => e.status === "in_review").length,
      approved: base.filter((e) => e.status === "approved").length,
      published: base.filter((e) => e.status === "published").length,
      rejected: base.filter((e) => e.status === "rejected").length,
    }
  }, [allEntries, typeFilter])

  const canUserReview = user.role === "department_head" || user.role === "academic_director"
  const canUserPublish = user.role === "academic_director"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Review & Publish
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the approval pipeline for all data entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="academic">Research</SelectItem>
              <SelectItem value="partnership">Partnerships</SelectItem>
              <SelectItem value="ranking">Rankings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Role Notice */}
      <Card className="border-info/30 bg-info/5">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-foreground">
            <span className="font-medium">Your permissions:</span>{" "}
            {user.role === "professor" && "You can create entries and submit them for review. Department Heads and Academic Directors handle approvals."}
            {user.role === "department_head" && "You can create entries, submit for review, and approve/reject submissions. Only the Academic Director can publish."}
            {user.role === "academic_director" && "You have full access: create, review, approve, and publish entries."}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
              <Badge
                variant="secondary"
                className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs"
              >
                {statusCounts[tab.value as keyof typeof statusCounts]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="flex flex-col gap-3">
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">No entries found</p>
                    <p className="text-xs mt-1">
                      {activeTab === "all"
                        ? "No entries match the current filters."
                        : `No entries with "${tab.label}" status.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map((entry) => {
                  const TypeIcon = getTypeIcon(entry.type)
                  const isExpanded = expandedId === entry.id

                  return (
                    <Card
                      key={entry.id}
                      className="transition-colors hover:border-border/80"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <StatusBadge status={entry.status} />
                                <Badge variant="outline" className="text-xs capitalize">
                                  {entry.type === "academic" ? "Research" : entry.type === "partnership" ? "Partnership" : "Ranking"}
                                </Badge>
                              </div>
                              <h3
                                className="text-sm font-medium leading-relaxed cursor-pointer hover:text-primary transition-colors"
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : entry.id)
                                }
                              >
                                {getEntryTitle(entry)}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getEntrySubtitle(entry)}
                              </p>

                              {/* Metadata */}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {getUserName(entry.createdBy)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {entry.updatedAt}
                                </span>
                                {entry.reviewedBy && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Reviewed by {getUserName(entry.reviewedBy)}
                                  </span>
                                )}
                                {entry.publishedBy && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    Published by {getUserName(entry.publishedBy)}
                                  </span>
                                )}
                              </div>

                              {/* Expanded detail */}
                              {isExpanded && (
                                <div className="mt-3 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground leading-relaxed">
                                  {getEntryDetail(entry)}
                                </div>
                              )}

                              {entry.rejectionReason && (
                                <div className="mt-2 p-2 rounded-md bg-destructive/5 text-xs text-destructive">
                                  <span className="font-medium">Rejection reason:</span>{" "}
                                  {entry.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <WorkflowActions
                              entry={entry}
                              user={user}
                              onUpdate={refresh}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Workflow Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow Guide</CardTitle>
          <CardDescription>How the approval pipeline works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">1. Draft</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Any user creates an entry. It starts as a draft and is only visible to the author.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-info/10 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-info" />
                </div>
                <span className="text-sm font-medium">2. In Review</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Author submits for review. Department Heads and Academic Director can review.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-success" />
                </div>
                <span className="text-sm font-medium">3. Approved</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Department Head or Academic Director approves. Entry is ready for publication.
              </p>
            </div>
            <div className="flex flex-col gap-2 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                  <Globe className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">4. Published</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Only the Academic Director can publish. Data becomes available via the Fabric API.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
