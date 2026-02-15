import type {
  User,
  DataEntry,
  AcademicEntry,
  PartnershipEntry,
  RankingEntry,
  WorkflowStatus,
} from "./types"

// ── Current User (simulated) ──
let currentUser: User = {
  id: "u1",
  name: "Prof. Marie Dupont",
  email: "m.dupont@aivancity.ai",
  role: "academic_director",
  department: "AI & Data Science",
}

export function getCurrentUser(): User {
  return currentUser
}

export function setCurrentUser(user: User): void {
  currentUser = user
}

// ── Users ──
export const users: User[] = [
  currentUser,
  {
    id: "u2",
    name: "Prof. Jean-Luc Martin",
    email: "jl.martin@aivancity.ai",
    role: "professor",
    department: "AI & Data Science",
  },
  {
    id: "u3",
    name: "Dr. Sophie Laurent",
    email: "s.laurent@aivancity.ai",
    role: "department_head",
    department: "Business & Management",
  },
  {
    id: "u4",
    name: "Prof. Alexandre Moreau",
    email: "a.moreau@aivancity.ai",
    role: "professor",
    department: "Ethics & Society",
  },
]

// ── Mock Data ──
const mockAcademic: AcademicEntry[] = [
  {
    id: "a1",
    type: "academic",
    status: "published",
    createdBy: "u2",
    createdAt: "2025-09-15",
    updatedAt: "2025-10-01",
    reviewedBy: "u3",
    reviewedAt: "2025-09-20",
    publishedBy: "u1",
    publishedAt: "2025-10-01",
    title: "Transformer Architectures for Ethical AI Decision-Making",
    authors: "Jean-Luc Martin, Marie Dupont",
    publicationType: "journal_article",
    journal: "Journal of AI Ethics",
    year: "2025",
    doi: "10.1234/jaie.2025.001",
    abstract:
      "This paper explores novel transformer architectures designed to incorporate ethical constraints directly into AI decision-making processes, ensuring fairness and transparency.",
    keywords: "AI Ethics, Transformers, Fairness, Transparency",
    department: "AI & Data Science",
  },
  {
    id: "a2",
    type: "academic",
    status: "in_review",
    createdBy: "u4",
    createdAt: "2025-11-10",
    updatedAt: "2025-11-10",
    title: "Corporate Governance and AI Regulation in the EU",
    authors: "Alexandre Moreau",
    publicationType: "conference_paper",
    journal: "European Conference on Digital Ethics",
    year: "2026",
    abstract:
      "An analysis of emerging EU regulatory frameworks for artificial intelligence and their impact on corporate governance practices across European institutions.",
    keywords: "EU Regulation, AI Governance, Corporate Ethics",
    department: "Ethics & Society",
  },
  {
    id: "a3",
    type: "academic",
    status: "draft",
    createdBy: "u2",
    createdAt: "2026-01-05",
    updatedAt: "2026-01-05",
    title: "Federated Learning for Privacy-Preserving Healthcare Analytics",
    authors: "Jean-Luc Martin, Sophie Laurent",
    publicationType: "working_paper",
    year: "2026",
    abstract:
      "This working paper presents a federated learning approach that enables healthcare institutions to collaboratively train models without sharing sensitive patient data.",
    keywords: "Federated Learning, Healthcare, Privacy",
    department: "AI & Data Science",
  },
  {
    id: "a4",
    type: "academic",
    status: "approved",
    createdBy: "u1",
    createdAt: "2025-12-01",
    updatedAt: "2025-12-15",
    reviewedBy: "u3",
    reviewedAt: "2025-12-15",
    title: "The Future of AI in Higher Education: A Strategic Perspective",
    authors: "Marie Dupont",
    publicationType: "blog_post",
    year: "2026",
    abstract:
      "An exploration of how artificial intelligence is reshaping curriculum design, student engagement, and institutional operations in European higher education.",
    keywords: "AI, Higher Education, Strategy, EdTech",
    department: "AI & Data Science",
  },
  {
    id: "a5",
    type: "academic",
    status: "rejected",
    createdBy: "u4",
    createdAt: "2025-08-20",
    updatedAt: "2025-09-01",
    reviewedBy: "u3",
    reviewedAt: "2025-09-01",
    rejectionReason: "Insufficient empirical evidence. Please add case studies.",
    title: "Philosophical Foundations of Machine Consciousness",
    authors: "Alexandre Moreau",
    publicationType: "book_chapter",
    year: "2025",
    abstract:
      "A philosophical examination of whether machines can achieve consciousness and the ethical implications this poses for society.",
    keywords: "Machine Consciousness, Philosophy, Ethics",
    department: "Ethics & Society",
  },
]

