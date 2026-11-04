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
  accent: "blue" | "teal" | "amber" | "violet"
}

export interface Registration {
  id: string
  activityId: string
  status: RegistrationStatus
  registeredOn: string
}

export type Route = "auth" | "discover" | "registrations" | "activity" | "organizer-activities" | "activity-form" | "roster" | "admin-overview" | "admin-activity" | "organizer-request" | "admin-requests"

export interface Profile { id: string; role: "STUDENT" | "ORGANIZER" | "ADMIN"; name?: string | null; email?: string; universityId?: string | null }
export interface ActivityInput { title: string; description: string; activityType: ActivityType; dateTime: string; location: string }
export interface ActivityRecord extends ActivityInput {
  id: string; organizerId: string; organizerName?: string | null; status: ActivityStatus;
  registrationCount: number; viewerRegistrationId?: string | null;
}
export interface RegistrationRecord {
  id: string; activityId: string; studentId: string; status: RegistrationStatus;
  registeredAt: string; cancelledAt: string | null; activity?: ActivityRecord | null;
  participant?: { displayName: string | null; email: string | null } | null;
}
export interface Page<T> { data: T[]; nextCursor: string | null }
export interface Summary { totalActivities: number; draft: number; published: number; closed: number; asOf: string }
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED"
export interface OrganizerRequest {
  id: string; applicantId: string; email: string; name: string | null; organization: string; reason: string;
  status: RequestStatus; revision: number; createdAt: string; updatedAt: string;
  decidedAt: string | null; decisionReason: string | null;
}
