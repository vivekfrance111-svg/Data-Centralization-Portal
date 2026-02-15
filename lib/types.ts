import { z } from "zod"

// ── Workflow Status ──
export type WorkflowStatus = "draft" | "in_review" | "approved" | "published" | "rejected"

// ── Roles ──
export type UserRole = "professor" | "department_head" | "academic_director"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
}

// ── Base Entry ──
export interface BaseEntry {
  id: string
  status: WorkflowStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  reviewedBy?: string
  reviewedAt?: string
  publishedBy?: string
  publishedAt?: string
  rejectionReason?: string
}

// ── Academic Research ──
export type PublicationType = "journal_article" | "conference_paper" | "book_chapter" | "working_paper" | "blog_post"

export interface AcademicEntry extends BaseEntry {
  type: "academic"
  title: string
  authors: string
  publicationType: PublicationType
  journal?: string
  year: string
  doi?: string
  abstract: string
  keywords: string
  department: string
}

// ── Partnership ──
export interface PartnershipEntry extends BaseEntry {
  type: "partnership"
  partnerName: string
  partnerType: "corporate" | "academic" | "government" | "ngo"
  country: string
  strategicObjectives: string
  startDate: string
  endDate?: string
  contactPerson: string
  contactEmail: string
  description: string
}

// ── Ranking ──
export interface RankingEntry extends BaseEntry {
  type: "ranking"
  rankingBody: string
  programName: string
  year: string
  rank: string
  previousRank?: string
  category: string
  accreditationType?: string
  notes?: string
}

export type DataEntry = AcademicEntry | PartnershipEntry | RankingEntry

// ── Zod Schemas ──
export const academicSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  authors: z.string().min(2, "Authors are required"),
  publicationType: z.enum(["journal_article", "conference_paper", "book_chapter", "working_paper", "blog_post"]),
  journal: z.string().optional(),
  year: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  doi: z.string().optional(),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
  keywords: z.string().min(2, "At least one keyword is required"),
  department: z.string().min(1, "Department is required"),
})

export const partnershipSchema = z.object({
  partnerName: z.string().min(2, "Partner name is required"),
  partnerType: z.enum(["corporate", "academic", "government", "ngo"]),
  country: z.string().min(2, "Country is required"),
  strategicObjectives: z.string().min(10, "Strategic objectives are required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  contactPerson: z.string().min(2, "Contact person is required"),
  contactEmail: z.string().email("Valid email is required"),
  description: z.string().min(10, "Description is required"),
})

export const rankingSchema = z.object({
  rankingBody: z.string().min(2, "Ranking body is required"),
  programName: z.string().min(2, "Program name is required"),
  year: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  rank: z.string().min(1, "Rank is required"),
  previousRank: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  accreditationType: z.string().optional(),
  notes: z.string().optional(),
})

export type AcademicFormData = z.infer<typeof academicSchema>
export type PartnershipFormData = z.infer<typeof partnershipSchema>
export type RankingFormData = z.infer<typeof rankingSchema>
