// Legacy prototype fixtures retained for reference only. The running app never imports this file.
import type { Activity, Registration } from "./models"

type PreviewActivity = Omit<Activity, "dateTime" | "organizerId"> & { capacity: number }
export const activities: PreviewActivity[] = [
  {
    id: "design-futures",
    title: "Design Futures: Student Showcase",
    description:
      "Explore thoughtful projects from emerging designers across campus. Meet the students behind the work, hear their process, and stay for an informal Q&A with faculty and local creative leaders.",
    type: "EVENT",
    status: "PUBLISHED",
    date: "Thu, 24 Oct",
    time: "5:30 PM–7:30 PM",
    location: "Arts Building · Gallery Hall",
    organizer: "School of Design",
    organizerInitials: "SD",
    category: "Arts & culture",
    capacity: 180,
    registered: 124,
    accent: "blue",
  },
  {
    id: "climate-garden",
    title: "Climate Action Garden Day",
    description:
      "Spend a morning in the campus garden planting native species and learning practical ways to support local biodiversity. Tools and a light lunch are provided.",
    type: "CLUB_ACTIVITY",
    status: "PUBLISHED",
    date: "Sat, 26 Oct",
    time: "10:00 AM–1:00 PM",
    location: "North Campus · Community Garden",
    organizer: "Green Campus Society",
    organizerInitials: "GC",
    category: "Community",
    capacity: 40,
    registered: 31,
    accent: "teal",
  },
  {
    id: "night-sky",
    title: "Night Sky Observation",
    description:
      "Join the Astronomy Club for a guided look at the autumn sky. Telescopes and warm drinks will be available. No astronomy experience needed.",
    type: "CLUB_ACTIVITY",
    status: "PUBLISHED",
    date: "Fri, 1 Nov",
    time: "8:00 PM–10:00 PM",
    location: "Science Centre · Rooftop",
    organizer: "Astronomy Club",
    organizerInitials: "AC",
    category: "Clubs",
    capacity: 55,
    registered: 42,
    accent: "violet",
  },
  {
    id: "career-lab",
    title: "Career Lab: Make Your Ideas Clear",
    description:
      "A practical workshop on presenting your experience with clarity and confidence, led by the Career Centre.",
    type: "EVENT",
    status: "CLOSED",
    date: "Tue, 15 Oct",
    time: "3:00 PM–4:30 PM",
    location: "Student Centre · Room 204",
    organizer: "Career Centre",
    organizerInitials: "CC",
    category: "Learning",
    capacity: 60,
    registered: 60,
    accent: "amber",
  },
  {
    id: "film-night",
    title: "International Film Night",
    description:
      "An evening of short films selected by the International Students Association.",
    type: "EVENT",
    status: "DRAFT",
    date: "Wed, 13 Nov",
    time: "6:30 PM–9:00 PM",
    location: "Media Hall · Theatre 1",
    organizer: "Student Life Office",
    organizerInitials: "SL",
    category: "Arts & culture",
    capacity: 120,
    registered: 0,
    accent: "blue",
  },
]

export const initialRegistrations: Registration[] = [
  {
    id: "reg-1001",
    activityId: "climate-garden",
    status: "ACTIVE",
    registeredOn: "Registered 8 Oct",
  },
  {
    id: "reg-1002",
    activityId: "career-lab",
    status: "CANCELLED",
    registeredOn: "Cancelled 12 Oct",
  },
]

export const roster = [
  {
    id: "1",
    name: "Maya Chen",
    email: "m.chen@campus.edu",
    joined: "18 Oct, 10:42 AM",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Noah Williams",
    email: "n.williams@campus.edu",
    joined: "18 Oct, 9:15 AM",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Priya Shah",
    email: "p.shah@campus.edu",
    joined: "17 Oct, 4:28 PM",
    status: "ACTIVE",
  },
  {
    id: "4",
    name: "Eli Thompson",
    email: "e.thompson@campus.edu",
    joined: "16 Oct, 1:05 PM",
    status: "CANCELLED",
  },
]
