"use client"

import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { WorkflowActions } from "@/components/workflow-actions"
import { type AcademicEntry } from "@/lib/types"
import { BookOpen, Loader2, LogOut, UserCircle } from "lucide-react"
import AuthGuard from "@/components/auth-guard"

export default function AcademicResearchPage() {
  const [entries, setEntries] = useState<AcademicEntry[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [userEmail, setUserEmail] = useState<string>("")

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoadingData(true)
      
      // 1. Get the user email
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email || "")

      // 2. Fetch submissions
      const { data, error } = await supabase
        .from("portal_data")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      
      const formatted: AcademicEntry[] = (data || []).map((item) => ({
        id: item?.id?.toString() || Math.random().toString(),
        type: "academic",
        status: item?.status || "draft",
        title: item?.title || "Untitled",
        authors: item?.authors || "Unknown",
        publicationType: item?.publication_type || "journal_article",
        year: item?.publication_year || "2026",
        department: item?.department || "Unassigned",
        journal: item?.journal || "",
        abstract: item?.abstract || "",
        keywords: item?.keywords || "",
        createdBy: item?.created_by || "system",
        createdAt: item?.created_at || "",
        updatedAt: item?.created_at || "",
      }))
      setEntries(formatted)
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  return (
    <AuthGuard>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
        <header className="flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Research Portal</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UserCircle className="h-3 w-3" /> {userEmail}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </header>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingData ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-6 flex items-center justify-between">
                    <div>
                      <StatusBadge status={entry.status} />
                      <h3 className="font-bold">{entry.title}</h3>
                    </div>
                    {/* HARDCODED ADMIN ROLE FOR TESTING */}
                    <WorkflowActions entry={entry} userRole="admin" onUpdate={fetchInitialData} />
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