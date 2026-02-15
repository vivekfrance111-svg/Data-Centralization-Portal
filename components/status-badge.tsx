import { Badge } from "@/components/ui/badge"
import type { WorkflowStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<WorkflowStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  in_review: {
    label: "In Review",
    className: "bg-info/10 text-info border-info/30",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success border-success/30",
  },
  published: {
    label: "Published",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
}

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
