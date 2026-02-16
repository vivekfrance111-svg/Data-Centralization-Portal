"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Check, Send, X, ArrowUpCircle } from "lucide-react"

export function WorkflowActions({ entry, user, onUpdate }: any) {
  
  // 1. Safety check for the status
  const status = entry?.status || "draft"
  
  // 2. Safety check for the role
  const rawRole = typeof user?.role === 'string' ? user.role : "author"
  const currentRole = rawRole.trim().toLowerCase()

  async function updateStatus(newStatus: string) {
    try {
      const { error } = await supabase
        .from("portal_data")
        .update({ status: newStatus })
        .eq("id", entry.id)

      if (error) throw error
      toast.success("Updated!")
      onUpdate()
    } catch (err) {
      toast.error("Update failed.")
    }
  }

  const isAdmin = currentRole === "admin"
  const isReviewer = currentRole === "reviewer" || isAdmin
  const isAuthor = currentRole === "author" || isAdmin

  // If role isn't loaded yet, show nothing to prevent crashes
  if (!currentRole) return null

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && isAuthor && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("pending_review")}>
          <Send className="w-4 h-4 mr-1 text-blue-500" /> Submit
        </Button>
      )}

      {status === "pending_review" && isReviewer && (
        <>
          <Button size="sm" variant="outline" onClick={() => updateStatus("draft")}>
            <X className="w-4 h-4 mr-1 text-red-500" /> Reject
          </Button>
          <Button size="sm" className="bg-green-600 text-white" onClick={() => updateStatus("published")}>
            <Check className="w-4 h-4 mr-1" /> Publish
          </Button>
        </>
      )}

      {status === "published" && isAdmin && (
        <Button size="sm" variant="ghost" onClick={() => updateStatus("draft")}>
          <ArrowUpCircle className="w-4 h-4 mr-1" /> Revert
        </Button>
      )}
    </div>
  )
}