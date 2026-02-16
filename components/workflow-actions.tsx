"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Check, Send, X, ArrowUpCircle } from "lucide-react"

interface WorkflowProps {
  entry: any
  user?: { role?: string }
  onUpdate: () => void
}

export function WorkflowActions({ entry, user, onUpdate }: WorkflowProps) {
  
  // CRASH-PROOF: Safely extract the role with a fallback
  const currentRole = (user?.role || "author").toLowerCase().trim()
  const currentStatus = entry?.status || "draft"

  async function updateStatus(newStatus: string) {
    try {
      const { error } = await supabase
        .from("portal_data")
        .update({ status: newStatus })
        .eq("id", entry.id)

      if (error) throw error

      toast.success(`Entry marked as ${newStatus.replace('_', ' ')}`)
      onUpdate() 
    } catch (err: any) {
      console.error("Workflow Error:", err)
      toast.error("Failed to update status.")
    }
  }

  const isAdmin = currentRole === "admin"
  const isReviewer = currentRole === "reviewer" || isAdmin
  const isAuthor = currentRole === "author" || isAdmin

  return (
    <div className="flex items-center gap-2">
      
      {/* AUTHORS: Can submit their drafts for review */}
      {currentStatus === "draft" && isAuthor && (
        <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => updateStatus("pending_review")}>
          <Send className="w-4 h-4 mr-1.5" />
          Submit
        </Button>
      )}

      {/* ADMINS/REVIEWERS: Can Approve or Reject */}
      {currentStatus === "pending_review" && isReviewer && (
        <>
          <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-100" onClick={() => updateStatus("draft")}>
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => updateStatus("published")}>
            <Check className="w-4 h-4 mr-1.5" />
            Publish
          </Button>
        </>
      )}

      {/* ADMINS ONLY: Can take a published item down */}
      {currentStatus === "published" && isAdmin && (
        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => updateStatus("draft")}>
          <ArrowUpCircle className="w-4 h-4 mr-1" />
          Revert to Draft
        </Button>
      )}
    </div>
  )
}