// Isolated HTTP API with a deterministic partner double. This file is never a
// production entrypoint and refuses real projects or non-loopback emulators.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { createOrganizerAdmission } from '../backend/src/features/organizer-requests/ai-review.js';
import { createPlanningAssistant } from '../backend/src/features/draft-assistant/planning.js';
import { createApp } from '../backend/src/app.js';
import { createFacilities } from '../backend/src/features/integrations/facilities.js';
import { createIntegration, integrationConfig } from '../backend/src/features/integrations/service.js';
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.FIREBASE_PROJECT_ID !== 'demo-campus-pulse-e2e' || !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) throw new Error('Browser API requires the isolated local demo emulators');
const firebase = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
const db = getFirestore(firebase), orders = new Map();
const integration = createIntegration({ db, config: integrationConfig({ WEBHOOK_INBOUND_SECRET: 'isolated-browser-webhook-secret-only-123456', WEBHOOK_REQUIRE_HMAC: 'true' }), fetchImpl: () => { throw new Error('External calls forbidden') } });
const facilities = createFacilities({ db, config: { enabled: true, key: 'isolated-browser-partner-key', url: 'https://partner.invalid/api/partner/work-orders', timeZone: 'Asia/Bangkok', timeoutMs: 1000 }, fetchImpl: async (url, options) => {
  if (url !== 'https://partner.invalid/api/partner/work-orders') throw new Error('External URL forbidden');
  const payload = JSON.parse(options.body), existing = orders.get(payload.activity_id);
  if (existing) return new Response(JSON.stringify({ success: true, duplicate: true, workOrderId: existing.id, activityId: payload.activity_id, status: 'OPEN' }), { status: 200 });
  orders.set(payload.activity_id, { id: randomUUID(), payload, key: options.headers['Idempotency-Key'] });
  throw new Error('Simulated lost response after isolated partner creation');
} });
const aiConfig = { enabled: true, apiKey: 'isolated-browser-ai-key', model: 'test/model', timeoutMs: 1000, autoApprove: true };
const reply = value => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }));
const organizerAdmission = createOrganizerAdmission({ db, auth: getAuth(firebase), config: aiConfig, fetchImpl: async (_url, options) => {
  const application = JSON.parse(JSON.parse(options.body).messages[1].content);
  const qualify = application.organization.startsWith('E2E AI Campus Collective');
  return reply({ summary: qualify ? 'The campus workshop and organizing responsibilities are clearly described.' : 'The application needs Admin clarification.', criteria: {
    campusActivity: { met: qualify, evidence: qualify ? 'beginner coding workshop' : '' }, purposeAndAudience: { met: qualify, evidence: qualify ? 'MFU students to learn programming' : '' },
    organizerIdentity: { met: qualify, evidence: qualify ? application.organization : '' }, responsibility: { met: qualify, evidence: qualify ? 'prepare materials, coordinate volunteers and manage registration' : '' },
  }, consistent: true, safe: true, concerns: qualify ? [] : ['Please clarify the activity and organizing responsibilities.'] });
} });
const planningAssistant = createPlanningAssistant({ config: aiConfig, fetchImpl: async (_url, options) => {
  const brief = JSON.parse(JSON.parse(options.body).messages[1].content);
  if (brief.topic.startsWith('Timeout fixture')) throw new DOMException('Isolated provider timeout', 'TimeoutError');
  if (!brief.topic.startsWith('AI-assisted workshop')) return new Response('{}', { status: 503 });
  const intro = Math.max(2, Math.floor(brief.durationMinutes / 5));
  return reply({ title: brief.topic, description: brief.purpose, agenda: [{ title: 'Welcome and goals', minutes: intro }, { title: 'Practical workshop and questions', minutes: brief.durationMinutes - intro }],
    checklist: { before: ['Prepare practice materials'], during: ['Support participants and collect questions'], after: ['Collect feedback and tidy the room'] },
    facilities: [`Suggested seating for ${brief.participants} participants; confirm capacity.`, 'Projector and presentation screen; confirm availability.'], assumptions: ['Venue and equipment availability have not been confirmed.'] });
} });
const server = createApp({ db, auth: getAuth(firebase), integration, facilities, organizerAdmission, planningAssistant }).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('Isolated browser API ready; partner creation is mocked.'));
const stopWorker = integration.start();
process.once('SIGTERM', () => { stopWorker(); server.close(async () => { await deleteApp(firebase); process.exit(0) }) });
