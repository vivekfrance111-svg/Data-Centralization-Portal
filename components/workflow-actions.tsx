"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Check, Send, X } from "lucide-react"

// We expect the entry, the current user, and the refresh function from page.tsx
export function WorkflowActions({ entry, user, onUpdate }: any) {
  
  // 1. The Supabase Update Function
  async function updateStatus(newStatus: string) {
    try {
      const { error } = await supabase
        .from("portal_data")
        .update({ status: newStatus })
        .eq("id", entry.id) // Find the exact row by its ID

      if (error) throw error

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      onUpdate() // This triggers fetchEntries() on your main page to refresh the UI
    } catch (err: any) {
      console.error("Error updating status:", err)
      toast.error("Failed to update status.")
    }
  }

  // 2. Role-Based Logic (Who can see what buttons?)
  // For now, we assume user.role exists. If not, you can hardcode this to test.
  const isAuthor = user?.role === "author" || user?.role === "admin"
  const isReviewer = user?.role === "reviewer" || user?.role === "admin"

  return (
    <div className="flex items-center gap-2">
      
      {/* If it's a DRAFT, the Author can submit it for review */}
      {entry.status === "draft" && isAuthor && (
        <Button 
          size="sm" 
          onClick={() => updateStatus("pending_review")}
        >
          <Send className="w-4 h-4 mr-1" />
          Submit for Review
        </Button>
      )}

      {/* If it's PENDING, the Reviewer can Approve or Reject it */}
      {entry.status === "pending_review" && isReviewer && (
        <>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={() => updateStatus("rejected")}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => updateStatus("published")}
          >
            <Check className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </>
      )}

      {/* If it's PUBLISHED, maybe an Admin can revert it to a draft */}
      {entry.status === "published" && user?.role === "admin" && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => updateStatus("draft")}
        >
          Revert to Draft
        </Button>
      )}
      
    </div>
  )
}