"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle, XCircle, Globe } from "lucide-react"
import type { DataEntry, User } from "@/lib/types"
import {
  canSubmitForReview,
  canReview,
  canPublish,
  updateEntryStatus,
} from "@/lib/store"

interface WorkflowActionsProps {
  entry: DataEntry
  user: User
  onUpdate: () => void
}

export function WorkflowActions({ entry, user, onUpdate }: WorkflowActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")

  const showSubmit = canSubmitForReview(entry, user)
  const showReview = canReview(entry, user)
  const showPublish = canPublish(entry, user)

  if (!showSubmit && !showReview && !showPublish) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showSubmit && (
        <Button
          size="sm"
          onClick={() => {
            updateEntryStatus(entry.id, "in_review", user.id)
            onUpdate()
          }}
          className="bg-info text-info-foreground hover:bg-info/90"
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          Submit for Review
        </Button>
      )}

      {showReview && (
        <>
          <Button
            size="sm"
            onClick={() => {
              updateEntryStatus(entry.id, "approved", user.id)
              onUpdate()
            }}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Entry</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting this entry. The author will be notified.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Reason for rejection..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!reason.trim()}
                  onClick={() => {
                    updateEntryStatus(entry.id, "rejected", user.id, reason)
                    setReason("")
                    setRejectOpen(false)
                    onUpdate()
                  }}
                >
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {showPublish && (
        <Button
          size="sm"
          onClick={() => {
            updateEntryStatus(entry.id, "published", user.id)
            onUpdate()
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Globe className="mr-1.5 h-3.5 w-3.5" />
          Publish
        </Button>
      )}
    </div>
  )
}
