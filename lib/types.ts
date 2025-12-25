export type GaitPhase = "IC" | "LR" | "MS" | "TS" | "PSw" | "ISw" | "MidSw" | "TSw"

export type JointType = "ankle" | "knee" | "hip" | "pelvisTilt" | "pelvisDrop" | "trunkLean" | "footProg"

export interface PhaseData {
  phase: GaitPhase
  startFrame: number
  endFrame: number
  startPercent: number
  endPercent: number
}

export interface JointAnglePoint {
  frame: number
  percent: number
  angle: number
}

export interface JointData {
  joint: JointType
  angles: JointAnglePoint[]
  normalRange: { min: number; max: number }
}

export interface Finding {
  phase: GaitPhase
  joint: JointType
  value: number
  normalRange: { min: number; max: number }
  status: "normal" | "warning" | "abnormal"
  severity: "low" | "medium" | "high"
  description: string
  citation?: any // Declared as any for now, replace with actual type if available
}

export interface AnalysisPacket {
  id: string
  videoUrl: string
  speed: number
  cadence: number
  footwear: string
  phases: PhaseData[]
  joints: JointData[]
  findings: Finding[]
  citations: any[] // Declared as any array for now, replace with actual type if available
  aiSummary: string
  datasetVersion: string
  modelVersion: string
  createdAt: string
  thumbnailUrl?: string
}

export interface ComparisonData {
  id: string
  beforeAnalysis: AnalysisPacket
  afterAnalysis: AnalysisPacket
  createdAt: string
}

export type EvidenceLevel = "consensus" | "systematic" | "clinical" | "single-study" | "expert-opinion"

export interface EvidenceRecommendation {
  id: string
  phase: GaitPhase
  joints: JointType[]
  recommendation: string
  triggered: string[]
  confidence: "high" | "medium" | "low"
  citationIds: string[]
  excerpts?: EvidenceExcerpt[]
  appendixSelected?: boolean
}

export interface EvidenceExcerpt {
  citationId: string
  excerpt: string
  highlight?: string[]
}

export interface CaseInfo {
  code: string
  age?: number
  speedKph?: number
  cadence?: number
  stepLengthCm?: number
  footwear?: string
  inclinePct?: number
  dateISO?: string
  coachNotes?: string
}

export interface LiteratureCitation {
  id: string
  author: string
  year: number
  title?: string
  journal?: string
  doi?: string
  url?: string
  context?: string
  extractedRanges?: Array<{
    phase: GaitPhase
    joint: JointType
    min: number
    max: number
    units: "deg" | "%"
  }>
  evidenceLevel?: EvidenceLevel
}

export interface AdminUser {
  id: string
  email: string
  role: "user" | "admin"
  plan_id: string
  monthly_quota: number
  credits_extra: number
  used_this_month: number
  created_at: string
}

export interface BillingPlan {
  id: string
  name: string
  name_zh: string
  quota: number
  price: number
  currency: string
  stripe_price_id?: string
  features: string[]
}

export interface BillingEvent {
  id: string
  stripe_event_id?: string
  event_type: string
  user_id: string
  amount: number
  currency: string
  status: "success" | "failed" | "pending"
  payload?: any
  created_at: string
}

export interface UsageAnalysis {
  id: string
  user_id: string
  analysis_id?: string
  cost: number
  metadata: any
  created_at: string
}

export interface ApiToken {
  id: string
  user_id: string
  token_hash: string
  scope: "read" | "write" | "admin"
  expires_at: string
  revoked: boolean
  created_at: string
  last_used?: string
}

export interface LiteratureNorm {
  id: string
  phase: GaitPhase
  joint: JointType
  min_value: number
  max_value: number
  units: "deg" | "%"
  author: string
  year: number
  title?: string
  journal?: string
  doi?: string
  note?: string
  created_at: string
}

export interface SystemKPI {
  totalUsers: number
  activeUsers: number
  totalAnalyses: number
  analysesThisMonth: number
  revenueThisMonth: number
  webhookSyncStatus: "healthy" | "warning" | "error"
}

export interface CreditsInfo {
  balance: number
  lastUpdatedISO?: string
}

export interface AnalysisRow {
  id: string
  video_url: string | null
  created_at: string
  speed_kph?: number | null
  cadence_spm?: number | null
  step_length_cm?: number | null
}

export interface LocationRow {
  id: string
  name: string
  city?: string | null
  address?: string | null
  treadmill_type?: string | null
  photo_urls?: string[] | null
  allow_public: boolean
  contact?: string | null
  status: "pending" | "approved" | "rejected"
  created_by: string
  created_at: string
  lat?: number
  lng?: number
}

export interface StudentAnalytic {
  email: string
  upload_count: number
  credits_balance: number
  last_login: string
}

export interface DailyUpload {
  date: string
  count: number
}

export interface PurchaseStats {
  date: string
  amount: number
}

export type LibraryCategory = "official" | "pubmed" | "personal"

export interface LibrarySource {
  id: string
  title: string
  description: string
  category: LibraryCategory
  cost: number
  enabled: boolean
  icon: string
  selected?: boolean
}

export interface CaseMeta {
  code?: string
  name?: string
  sex?: "M" | "F" | null
  age?: number | null
  diagnosis?: string
  goal?: string
  occupation?: string
  training_freq_per_week?: number | null
  other_sports?: string
  note?: string
}

export interface AnalysisPacketWithMeta extends AnalysisPacket {
  case_meta?: CaseMeta
  library_sources?: string[]
}

export interface OfficialFile {
  id: string
  name: string
  description: string
  tags: string[]
  version: string
  storage_path: string
  mime: string
  size: number
  created_at: string
  updated_at: string
}

export interface PersonalFile {
  id: string
  user_id: string
  name: string
  description?: string
  storage_path: string
  mime: string
  size: number
  prompts?: string[]
  created_at: string
}

export interface PubmedRecord {
  id: string
  title: string
  authors: string
  year: number
  doi?: string
  journal?: string
  abstract?: string
  keywords: string[]
  url?: string
  created_at: string
}

export interface UserCollection {
  id: string
  user_id: string
  source_type: "official_file" | "pubmed"
  source_id: string
  note?: string
  created_at: string
}

// SessionDetail type for API responses
export interface SessionDetail {
  sessionId: string
  video: {
    url: string
    fps?: number
  }
  phases: string[]
  phaseTimecodes: Record<string, number>
  jointAnglesByPhase: Record<string, Record<string, number>>
  summaryByPhase: Record<string, any>
  aiRecommendations?: {
    source: string
    items: {
      id: string
      relatedPhase?: string | null
      title: string
      description: string
      evidence?: string[]
    }[]
  }
}
