"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Check, Send } from "lucide-react"

export function WorkflowActions({ entry, userRole = "admin", onUpdate }: any) {
  
  async function updateStatus(newStatus: string) {
    const { error } = await supabase
      .from("portal_data")
      .update({ status: newStatus })
      .eq("id", entry.id)

    if (!error) {
      toast.success("Updated")
      onUpdate()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {entry.status === "draft" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("pending_review")}>
          <Send className="w-4 h-4 mr-1" /> Submit
        </Button>
      )}
      {entry.status === "pending_review" && (
        <Button size="sm" className="bg-green-600 text-white" onClick={() => updateStatus("published")}>
          <Check className="w-4 h-4 mr-1" /> Publish
        </Button>
      )}
    </div>
  )
}