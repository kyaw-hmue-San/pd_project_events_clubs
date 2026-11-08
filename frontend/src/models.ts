export type Role = "student" | "organizer" | "admin"
export type ActivityStatus = "DRAFT" | "PUBLISHED" | "CLOSED"
export type ActivityType = "EVENT" | "CLUB_ACTIVITY"
export type RegistrationStatus = "ACTIVE" | "CANCELLED"

export interface Activity {
  id: string
  title: string
  description: string
  type: ActivityType
  status: ActivityStatus
  dateTime: string
  organizerId: string
  date: string
  time: string
  location: string
  organizer: string
  organizerInitials: string
  category: string
  registered: number
  checkedInCount?: number
  maxParticipants?: number | null
  endDateTime?: string | null
  registrationDeadline?: string | null
  facilitiesNotes?: string | null
  accent: "blue" | "teal" | "amber" | "violet"
}

export interface Registration {
  id: string
  activityId: string
  status: RegistrationStatus
  registeredOn: string
  checkedInAt?: string | null
}

export type Route = "auth" | "discover" | "registrations" | "activity" | "organizer-activities" | "activity-form" | "roster" | "admin-overview" | "admin-activity" | "organizer-request" | "admin-requests" | "profile" | "ticket" | "check-in" | "internships"

export interface Internship {
  id: string; title: string; company: string; description: string; location: string;
  category: string; work_mode: 'remote' | 'hybrid' | 'on-site'; skills: string[];
  allowance_thb: number | null; duration_weeks: number; application_deadline: string;
  status: 'open'; is_demo: boolean; published_at: string; updated_at: string; details_url: string;
}
export interface InternshipPage {
  data: Internship[];
  pagination: { page: number; limit: number; total: number; total_pages: number; has_next: boolean };
  meta: { api_version: string; request_id: string; timestamp: string; data_source: string };
}
export interface LibraryResources {
  resources: { id: string; title: string; author: string; category: string; description: string; available_copies: number; total_copies: number; details_url: string }[];
  pagination: { page: number; limit: number; total: number; total_pages: number; has_next: boolean };
  search: { query: string; source: 'AI' | 'ACTIVITY_KEYWORD' | 'MANUAL'; fallbackReason?: string };
}
export interface LibraryRelevance { eligible: boolean; status: 'RELEVANT' | 'NOT_RELEVANT' | 'UNAVAILABLE'; query?: string }

export interface Profile { id: string; role: "STUDENT" | "ORGANIZER" | "ADMIN"; name?: string | null; email?: string; universityId?: string | null; capabilities: { student: boolean; organizer: boolean } }
export interface ActivityInput { title: string; description: string; activityType: ActivityType; dateTime: string; location: string; maxParticipants?: number | null; endDateTime?: string | null; registrationDeadline?: string | null; facilitiesNotes?: string | null }
export interface FacilityPayload { activity_id: string; title: string; description: string; schedule: string; location: string; category: string }
export interface FacilityPreview { payload: FacilityPayload; revision: string; previousAttempt: boolean; requestsEnabled: boolean }
export interface FacilityRequest { state: 'SENDING' | 'SENT' | 'RETRYABLE' | 'REVIEW_REQUIRED'; payload: FacilityPayload; revision: string; workOrderId: string | null; initialStatus: string | null; duplicate: boolean | null; error: string | null; canRetry: boolean; submittedAt: string | null }
export interface MaintenanceStatus { notes: string | null; webhookConfigured: boolean; requestsEnabled: boolean; activityStatus: ActivityStatus; request: FacilityRequest | null; workOrder: { id: string; status: string | null; occurredAt: string | null; receivedAt: string | null; needsReview: boolean } | null }
export interface DraftBrief { topic: string; audience: string; purpose: string; activityType: ActivityType }
export interface DraftSuggestion { source: "AI" | "TEMPLATE"; fallbackReason?: string; draft: Pick<ActivityInput, "title" | "description" | "activityType"> }
export interface PlanBrief extends DraftBrief { durationMinutes: number; participants: number }
export interface EventPlan { title: string; description: string; agenda: {title: string; minutes: number; startMinute: number; endMinute: number}[]; checklist: {before: string[]; during: string[]; after: string[]}; facilities: string[]; assumptions: string[]; draft: Pick<ActivityInput, 'title' | 'description' | 'activityType' | 'facilitiesNotes'> }
export interface PlanSuggestion { source: 'AI' | 'TEMPLATE'; fallbackReason?: string; brief: PlanBrief; plan: EventPlan }
export interface AdmissionReview { status: 'PROCESSING' | 'AUTO_APPROVED' | 'MANUAL_REVIEW' | 'SUPERSEDED'; source?: 'AI' | 'SYSTEM'; policy?: string; revision?: number; summary?: string; reason?: string; meetsCriteria?: boolean; processingUntil?: string; criteria?: Record<string, {met: boolean; evidence: string}>; concerns?: string[]; evaluatedAt?: string }
export interface ActivityRecord extends ActivityInput {
  id: string; organizerId: string; organizerName?: string | null; status: ActivityStatus;
  registrationCount: number; viewerRegistrationId?: string | null;
  checkedInCount?: number;
}
export interface RegistrationRecord {
  id: string; activityId: string; studentId: string; status: RegistrationStatus;
  registeredAt: string; cancelledAt: string | null; activity?: ActivityRecord | null;
  checkedInAt?: string | null;
  participant?: { displayName: string | null; email: string | null } | null;
}
export interface RegistrationTicket { registration: RegistrationRecord; activity: ActivityRecord; holderName: string | null; code: string; qrValue: string }
export interface CheckInResult { registration: RegistrationRecord; activity: ActivityRecord; participant: { displayName: string | null; email: string | null }; alreadyCheckedIn: boolean }
export interface Page<T> { data: T[]; nextCursor: string | null }
export interface Summary { totalActivities: number; draft: number; published: number; closed: number; asOf: string }
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED"
export interface OrganizerRequest {
  id: string; applicantId: string; email: string; name: string | null; organization: string; reason: string;
  status: RequestStatus; revision: number; createdAt: string; updatedAt: string;
  decidedAt: string | null; decisionReason: string | null; decisionSource?: 'AI' | 'ADMIN' | null; aiReview?: AdmissionReview | null;
}
