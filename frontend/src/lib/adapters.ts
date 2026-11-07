import type { Activity, ActivityRecord, Registration, RegistrationRecord } from "../models"
import { campusTimeZone } from "./firebase"

export function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-GB", { timeZone: campusTimeZone, ...options }).format(date) : "Date unavailable"
}
export function activityView(record: ActivityRecord): Activity {
  const organizer = record.organizerName || "Campus organizer"
  return {
    id: record.id, title: record.title, description: record.description,
    type: record.activityType, status: record.status, dateTime: record.dateTime,
    date: formatDate(record.dateTime, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: formatDate(record.dateTime, { hour: "2-digit", minute: "2-digit" }),
    location: record.location, organizer, organizerId: record.organizerId,
    organizerInitials: organizer.split(/\s+/).slice(0, 2).map(word => word[0]).join(""),
    category: record.activityType === "EVENT" ? "Events" : "Clubs",
    registered: record.registrationCount,
    checkedInCount: record.checkedInCount || 0,
    maxParticipants: record.maxParticipants ?? null, endDateTime: record.endDateTime ?? null,
    registrationDeadline: record.registrationDeadline ?? null, facilitiesNotes: record.facilitiesNotes ?? null,
    accent: record.activityType === "EVENT" ? "blue" : "teal",
  }
}
export function availability(activity: Activity, now = Date.now()) {
  if (activity.status !== 'PUBLISHED') return 'Registration closed'
  if (activity.registrationDeadline && Date.parse(activity.registrationDeadline) <= now) return 'Registration deadline passed'
  if (activity.endDateTime && Date.parse(activity.endDateTime) <= now) return 'Activity ended'
  if (activity.maxParticipants != null && activity.registered >= activity.maxParticipants) return 'Activity full'
  return null
}
export function participantCount(activity: Activity) {
  const remaining = Math.max(0, (activity.maxParticipants || 0) - activity.registered)
  return activity.maxParticipants != null ? `${activity.registered}/${activity.maxParticipants} registered · ${remaining} ${remaining === 1 ? 'seat' : 'seats'} left` : `${activity.registered} active registrations`
}
export function registrationView(record: RegistrationRecord): Registration {
  const cancelled = record.status === "CANCELLED"
  const date = cancelled ? record.cancelledAt : record.registeredAt
  return { id: record.id, activityId: record.activityId, status: record.status, checkedInAt: record.checkedInAt || null,
    registeredOn: `${cancelled ? "Cancelled" : "Registered"} ${date ? formatDate(date, { day: "numeric", month: "short", year: "numeric" }) : "—"}` }
}

// Date inputs represent campus wall time, independent of the browser's timezone.
export function campusInput(iso: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: campusTimeZone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso))
  const get = (name: string) => parts.find(part => part.type === name)?.value || ""
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` }
}
export function campusToISO(date: string, time: string) {
  const wall = Date.parse(`${date}T${time}:00Z`)
  if (!Number.isFinite(wall)) throw new Error("Enter a valid date and time.")
  let instant = wall
  for (let i = 0; i < 3; i++) {
    const local = campusInput(new Date(instant).toISOString())
    const shown = Date.parse(`${local.date}T${local.time}:00Z`)
    instant += wall - shown
  }
  const local = campusInput(new Date(instant).toISOString())
  if (local.date !== date || local.time !== time) throw new Error("That time does not exist in the campus timezone. Choose another time.")
  return new Date(instant).toISOString()
}
