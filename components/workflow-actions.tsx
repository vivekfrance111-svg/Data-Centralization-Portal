"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Check, Send, X, ArrowUpCircle } from "lucide-react"

interface WorkflowProps {
  entry: any
  user: { role: string }
  onUpdate: () => void
}

export function WorkflowActions({ entry, user, onUpdate }: WorkflowProps) {
  
  // The function that actually changes the status in Supabase
  async function updateStatus(newStatus: string) {
    try {
      const { error } = await supabase
        .from("portal_data")
        .update({ status: newStatus })
        .eq("id", entry.id)

      if (error) throw error

      toast.success(`Entry marked as ${newStatus.replace('_', ' ')}`)
      onUpdate() // This tells the main page to refresh the list instantly
    } catch (err: any) {
      console.error("Workflow Error:", err)
      toast.error("Failed to update status.")
    }
  }

  const isAdmin = user?.role === "admin"
  const isReviewer = user?.role === "reviewer" || isAdmin
  const isAuthor = user?.role === "author" || isAdmin

  return (
    <div className="flex items-center gap-2">
      
      {/* AUTHORS: Can submit their drafts for review */}
      {entry.status === "draft" && isAuthor && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("pending_review")}>
          <Send className="w-4 h-4 mr-1 text-blue-500" />
          Submit
        </Button>
      )}

      {/* ADMINS/REVIEWERS: Can Approve or Reject */}
      {entry.status === "pending_review" && isReviewer && (
        <>
          <Button size="sm" variant="outline" className="hover:bg-red-50" onClick={() => updateStatus("draft")}>
            <X className="w-4 h-4 mr-1 text-red-500" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus("published")}>
            <Check className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </>
      )}

      {/* ADMINS ONLY: Can take a published item down */}
      {entry.status === "published" && isAdmin && (
        <Button size="sm" variant="ghost" onClick={() => updateStatus("draft")}>
          <ArrowUpCircle className="w-4 h-4 mr-1 text-muted-foreground" />
          Revert to Draft
        </Button>
      )}
    </div>
  )
}