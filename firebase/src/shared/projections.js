import { row } from './domain.js';

// Explicit event allowlist for Admin and embedded activity records; never users/rosters.
const activityFields = ['title', 'description', 'activityType', 'dateTime', 'location',
  'status', 'organizerId', 'registrationCount', 'createdAt', 'updatedAt'];
export function safeActivity(snap) {
  const source = row(snap);
  return { id: snap.id, ...Object.fromEntries(activityFields.filter(key => key in source).map(key => [key, source[key]])) };
}

export async function withOrganizerNames(db, activities) {
  const ids = [...new Set(activities.map(activity => activity.organizerId).filter(Boolean))];
  const users = ids.length ? await db.getAll(...ids.map(id => db.collection('users').doc(id))) : [];
  const names = new Map(users.filter(user => user.exists).map(user => [user.id,
    typeof user.data().name === 'string' ? user.data().name.slice(0, 200) : null]));
  return activities.map(activity => ({ ...activity, organizerName: names.get(activity.organizerId) || null }));
}