const mockPartnerships: PartnershipEntry[] = [
  {
    id: "p1",
    type: "partnership",
    status: "published",
    createdBy: "u3",
    createdAt: "2025-06-01",
    updatedAt: "2025-07-15",
    reviewedBy: "u1",
    reviewedAt: "2025-06-20",
    publishedBy: "u1",
    publishedAt: "2025-07-15",
    partnerName: "Microsoft France",
    partnerType: "corporate",
    country: "France",
    strategicObjectives: "Joint AI research program and Azure cloud infrastructure for student projects",
    startDate: "2025-09-01",
    endDate: "2028-08-31",
    contactPerson: "Pierre Leduc",
    contactEmail: "p.leduc@microsoft.com",
    description:
      "Strategic partnership with Microsoft France to establish a joint AI research lab and provide cloud computing resources for student capstone projects.",
  },
  {
    id: "p2",
    type: "partnership",
    status: "in_review",
    createdBy: "u3",
    createdAt: "2025-12-01",
    updatedAt: "2025-12-01",
    partnerName: "ETH Zurich",
    partnerType: "academic",
    country: "Switzerland",
    strategicObjectives: "Student exchange program and collaborative research in responsible AI",
    startDate: "2026-03-01",
    contactPerson: "Dr. Hans Mueller",
    contactEmail: "h.mueller@ethz.ch",
    description:
      "Academic partnership to facilitate student exchanges and joint research initiatives focusing on responsible AI development.",
  },
  {
    id: "p3",
    type: "partnership",
    status: "draft",
    createdBy: "u1",
    createdAt: "2026-01-20",
    updatedAt: "2026-01-20",
    partnerName: "European Commission - DG CONNECT",
    partnerType: "government",
    country: "Belgium",
    strategicObjectives: "Advisory role in EU AI Act implementation and policy development",
    startDate: "2026-06-01",
    contactPerson: "Clara Van Den Berg",
    contactEmail: "c.vandenberg@ec.europa.eu",
    description:
      "Institutional partnership to provide expert advisory services for the European Commission on AI Act implementation.",
  },
]

const mockRankings: RankingEntry[] = [
  {
    id: "r1",
    type: "ranking",
    status: "published",
    createdBy: "u1",
    createdAt: "2025-03-01",
    updatedAt: "2025-04-01",
    reviewedBy: "u3",
    reviewedAt: "2025-03-15",
    publishedBy: "u1",
    publishedAt: "2025-04-01",
    rankingBody: "Le Figaro Etudiant",
    programName: "MSc Artificial Intelligence for Business",
    year: "2025",
    rank: "3",
    previousRank: "5",
    category: "Masters in AI",
    accreditationType: "RNCP Level 7",
    notes: "Significant jump from 5th to 3rd place",
  },
  {
    id: "r2",
    type: "ranking",
    status: "published",
    createdBy: "u1",
    createdAt: "2025-05-10",
    updatedAt: "2025-06-01",
    reviewedBy: "u3",
    reviewedAt: "2025-05-20",
    publishedBy: "u1",
    publishedAt: "2025-06-01",
    rankingBody: "Eduniversal",
    programName: "Bachelor in AI & Management",
    year: "2025",
    rank: "8",
    previousRank: "12",
    category: "Undergraduate AI Programs",
    notes: "First year entering top 10",
  },
  {
    id: "r3",
    type: "ranking",
    status: "draft",
    createdBy: "u3",
    createdAt: "2026-01-15",
    updatedAt: "2026-01-15",
    rankingBody: "QS World University Rankings",
    programName: "MSc Data Science & AI Ethics",
    year: "2026",
    rank: "45",
    category: "Data Science & AI",
    accreditationType: "CGE Label",
  },
]

let entries: DataEntry[] = [...mockAcademic, ...mockPartnerships, ...mockRankings]

// ── CRUD Operations ──
export function getEntries(): DataEntry[] {
  return [...entries]
}

export function getEntriesByType(type: "academic" | "partnership" | "ranking"): DataEntry[] {
  return entries.filter((e) => e.type === type)
}

export function getEntriesByStatus(status: WorkflowStatus): DataEntry[] {
  return entries.filter((e) => e.status === status)
}

export function getEntryById(id: string): DataEntry | undefined {
  return entries.find((e) => e.id === id)
}

export function addEntry(entry: DataEntry): void {
  entries = [entry, ...entries]
}

export function updateEntryStatus(
  id: string,
  status: WorkflowStatus,
  userId: string,
  rejectionReason?: string
): DataEntry | undefined {
  const entry = entries.find((e) => e.id === id)
  if (!entry) return undefined

  entry.status = status
  entry.updatedAt = new Date().toISOString().split("T")[0]

  if (status === "in_review") {
    // submitted for review
  }
  if (status === "approved" || status === "rejected") {
    entry.reviewedBy = userId
    entry.reviewedAt = new Date().toISOString().split("T")[0]
    if (status === "rejected" && rejectionReason) {
      entry.rejectionReason = rejectionReason
    }
  }
  if (status === "published") {
    entry.publishedBy = userId
    entry.publishedAt = new Date().toISOString().split("T")[0]
  }

  return entry
}

// ── Permission Checks ──
export function canSubmitForReview(entry: DataEntry, user: User): boolean {
  return entry.status === "draft" && entry.createdBy === user.id
}

export function canReview(entry: DataEntry, user: User): boolean {
  return (
    entry.status === "in_review" &&
    (user.role === "department_head" || user.role === "academic_director")
  )
}

export function canPublish(entry: DataEntry, user: User): boolean {
  return entry.status === "approved" && user.role === "academic_director"
}

// ── Stats ──
export function getStats() {
  const all = getEntries()
  return {
    total: all.length,
    drafts: all.filter((e) => e.status === "draft").length,
    inReview: all.filter((e) => e.status === "in_review").length,
    approved: all.filter((e) => e.status === "approved").length,
    published: all.filter((e) => e.status === "published").length,
    rejected: all.filter((e) => e.status === "rejected").length,
    academic: all.filter((e) => e.type === "academic").length,
    partnerships: all.filter((e) => e.type === "partnership").length,
    rankings: all.filter((e) => e.type === "ranking").length,
  }
}
