import { auth } from "./firebase"
import type { ActivityInput, ActivityRecord, Profile, RegistrationRecord, Summary, Page, OrganizerRequest, RequestStatus } from "../models"

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fieldErrors?: Record<string, string>) {
    super(message)
  }
}

const rawBase = import.meta.env.VITE_API_BASE_URL || ""
const base = rawBase.replace(/\/$/, "")
if (base && !/^https?:\/\//.test(base)) throw new Error("VITE_API_BASE_URL must be an HTTP(S) URL")
export async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const user = auth?.currentUser
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.")
  const token = await user.getIdToken()
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers: { Authorization: `Bearer ${token}`, ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", options.method && options.method !== "GET"
      ? "The server could not confirm the change. Check your connection and refresh the list before trying again."
      : "Cannot reach the service. Check your connection and try again.")
  }
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, body?.error?.code || "REQUEST_FAILED",
    body?.error?.message || "The request failed. Please try again.", body?.error?.fieldErrors)
  if (body === null) throw new ApiError(502, "INVALID_RESPONSE", "The service returned an unexpected response.")
  return body as T
}

function query(values: Record<string, string | undefined>) {
  return "?" + new URLSearchParams(Object.entries(values).filter((pair): pair is [string, string] => pair[1] !== undefined)).toString()
}
const id = encodeURIComponent
export const api = {
  me: () => request<Profile>("/api/me"),
  organizerRequest: () => request<{ request: OrganizerRequest | null }>("/api/me/organizer-request"),
  submitOrganizerRequest: (body: { organization: string; reason: string }) => request<OrganizerRequest>("/api/me/organizer-request", { method: "POST", body }),
  adminOrganizerRequests: (status: RequestStatus, after?: string) => request<Page<OrganizerRequest>>("/api/admin/organizer-requests" + query({ status, after, limit: "20" })),
  reviewOrganizerRequest: (requestId: string, body: { decision: "APPROVE" | "REJECT"; revision: number; reason?: string }) => request<OrganizerRequest>(`/api/admin/organizer-requests/${id(requestId)}`, { method: "PATCH", body }),
  completeProfile: (universityId: string) => request<Profile>("/api/me/profile", { method: "POST", body: { universityId } }),
  activities: (after?: string) => request<Page<ActivityRecord>>("/api/activities" + query({ after, limit: "20" })),
  ownActivities: (after?: string) => request<Page<ActivityRecord>>("/api/me/activities" + query({ after, limit: "20" })),
  activity: (activityId: string) => request<ActivityRecord>(`/api/activities/${id(activityId)}`),
  create: (body: ActivityInput) => request<ActivityRecord>("/api/activities", { method: "POST", body }),
  update: (activityId: string, body: Partial<ActivityInput> & { status?: string }) => request<ActivityRecord>(`/api/activities/${id(activityId)}`, { method: "PATCH", body }),
  remove: (activityId: string) => request<void>(`/api/activities/${id(activityId)}`, { method: "DELETE" }),
  register: (activityId: string) => request<RegistrationRecord>(`/api/activities/${id(activityId)}/registrations`, { method: "POST" }),
  cancel: (registrationId: string) => request<RegistrationRecord>(`/api/registrations/${id(registrationId)}/cancel`, { method: "PATCH" }),
  registrations: (status: string, after?: string) => request<Page<RegistrationRecord>>("/api/me/registrations" + query({ status, after, limit: "20" })),
  roster: (activityId: string, after?: string) => request<Page<RegistrationRecord>>(`/api/activities/${id(activityId)}/registrations` + query({ after, limit: "20" })),
  adminActivities: (after?: string) => request<Page<ActivityRecord>>("/api/admin/activities" + query({ after, limit: "20" })),
  adminActivity: (activityId: string) => request<ActivityRecord>(`/api/admin/activities/${id(activityId)}`),
  summary: () => request<Summary>("/api/admin/summary"),
}
