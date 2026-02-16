"use client"

export function StatusBadge({ status }: { status?: string }) {
  // Fallback to draft if status is completely missing
  const safeStatus = (status || "draft").toLowerCase()

  // Define the colors for every possible state
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
    published: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  }

  // If the database has a weird status we don't recognize, default to draft styles to prevent a crash
  const activeStyle = styles[safeStatus] || styles.draft
  const displayLabel = safeStatus.replace("_", " ")

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${activeStyle}`}>
      {displayLabel}
    </span>
  )
}