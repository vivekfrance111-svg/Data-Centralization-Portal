import { NextRequest, NextResponse } from "next/server"
import {
  getEntries,
  getEntriesByType,
  getEntriesByStatus,
  getEntryById,
  getStats,
} from "@/lib/store"
import type { DataEntry, WorkflowStatus } from "@/lib/types"

// ────────────────────────────────────────────
// Microsoft Fabric Integration API
// ────────────────────────────────────────────
//
// This REST endpoint exposes the portal data in a format compatible with
// Microsoft Fabric's data ingestion pipelines. Fabric can consume this
// via its REST connector in Data Factory / Dataflow Gen2.
//
// Authentication:
// - In production, set FABRIC_API_KEY as an environment variable.
// - Requests must include the header: x-fabric-api-key
// - If FABRIC_API_KEY is not set, authentication is skipped (dev mode).
//
// Query parameters:
//   ?type=academic|partnership|ranking  — filter by entry type
//   ?status=draft|in_review|approved|published|rejected  — filter by status
//   ?id=<entryId>  — fetch a single entry by ID
//   ?published_only=true  — convenience: only published entries
//   ?format=flat  — flatten nested objects for tabular ingestion
//   ?meta=true  — include metadata envelope (counts, timestamp, etc.)
//
// ────────────────────────────────────────────

function authenticateRequest(req: NextRequest): boolean {
  const apiKey = process.env.FABRIC_API_KEY
  if (!apiKey) return true // dev mode: no key required
  const provided = req.headers.get("x-fabric-api-key")
  return provided === apiKey
}

/** Flatten an entry to a single-depth object for tabular connectors */
function flattenEntry(entry: DataEntry): Record<string, unknown> {
  const base = {
    id: entry.id,
    entry_type: entry.type,
    status: entry.status,
    created_by: entry.createdBy,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    reviewed_by: entry.reviewedBy || null,
    reviewed_at: entry.reviewedAt || null,
    published_by: entry.publishedBy || null,
    published_at: entry.publishedAt || null,
    rejection_reason: entry.rejectionReason || null,
  }

  switch (entry.type) {
    case "academic":
      return {
        ...base,
        title: entry.title,
        authors: entry.authors,
        publication_type: entry.publicationType,
        journal: entry.journal || null,
        year: entry.year,
        doi: entry.doi || null,
        abstract: entry.abstract,
        keywords: entry.keywords,
        department: entry.department,
      }
    case "partnership":
      return {
        ...base,
        partner_name: entry.partnerName,
        partner_type: entry.partnerType,
        country: entry.country,
        strategic_objectives: entry.strategicObjectives,
        start_date: entry.startDate,
        end_date: entry.endDate || null,
        contact_person: entry.contactPerson,
        contact_email: entry.contactEmail,
        description: entry.description,
      }
    case "ranking":
      return {
        ...base,
        ranking_body: entry.rankingBody,
        program_name: entry.programName,
        year: entry.year,
        rank: entry.rank,
        previous_rank: entry.previousRank || null,
        category: entry.category,
        accreditation_type: entry.accreditationType || null,
        notes: entry.notes || null,
      }
  }
}

export async function GET(req: NextRequest) {
  // ── Auth ──
  if (!authenticateRequest(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-fabric-api-key header." },
      { status: 401 }
    )
  }

  const { searchParams } = req.nextUrl
  const type = searchParams.get("type")
  const status = searchParams.get("status") as WorkflowStatus | null
  const id = searchParams.get("id")
  const publishedOnly = searchParams.get("published_only") === "true"
  const flat = searchParams.get("format") === "flat"
  const includeMeta = searchParams.get("meta") === "true"

  try {
    // ── Single entry lookup ──
    if (id) {
      const entry = getEntryById(id)
      if (!entry) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 })
      }
      const data = flat ? flattenEntry(entry) : entry
      return NextResponse.json({ data }, { status: 200 })
    }

    // ── Collection query ──
    let entries: DataEntry[]

    if (type && ["academic", "partnership", "ranking"].includes(type)) {
      entries = getEntriesByType(type as "academic" | "partnership" | "ranking")
    } else if (status) {
      entries = getEntriesByStatus(status)
    } else {
      entries = getEntries()
    }

    // Additional filters
    if (publishedOnly) {
      entries = entries.filter((e) => e.status === "published")
    }
    if (status && type) {
      entries = entries.filter((e) => e.status === status)
    }

    const data = flat ? entries.map(flattenEntry) : entries

    if (includeMeta) {
      const stats = getStats()
      return NextResponse.json(
        {
          meta: {
            total: data.length,
            generated_at: new Date().toISOString(),
            source: "aivancity-data-portal",
            version: "1.0.0",
            stats,
          },
          data,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint — Trigger a sync event to Microsoft Fabric
 *
 * In production, this would:
 * 1. Authenticate via Azure AD / OAuth 2.0
 * 2. Push data to Microsoft Fabric's Lakehouse REST API
 * 3. Or trigger a Data Factory pipeline run
 *
 * Body: { action: "sync_all" | "sync_published", target?: string }
 */
export async function POST(req: NextRequest) {
  if (!authenticateRequest(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-fabric-api-key header." },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const action = body.action || "sync_published"

    let entries: DataEntry[]
    if (action === "sync_all") {
      entries = getEntries()
    } else {
      entries = getEntriesByStatus("published")
    }

    const payload = {
      sync_id: `sync_${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      record_count: entries.length,
      records: entries.map(flattenEntry),
      target: body.target || "default-lakehouse",
      // In production, this payload would be sent to:
      // POST https://<workspace>.api.fabric.microsoft.com/v1/workspaces/<id>/lakehouses/<id>/tables/<table>/load
      // with proper Azure AD Bearer token auth
    }

    // ── Simulated Fabric push response ──
    // In production: const fabricResponse = await fetch(fabricEndpoint, { method: 'POST', headers: { 'Authorization': `Bearer ${azureToken}` }, body: JSON.stringify(payload) })

    return NextResponse.json(
      {
        success: true,
        message: `Sync initiated for ${entries.length} records.`,
        sync_id: payload.sync_id,
        timestamp: payload.timestamp,
        target: payload.target,
        record_count: payload.record_count,
        // In production, include Fabric job ID:
        // fabric_job_id: fabricResponse.jobId,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process sync request" },
      { status: 500 }
    )
  }
}
