import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { after, before, test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { bindMaintenanceWorkOrder } from '../src/features/integrations/maintenance.js';
import { localIntegrationEnvironment } from '../local-api-config.mjs';
import { createIntegration, integrationConfig } from '../src/features/integrations/service.js';
import { createFacilities } from '../src/features/integrations/facilities.js';
import { createApp } from '../src/app.js';
import { createOrganizerAdmission } from '../src/features/organizer-requests/ai-review.js';
import { createPlanningAssistant } from '../src/features/draft-assistant/planning.js';
import { createInternships } from '../src/features/internships/service.js';
import { internshipFetch } from '../../scripts/fixtures/internship-feed.mjs';
import { createLibrary } from '../src/features/library/service.js';
import { libraryFetch, libraryAiFetch } from '../../scripts/fixtures/library-catalog.mjs';

const projectId = process.env.FIREBASE_PROJECT_ID;
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const emulatorAvailable = projectId?.startsWith('demo-') && authEmulatorHost && firestoreEmulatorHost;
const testPartnerKey = `partner-${randomUUID()}`;
const testWebhookSecret = `webhook-${randomUUID()}`;

if (!emulatorAvailable) {
  test('API emulator tests require isolated Auth and Firestore emulators', { skip: true }, () => {});
} else {
  const adminApp = initializeApp({ projectId }, 'api-emulator-tests');
  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);
  const apiUsers = {};
  let apiProcess;
  let baseUrl;

  async function createUser(role, { emailVerified = true, provisioned = true, domain = 'lamduan.mfu.ac.th', provider = 'google.com' } = {}) {
    const suffix = `${role.toLowerCase()}-${randomUUID()}`;
    const email = `${suffix}@${domain}`;
    const password = `Demo-${randomUUID()}-9a!`;
    const user = await auth.createUser({ email, password, emailVerified, displayName: `Test ${role}` });
    if (provider !== 'password') await auth.updateUser(user.uid, { providerToLink: { providerId: provider, uid: user.uid, email } });
    const passwordFlow = provider === 'password';
    const signIn = await fetch(`http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:${passwordFlow ? 'signInWithPassword' : 'signInWithIdp'}?key=emulator-api-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordFlow ? { email, password, returnSecureToken: true } : {
        postBody: new URLSearchParams({ providerId: provider, id_token: JSON.stringify({ sub: user.uid, email, email_verified: emailVerified, name: `Test ${role}` }) }).toString(),
        requestUri: 'http://localhost', returnSecureToken: true,
      })
    });
    const signInBody = await signIn.json();
    assert.equal(signIn.status, 200, `Auth emulator sign-in failed: ${JSON.stringify(signInBody)}`);
    const { idToken } = signInBody;
    if (provisioned) await db.doc(`users/${user.uid}`).set({
      email,
      name: `Test ${role}`,
      role,
      universityId: `TEST-${user.uid}`,
      createdAt: FieldValue.serverTimestamp()
    });
    return { uid: user.uid, email, idToken, role };
  }

  async function reservePort() {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    return port;
  }

  async function request(path, { token, method = 'GET', body, origin, headers: extraHeaders = {} } = {}) {
    const headers = { ...extraHeaders };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (origin) headers.Origin = origin;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    return { response, body: text ? JSON.parse(text) : null };
  }

  async function createActivity(token, title = `Demo activity ${randomUUID()}`) {
    const result = await request('/api/activities', {
      token,
      method: 'POST',
      body: {
        title,
        description: 'Isolated emulator test activity.',
        activityType: 'EVENT',
        dateTime: '2027-01-15T10:00:00Z',
        location: 'Test Hall'
      }
    });
    assert.equal(result.response.status, 201, JSON.stringify(result.body));
    return result.body;
  }

  async function publishActivity(token, activityId) {
    const result = await request(`/api/activities/${activityId}`, {
      token,
      method: 'PATCH',
      body: { status: 'PUBLISHED' }
    });
    assert.equal(result.response.status, 200, JSON.stringify(result.body));
    return result.body;
  }

  before(async () => {
    assert.ok(projectId.startsWith('demo-'), 'Refusing to run API emulator tests without a demo project ID');
    apiUsers.organizer = await createUser('ORGANIZER');
    apiUsers.admin = await createUser('ADMIN');
    apiUsers.otherOrganizer = await createUser('ORGANIZER');
    apiUsers.student = await createUser('STUDENT');
    apiUsers.otherStudent = await createUser('STUDENT');

    const port = await reservePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const childEnv = {
      ...process.env,
      FIREBASE_PROJECT_ID: projectId,
      PORT: String(port),
      FRONTEND_ORIGINS: 'http://localhost:5173,https://campus-demo.example.edu',
      INTEGRATION_LOG_VIEWER_UIDS: apiUsers.organizer.uid
    };
    for (const key of Object.keys(childEnv)) if (/^(TEAM10_|TEAM17_|LIBRARY_|WEBHOOK_REQUIRE_|ORGANIZER_AI_)/.test(key)) delete childEnv[key];
    for (const key of [
      'GOOGLE_APPLICATION_CREDENTIALS',
      'PARTNER_API_URL', 'PARTNER_API_HEADER_NAME', 'PARTNER_API_TOKEN', 'PARTNER_WEBHOOK_URL',
      'PARTNER_INBOUND_API_KEY', 'WEBHOOK_INBOUND_SECRET', 'WEBHOOK_OUTBOUND_SECRET'
    ]) delete childEnv[key];
    childEnv.PARTNER_INBOUND_API_KEY = testPartnerKey;
    childEnv.WEBHOOK_INBOUND_SECRET = testWebhookSecret;

    apiProcess = spawn(process.execPath, ['api.mjs'], {
      cwd: new URL('../', import.meta.url),
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let errors = '';
    apiProcess.stdout.setEncoding('utf8');
    apiProcess.stderr.setEncoding('utf8');
    apiProcess.stdout.on('data', chunk => { output += chunk; });
    apiProcess.stderr.on('data', chunk => { errors += chunk; });

    await new Promise((resolve, reject) => {
      const startupTimer = setTimeout(() => reject(new Error(`API startup timed out. stdout=${output} stderr=${errors}`)), 15000);
      apiProcess.stdout.on('data', chunk => {
        if ((output + chunk).includes(`Campus Events API listening on port ${port}`)) {
          clearTimeout(startupTimer);
          resolve();
        }
      });
      apiProcess.once('error', error => {
        clearTimeout(startupTimer);
        reject(error);
      });
      apiProcess.once('exit', code => {
        clearTimeout(startupTimer);
        reject(new Error(`API exited before listening (${code}). stdout=${output} stderr=${errors}`));
      });
    });
  });

  after(async () => {
    if (apiProcess && apiProcess.exitCode === null) {
      await new Promise(resolve => {
        apiProcess.once('exit', resolve);
        apiProcess.kill('SIGTERM');
      });
    }
    await deleteApp(adminApp);
  });

  test('requires a valid Firebase token and enforces Student/Organizer roles', async () => {
    const missing = await request('/api/activities');
    assert.equal(missing.response.status, 401);
    assert.equal(missing.body.error.code, 'UNAUTHENTICATED');

    const invalid = await request('/api/activities', { token: 'not-a-firebase-token' });
    assert.equal(invalid.response.status, 401);
    assert.equal(invalid.body.error.code, 'INVALID_TOKEN');

    const studentCreate = await request('/api/activities', {
      token: apiUsers.student.idToken,
      method: 'POST',
      body: { title: 'Forbidden', description: 'No', activityType: 'EVENT', dateTime: '2027-01-15T10:00:00Z', location: 'Test' }
    });
    assert.equal(studentCreate.response.status, 403);
    assert.equal(studentCreate.body.error.code, 'FORBIDDEN');

    const organizerCreate = await createActivity(apiUsers.organizer.idToken);
    assert.equal(organizerCreate.organizerId, apiUsers.organizer.uid);

    const personalOrganizer = await createUser('ORGANIZER', { domain: 'gmail.com' });
    const organizerRegister = await request('/api/activities/not-an-activity/registrations', {
      token: personalOrganizer.idToken,
      method: 'POST'
    });
    assert.equal(organizerRegister.response.status, 403);

    const organizerHistory = await request('/api/me/registrations', { token: personalOrganizer.idToken });
    assert.equal(organizerHistory.response.status, 403);

    const studentRoster = await request(`/api/activities/${organizerCreate.id}/registrations`, { token: apiUsers.student.idToken });
    assert.equal(studentRoster.response.status, 403);
  });

  test('rejects unverified and unprovisioned accounts and client-submitted role changes', async () => {
    const unverified = await createUser('STUDENT', { emailVerified: false });
    const unprovisioned = await createUser('STUDENT', { provisioned: false });
    const unknownRole = await createUser('SUPERUSER');
    for (const [user, code] of [[unverified, 'EMAIL_NOT_VERIFIED'], [unprovisioned, 'PROFILE_SETUP_REQUIRED'], [unknownRole, 'ACCOUNT_NOT_PROVISIONED']]) {
      const result = await request('/api/me', { token: user.idToken });
      assert.equal(result.response.status, 403);
      assert.equal(result.body.error.code, code);
    }
    const escalation = await request('/api/activities', { token: apiUsers.organizer.idToken, method: 'POST', body: {
      title: 'Role escalation', description: 'Not permitted', location: 'Test', activityType: 'EVENT',
      dateTime: '2027-01-15T10:00:00Z', role: 'ADMIN'
    } });
    assert.equal(escalation.response.status, 400);
    assert.equal(escalation.body.error.code, 'UNKNOWN_FIELD');
    assert.equal((await request('/api/me', { token: apiUsers.organizer.idToken })).body.role, 'ORGANIZER');
  });

  test('allows only the configured browser origin and does not bypass API authentication', async () => {
    const preflight = await fetch(`${baseUrl}/api/activities`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const allowedUnauthenticated = await request('/api/activities', { origin: 'http://localhost:5173' });
    assert.equal(allowedUnauthenticated.response.status, 401);
    assert.equal(allowedUnauthenticated.response.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const denied = await request('/health', { origin: 'https://unapproved.example.edu' });
    assert.equal(denied.response.status, 403);
    assert.equal(denied.body.error.code, 'ORIGIN_NOT_ALLOWED');

    const secretHeaderPreflight = await fetch(`${baseUrl}/webhooks/partner`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'x-webhook-secret'
      }
    });
    assert.equal(secretHeaderPreflight.status, 403);
    assert.equal((await secretHeaderPreflight.json()).error.code, 'CORS_PREFLIGHT_DENIED');
  });

  test('enforces event ownership and the approved closed-event lifecycle', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);

    const crossOwnerEdit = await request(`/api/activities/${activity.id}`, {
      token: apiUsers.otherOrganizer.idToken,
      method: 'PATCH',
      body: { title: 'Unauthorized edit' }
    });
    assert.equal(crossOwnerEdit.response.status, 403);

    const crossOwnerRoster = await request(`/api/activities/${activity.id}/registrations`, {
      token: apiUsers.otherOrganizer.idToken
    });
    assert.equal(crossOwnerRoster.response.status, 403);

    const closed = await request(`/api/activities/${activity.id}`, {
      token: apiUsers.organizer.idToken,
      method: 'PATCH',
      body: { status: 'CLOSED' }
    });
    assert.equal(closed.response.status, 200);

    const list = await request('/api/activities', { token: apiUsers.student.idToken });
    assert.equal(list.response.status, 200);
    assert.ok(list.body.data.some(item => item.id === activity.id && item.status === 'CLOSED'));

    const detail = await request(`/api/activities/${activity.id}`, { token: apiUsers.student.idToken });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.status, 'CLOSED');

    const closedRegistration = await request(`/api/activities/${activity.id}/registrations`, {
      token: apiUsers.student.idToken,
      method: 'POST'
    });
    assert.equal(closedRegistration.response.status, 409);
    assert.equal(closedRegistration.body.error.code, 'REGISTRATION_CLOSED');

    const reopen = await request(`/api/activities/${activity.id}`, {
      token: apiUsers.organizer.idToken,
      method: 'PATCH',
      body: { status: 'PUBLISHED' }
    });
    assert.equal(reopen.response.status, 409);
    assert.equal(reopen.body.error.code, 'CANNOT_REOPEN_CLOSED_ACTIVITY');
  });

  test('preserves the legacy cancellation route and supports the PRD route', async () => {
    const first = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, first.id);
    const firstRegistration = await request(`/api/activities/${first.id}/registrations`, {
      token: apiUsers.student.idToken,
      method: 'POST'
    });
    assert.equal(firstRegistration.response.status, 201);

    const legacy = await request(`/api/registrations/${firstRegistration.body.id}`, {
      token: apiUsers.student.idToken,
      method: 'PATCH',
      body: { status: 'CANCELLED' }
    });
    assert.equal(legacy.response.status, 200);
    assert.equal(legacy.body.status, 'CANCELLED');

    const repeated = await request(`/api/registrations/${firstRegistration.body.id}`, {
      token: apiUsers.student.idToken,
      method: 'PATCH',
      body: { status: 'CANCELLED' }
    });
    assert.equal(repeated.response.status, 200);
    assert.equal(repeated.body.status, 'CANCELLED');

    const second = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, second.id);
    const secondRegistration = await request(`/api/activities/${second.id}/registrations`, {
      token: apiUsers.student.idToken,
      method: 'POST'
    });
    assert.equal(secondRegistration.response.status, 201);

    const canonical = await request(`/api/registrations/${secondRegistration.body.id}/cancel`, {
      token: apiUsers.student.idToken,
      method: 'PATCH'
    });
    assert.equal(canonical.response.status, 200);
    assert.equal(canonical.body.status, 'CANCELLED');

    const foreignCancel = await request(`/api/registrations/${firstRegistration.body.id}/cancel`, {
      token: apiUsers.otherStudent.idToken,
      method: 'PATCH'
    });
    assert.equal(foreignCancel.response.status, 403);
  });

  test('prevents duplicate and concurrent active registrations', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);

    const results = await Promise.all([
      request(`/api/activities/${activity.id}/registrations`, { token: apiUsers.student.idToken, method: 'POST' }),
      request(`/api/activities/${activity.id}/registrations`, { token: apiUsers.student.idToken, method: 'POST' })
    ]);
    assert.deepEqual(results.map(result => result.response.status).sort(), [201, 409]);

    const duplicate = await request(`/api/activities/${activity.id}/registrations`, {
      token: apiUsers.student.idToken,
      method: 'POST'
    });
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.error.code, 'ALREADY_REGISTERED');

    const registrationId = results.find(result => result.response.status === 201).body.id;
    const ownHistory = await request('/api/me/registrations', { token: apiUsers.student.idToken });
    assert.deepEqual(ownHistory.body.data.map(registration => registration.id), [registrationId]);

    const otherHistory = await request('/api/me/registrations', { token: apiUsers.otherStudent.idToken });
    assert.deepEqual(otherHistory.body.data, []);

    const roster = await request(`/api/activities/${activity.id}/registrations`, { token: apiUsers.organizer.idToken });
    assert.equal(roster.response.status, 200);
    assert.ok(roster.body.data.some(registration => registration.id === registrationId));
  });

  test('restricts integration logs and omits payload and response data', async () => {
    await db.collection('integrationLogs').add({
      kind: 'partner.fetch',
      at: FieldValue.serverTimestamp(),
      requestId: `test-${randomUUID()}`,
      outcome: 'ok',
      payload: { private: 'do-not-return' },
      response: { token: 'do-not-return' }
    });

    const allowed = await request('/api/integration/logs', { token: apiUsers.organizer.idToken });
    assert.equal(allowed.response.status, 200);
    assert.equal(JSON.stringify(allowed.body).includes('do-not-return'), false);
    assert.equal(JSON.stringify(allowed.body).includes('token'), false);

    const denied = await request('/api/integration/logs', { token: apiUsers.otherOrganizer.idToken });
    assert.equal(denied.response.status, 403);
  });

  test('preserves Team 10 provider and webhook HTTP contracts', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);

    const providerDenied = await request('/partner/activities');
    assert.equal(providerDenied.response.status, 401);

    const provider = await request('/partner/activities?limit=20', {
      headers: { 'X-Partner-Key': testPartnerKey }
    });
    assert.equal(provider.response.status, 200);
    const partnerEvent = provider.body.data.find(item => item.id === activity.id);
    assert.ok(partnerEvent);
    assert.equal('organizerId' in partnerEvent, false);

    const event = {
      id: randomUUID(),
      type: 'notification.delivered',
      occurredAt: new Date().toISOString(),
      data: { activityId: activity.id }
    };
    const webhook = body => request('/webhooks/partner', {
      method: 'POST',
      body,
      headers: { 'X-Webhook-Secret': testWebhookSecret }
    });
    const first = await webhook(event);
    assert.equal(first.response.status, 201);
    assert.equal(first.body.duplicate, false);

    const duplicate = await webhook(event);
    assert.equal(duplicate.response.status, 200);
    assert.equal(duplicate.body.duplicate, true);

    const conflict = await webhook({ ...event, data: { activityId: 'different-id' } });
    assert.equal(conflict.response.status, 409);
    assert.equal(conflict.body.error.code, 'EVENT_ID_CONFLICT');

    const consumer = await request('/api/integration/partner', { token: apiUsers.organizer.idToken });
    assert.equal(consumer.response.status, 200);
    assert.equal(consumer.body.status, 'unconfigured');
  });
  test('Organizer-owned lists are paginated and reject foreign cursors and roles', async () => {
    const first = await createActivity(apiUsers.organizer.idToken, 'Owned draft A');
    const second = await createActivity(apiUsers.organizer.idToken, 'Owned draft B');
    const foreign = await createActivity(apiUsers.otherOrganizer.idToken, 'Private foreign draft');
    const page = await request('/api/me/activities?status=DRAFT&limit=1', { token: apiUsers.organizer.idToken });
    assert.equal(page.response.status, 200);
    assert.equal(page.body.data.length, 1);
    assert.ok(page.body.nextCursor);
    assert.equal(page.body.data[0].organizerId, apiUsers.organizer.uid);
    const next = await request(`/api/me/activities?status=DRAFT&limit=1&after=${page.body.nextCursor}`, { token: apiUsers.organizer.idToken });
    assert.equal(next.response.status, 200);
    assert.notEqual(next.body.data[0].id, page.body.data[0].id);
    const deniedCursor = await request(`/api/me/activities?after=${foreign.id}`, { token: apiUsers.organizer.idToken });
    assert.equal(deniedCursor.response.status, 400);
    assert.equal((await request('/api/me/activities', { token: apiUsers.student.idToken })).response.status, 403);
    assert.equal((await request('/api/me/activities?limit=51', { token: apiUsers.organizer.idToken })).response.status, 400);
    assert.ok(first.id && second.id);
  });

  test('Cancelled history is opt-in, isolated, and supports re-registration and safe activity data', async () => {
    const student = await createUser('STUDENT');
    const activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const registration = await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken, method: 'POST' });
    await request(`/api/registrations/${registration.body.id}/cancel`, { token: student.idToken, method: 'PATCH' });
    const legacy = await request('/api/me/registrations', { token: student.idToken });
    assert.deepEqual(legacy.body.data, []);
    const history = await request('/api/me/registrations?includeCancelled=true&limit=1', { token: student.idToken });
    assert.equal(history.body.data[0].status, 'CANCELLED');
    assert.equal(history.body.data[0].activity.id, activity.id);
    assert.equal(history.body.data[0].activity.organizerName, 'Test ORGANIZER');
    assert.equal('email' in history.body.data[0].activity, false);
    const foreign = await request(`/api/me/registrations?includeCancelled=true&after=${registration.body.id}`, { token: apiUsers.otherStudent.idToken });
    assert.equal(foreign.response.status, 400);
    const again = await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken, method: 'POST' });
    assert.equal(again.response.status, 201);
    const details = await request(`/api/activities/${activity.id}`, { token: student.idToken });
    assert.equal(details.body.viewerRegistrationId, again.body.id);
    const otherDetails = await request(`/api/activities/${activity.id}`, { token: apiUsers.otherStudent.idToken });
    assert.equal(otherDetails.body.viewerRegistrationId, null);
    const roster = await request(`/api/activities/${activity.id}/registrations?limit=1`, { token: apiUsers.organizer.idToken });
    assert.equal(roster.body.data.length, 1);
    assert.ok(roster.body.nextCursor);
    assert.equal(roster.body.data[0].participant.email, student.email);
  });

  test('Admin sees accurate global counts and safe drafts, with no mutations or private access', async () => {
    const activity = await createActivity(apiUsers.otherOrganizer.idToken, 'Admin-visible private draft');
    await db.doc(`activities/${activity.id}`).update({ internalSecret: 'must-not-appear' });
    const summary = await request('/api/admin/summary', { token: apiUsers.admin.idToken });
    assert.equal(summary.response.status, 200);
    assert.equal(summary.body.totalActivities, (await db.collection('activities').count().get()).data().count);
    assert.equal(summary.body.draft, (await db.collection('activities').where('status', '==', 'DRAFT').count().get()).data().count);
    const detail = await request(`/api/admin/activities/${activity.id}`, { token: apiUsers.admin.idToken });
    assert.equal(detail.response.status, 200);
    assert.equal(detail.body.status, 'DRAFT');
    assert.equal('internalSecret' in detail.body, false);
    assert.equal('email' in detail.body, false);
    const list = await request('/api/admin/activities?limit=1', { token: apiUsers.admin.idToken });
    assert.equal(list.body.data.length, 1);
    assert.ok(list.body.nextCursor);
    for (const token of [apiUsers.student.idToken, apiUsers.organizer.idToken]) {
      assert.equal((await request('/api/admin/summary', { token })).response.status, 403);
      assert.equal((await request('/api/admin/activities', { token })).response.status, 403);
      assert.equal((await request(`/api/admin/activities/${activity.id}`, { token })).response.status, 403);
    }
    for (const [path, method] of [
      ['/api/activities', 'POST'], [`/api/activities/${activity.id}`, 'PATCH'],
      [`/api/activities/${activity.id}`, 'DELETE'], [`/api/activities/${activity.id}/registrations`, 'POST'],
      [`/api/activities/${activity.id}/registrations`, 'GET'], ['/api/me/registrations', 'GET'],
      ['/api/integration/logs', 'GET'], ['/api/integration/partner', 'GET'],
      ['/api/admin/summary', 'POST'], ['/api/admin/activities', 'PATCH']
    ]) assert.equal((await request(path, { token: apiUsers.admin.idToken, method })).response.status, 403, `${method} ${path}`);
    assert.equal((await request('/api/me', { token: apiUsers.admin.idToken })).body.role, 'ADMIN');
  });

  test('Validation errors provide safe actionable messages and field errors', async () => {
    const invalid = await request('/api/activities', { token: apiUsers.organizer.idToken, method: 'POST', body: { title: '' } });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.error.code, 'INVALID_TITLE');
    assert.ok(invalid.body.error.message);
    assert.ok(invalid.body.error.fieldErrors.title);
    const invalidCalendar = await request('/api/activities', { token: apiUsers.organizer.idToken, method: 'POST', body: {
      title: 'Invalid calendar date', description: 'Must reject normalized dates', location: 'Test Hall',
      activityType: 'EVENT', dateTime: '2027-02-31T10:00:00Z'
    } });
    assert.equal(invalidCalendar.response.status, 400);
    assert.equal(invalidCalendar.body.error.code, 'INVALID_DATE_TIME');
    const malformed = await fetch(`${baseUrl}/api/activities`, { method: 'POST', headers: { Authorization: `Bearer ${apiUsers.organizer.idToken}`, 'Content-Type': 'application/json' }, body: '{invalid' });
    const error = await malformed.json();
    assert.equal(malformed.status, 400);
    assert.equal(error.error.code, 'INVALID_BODY');
    assert.equal(JSON.stringify(error).includes('{invalid'), false);
  });

  test('only verified Google identities from the exact school domain can enter or enroll', async () => {
    for (const domain of ['gmail.com', 'lamduan.mfu.ac.th.attacker.test', 'sub.lamduan.mfu.ac.th', 'mfu.ac.th']) {
      const outsider = await createUser('STUDENT', { domain });
      for (const path of ['/api/me', '/api/activities', '/api/me/profile']) {
        const result = await request(path, { token: outsider.idToken, ...(path.endsWith('/profile') ? { method: 'POST', body: { universityId: `OUT-${randomUUID()}` } } : {}) });
        assert.equal(result.response.status, 403);
        assert.equal(result.body.error.code, 'SCHOOL_ACCOUNT_REQUIRED');
      }
    }
    const passwordUser = await createUser('STUDENT', { provider: 'password' });
    assert.equal((await request('/api/me', { token: passwordUser.idToken })).body.error.code, 'SCHOOL_GOOGLE_REQUIRED');
    const school = await createUser('STUDENT', { provisioned: false });
    assert.equal((await request('/api/admin/summary', { token: school.idToken })).response.status, 403);
    const deniedRole = await request('/api/me/profile', { token: school.idToken, method: 'POST', body: { universityId: 'SELF-ADMIN', role: 'ADMIN' } });
    assert.equal(deniedRole.response.status, 400);
    assert.equal(deniedRole.body.error.code, 'UNKNOWN_FIELD');
    assert.equal((await db.doc(`users/${school.uid}`).get()).exists, false);
  });

  test('first-time Google onboarding creates one Student profile atomically and preserves existing roles', async () => {
    const school = await createUser('STUDENT', { provisioned: false });
    const universityId = `NEW-${randomUUID()}`;
    const responses = await Promise.all([1, 2].map(() => request('/api/me/profile', { token: school.idToken, method: 'POST', body: { universityId } })));
    assert.deepEqual(responses.map(result => result.response.status).sort(), [200, 201]);
    const me = await request('/api/me', { token: school.idToken });
    assert.equal(me.body.role, 'STUDENT');
    assert.equal(me.body.email, school.email);
    assert.equal(me.body.universityId, universityId);
    const second = await createUser('STUDENT', { provisioned: false });
    const collision = await request('/api/me/profile', { token: second.idToken, method: 'POST', body: { universityId } });
    assert.equal(collision.response.status, 409);
    assert.equal(collision.body.error.code, 'UNIVERSITY_ID_TAKEN');
    assert.equal((await db.doc(`users/${second.uid}`).get()).exists, false);
    const original = await request('/api/me', { token: apiUsers.organizer.idToken });
    const existing = await request('/api/me/profile', { token: apiUsers.organizer.idToken, method: 'POST', body: { universityId: original.body.universityId } });
    assert.equal(existing.response.status, 200);
    assert.equal(existing.body.role, 'ORGANIZER');
    const changed = await request('/api/me/profile', { token: apiUsers.organizer.idToken, method: 'POST', body: { universityId: 'ANOTHER-ID' } });
    assert.equal(changed.response.status, 409);
    const stolenLegacy = await request('/api/me/profile', { token: second.idToken, method: 'POST', body: { universityId: original.body.universityId } });
    assert.equal(stolenLegacy.response.status, 409);
    assert.equal((await request('/api/admin/summary', { token: school.idToken })).response.status, 403);
  });

  test('personal Google accounts can request Organizer access but cannot access campus data before approval', async () => {
    const applicant = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    const data = { organization: 'External campus partner', reason: 'I represent an approved campus partner and want to hold a workshop.' };
    const first = await request('/api/me/organizer-request', { token: applicant.idToken, method: 'POST', body: data });
    assert.equal(first.response.status, 201);
    assert.equal(first.body.status, 'PENDING');
    assert.equal(first.body.email, applicant.email);
    const repeated = await request('/api/me/organizer-request', { token: applicant.idToken, method: 'POST', body: data });
    assert.equal(repeated.response.status, 200);
    assert.equal(repeated.body.id, first.body.id);
    assert.equal((await db.doc(`users/${applicant.uid}`).get()).exists, false);
    const forged = await request('/api/me/organizer-request', { token: applicant.idToken, method: 'POST', body: { ...data, role: 'ADMIN' } });
    assert.equal(forged.response.status, 400);
    const changed = await request('/api/me/organizer-request', { token: applicant.idToken, method: 'POST', body: { ...data, reason: 'Changed request while still pending approval.' } });
    assert.equal(changed.response.status, 409);
    for (const [path, method, body] of [['/api/activities', 'GET'], ['/api/me/profile', 'POST', { universityId: 'OUTSIDER' }], ['/api/activities', 'POST', {}], ['/api/admin/organizer-requests', 'GET']]) {
      assert.equal((await request(path, { token: applicant.idToken, method, body })).response.status, 403, path);
    }
    const own = await request('/api/me/organizer-request?uid=another-user', { token: applicant.idToken });
    assert.equal(own.body.request.id, first.body.id);
    const stranger = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    assert.equal((await request('/api/me/organizer-request', { token: stranger.idToken })).body.request, null);
    for (const token of [apiUsers.student.idToken, apiUsers.organizer.idToken]) {
      assert.equal((await request('/api/admin/organizer-requests', { token })).response.status, 403);
      assert.equal((await request(`/api/admin/organizer-requests/${first.body.id}`, { token, method: 'PATCH', body: { decision: 'APPROVE', revision: 1 } })).response.status, 403);
    }
    const page = await request('/api/admin/organizer-requests?limit=1', { token: apiUsers.admin.idToken });
    assert.equal(page.response.status, 200);
    assert.equal(page.body.data.length, 1);
    const approved = await request(`/api/admin/organizer-requests/${first.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'APPROVE', revision: 1 } });
    assert.equal(approved.response.status, 200);
    const me = await request('/api/me', { token: applicant.idToken });
    assert.equal(me.response.status, 200);
    assert.equal(me.body.role, 'ORGANIZER');
    assert.equal(me.body.universityId, null);
    assert.deepEqual(me.body.capabilities, { student: false, organizer: true });
    assert.ok((await createActivity(applicant.idToken, 'Approved personal-email Organizer activity')).id);
    assert.equal((await request('/api/me/registrations', { token: applicant.idToken })).response.status, 403);
  });

  test('Admin review handles rejection, resubmission, stale revisions, conflicting and duplicate decisions safely', async () => {
    const applicant = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    const submit = reason => request('/api/me/organizer-request', { token: applicant.idToken, method: 'POST', body: { organization: 'Review test club', reason } });
    const first = await submit('A campus workshop for our club members.');
    const review = body => request(`/api/admin/organizer-requests/${first.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body });
    const rejected = await review({ decision: 'REJECT', revision: 1, reason: 'Please explain the school partnership.' });
    assert.equal(rejected.response.status, 200);
    assert.equal((await db.doc(`users/${applicant.uid}`).get()).exists, false);
    const again = await submit('We partner with the university student office to hold a workshop.');
    assert.equal(again.body.revision, 2);
    assert.equal((await review({ decision: 'APPROVE', revision: 1 })).body.error.code, 'STALE_REQUEST');
    const replies = await Promise.all([review({ decision: 'APPROVE', revision: 2 }), review({ decision: 'APPROVE', revision: 2 })]);
    assert.deepEqual(replies.map(reply => reply.response.status), [200, 200]);
    assert.equal((await review({ decision: 'REJECT', revision: 2, reason: 'Conflicting decision' })).response.status, 409);
    const audit = await db.collection('organizerRequestDecisions').where('requestId', '==', first.body.id).get();
    assert.equal(audit.size, 2, 'one rejection and one approval, with no duplicate approval');
    const deniedAdminRole = await review({ decision: 'APPROVE', revision: 2, role: 'ADMIN' });
    assert.equal(deniedAdminRole.response.status, 400);
    assert.equal((await db.doc(`users/${applicant.uid}`).get()).data().role, 'ORGANIZER');
  });

  test('approved MFU Students retain registration access and gain organizing access without weakening ownership', async () => {
    const student = await createUser('STUDENT');
    const original = (await db.doc(`users/${student.uid}`).get()).data();
    const activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const registration = await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken, method: 'POST' });
    const submitted = await request('/api/me/organizer-request', { token: student.idToken, method: 'POST', body: { organization: 'Student club', reason: 'I want to organize activities for my student club.' } });
    assert.equal((await request('/api/me/registrations', { token: student.idToken })).response.status, 200);
    await request(`/api/admin/organizer-requests/${submitted.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'APPROVE', revision: 1 } });
    const updated = (await db.doc(`users/${student.uid}`).get()).data();
    assert.equal(updated.role, 'ORGANIZER');
    assert.equal(updated.universityId, original.universityId);
    assert.equal(updated.email, original.email);
    assert.equal((await db.doc(`registrations/${registration.body.id}`).get()).data().studentId, student.uid);
    const me = await request('/api/me', { token: student.idToken });
    assert.deepEqual(me.body.capabilities, { student: true, organizer: true });
    const history = await request('/api/me/registrations', { token: student.idToken });
    assert.equal(history.response.status, 200);
    assert.ok(history.body.data.some(item => item.id === registration.body.id));
    assert.equal((await request(`/api/activities/${activity.id}`, { token: student.idToken })).body.viewerRegistrationId, registration.body.id);
    assert.equal((await request(`/api/registrations/${registration.body.id}/cancel`, { token: student.idToken, method: 'PATCH' })).response.status, 200);
    assert.equal((await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken, method: 'POST' })).response.status, 201);
    const ownActivity = await createActivity(student.idToken, 'A Student also organizes this activity');
    await publishActivity(student.idToken, ownActivity.id);
    assert.equal((await request('/api/me/activities', { token: student.idToken })).response.status, 200);
    assert.equal((await request(`/api/activities/${ownActivity.id}/registrations`, { token: student.idToken })).response.status, 200);
    assert.equal((await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken })).response.status, 403);
    assert.equal((await request(`/api/activities/${activity.id}`, { token: student.idToken, method: 'PATCH', body: { title: 'Forbidden foreign edit' } })).response.status, 403);
    assert.equal((await request('/api/admin/organizer-requests', { token: student.idToken })).response.status, 403);
  });

  test('legacy Student Organizers recover access, but personal accounts, unenrolled school Organizers and Admins do not gain Student powers', async () => {
    assert.deepEqual((await request('/api/me', { token: apiUsers.organizer.idToken })).body.capabilities, { student: true, organizer: true });
    assert.equal((await request('/api/me/registrations', { token: apiUsers.organizer.idToken })).response.status, 200);
    const unenrolled = await createUser('ORGANIZER');
    await db.doc(`users/${unenrolled.uid}`).update({ universityId: null });
    const personal = await createUser('ORGANIZER', { domain: 'gmail.com' });
    for (const user of [unenrolled, personal, apiUsers.admin]) {
      assert.equal((await request('/api/me', { token: user.idToken })).body.capabilities.student, false);
      assert.equal((await request('/api/me/registrations', { token: user.idToken })).response.status, 403);
      assert.equal((await request('/api/activities/not-an-activity/registrations', { token: user.idToken, method: 'POST' })).response.status, 403);
    }
    const disabled = await createUser('ORGANIZER');
    await db.doc(`users/${disabled.uid}`).update({ accessStatus: 'DISABLED' });
    assert.equal((await request('/api/me/registrations', { token: disabled.idToken })).body.error.code, 'ACCOUNT_DISABLED');
  });

  test('Organizer request review still denies self-review and changed identities', async () => {
    const self = await createUser('STUDENT');
    const selfRequest = await request('/api/me/organizer-request', { token: self.idToken, method: 'POST', body: { organization: 'Self review club', reason: 'An access request before appointment as an Admin.' } });
    await db.doc(`users/${self.uid}`).update({ role: 'ADMIN' });
    assert.equal((await request(`/api/admin/organizer-requests/${selfRequest.body.id}`, { token: self.idToken, method: 'PATCH', body: { decision: 'APPROVE', revision: 1 } })).body.error.code, 'SELF_REVIEW_FORBIDDEN');
    const changed = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    const changedRequest = await request('/api/me/organizer-request', { token: changed.idToken, method: 'POST', body: { organization: 'Changed account', reason: 'A request that must not approve a different identity.' } });
    await auth.updateUser(changed.uid, { email: `changed-${randomUUID()}@gmail.com` });
    assert.equal((await request(`/api/admin/organizer-requests/${changedRequest.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'APPROVE', revision: 1 } })).body.error.code, 'APPLICANT_CHANGED');
    assert.equal((await db.doc(`users/${changed.uid}`).get()).exists, false);
  });

  test('all roles can edit only their own username while account identity and permissions stay intact', async () => {
    const personalOrganizer = await createUser('ORGANIZER', { domain: 'gmail.com' });
    const personalAdmin = await createUser('ADMIN', { domain: 'gmail.com' });
    for (const user of [apiUsers.student, apiUsers.organizer, apiUsers.admin, personalOrganizer, personalAdmin]) {
      const ref = db.doc(`users/${user.uid}`);
      const original = (await ref.get()).data();
      const previous = (await request('/api/me', { token: user.idToken })).body;
      const googleName = (await auth.getUser(user.uid)).displayName;
      const name = `Campus ${user.role.toLowerCase()} 👋`;
      const saved = await request('/api/me/profile', { token: user.idToken, method: 'PATCH', body: { name: `  ${name}  ` } });
      assert.equal(saved.response.status, 200, JSON.stringify(saved.body));
      assert.equal(saved.body.name, name);
      assert.deepEqual(saved.body.capabilities, previous.capabilities);
      assert.equal((await request('/api/me', { token: user.idToken })).body.name, name);
      const updated = (await ref.get()).data();
      const unchanged = data => Object.fromEntries(Object.entries(data).filter(([key]) => !['name', 'updatedAt'].includes(key)));
      assert.deepEqual(unchanged(updated), unchanged(original));
      assert.equal((await auth.getUser(user.uid)).displayName, googleName);
      for (const extra of [{ uid: apiUsers.otherStudent.uid }, { role: 'ADMIN' }, { email: 'forged@gmail.com' },
        { universityId: 'FORGED' }, { capabilities: { student: true, organizer: true } }, { accessStatus: 'ACTIVE' }]) {
        const denied = await request('/api/me/profile', { token: user.idToken, method: 'PATCH', body: { name: 'Must not save', ...extra } });
        assert.equal(denied.response.status, 400);
        assert.equal(denied.body.error.code, 'UNKNOWN_FIELD');
      }
      assert.equal((await ref.get()).data().name, name);
    }
    const foreign = (await db.doc(`users/${apiUsers.otherStudent.uid}`).get()).data();
    await request(`/api/me/profile?uid=${apiUsers.otherStudent.uid}`, { token: apiUsers.student.idToken, method: 'PATCH', body: { name: 'Student custom name' } });
    assert.deepEqual((await db.doc(`users/${apiUsers.otherStudent.uid}`).get()).data(), foreign);
    for (const name of [null, 42, {}, '', '  ', 'x'.repeat(81), 'line\nbreak', 'control\u0000character']) {
      const invalid = await request('/api/me/profile', { token: apiUsers.student.idToken, method: 'PATCH', body: { name } });
      assert.equal(invalid.response.status, 400);
      assert.equal(invalid.body.error.fieldErrors.name.length > 0, true);
    }
    assert.equal((await request('/api/me/profile', { method: 'PATCH', body: { name: 'Unauthenticated' } })).response.status, 401);
    const unprovisioned = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    assert.equal((await request('/api/me/profile', { token: unprovisioned.idToken, method: 'PATCH', body: { name: 'No profile bypass' } })).response.status, 403);
    const disabled = await createUser('STUDENT');
    await db.doc(`users/${disabled.uid}`).update({ accessStatus: 'DISABLED' });
    assert.equal((await request('/api/me/profile', { token: disabled.idToken, method: 'PATCH', body: { name: 'Disabled' } })).body.error.code, 'ACCOUNT_DISABLED');
    assert.equal((await request('/api/me/activities', { token: apiUsers.admin.idToken })).response.status, 403);

    const activity = await createActivity(apiUsers.organizer.idToken, 'Custom profile name projection');
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    assert.equal((await request(`/api/activities/${activity.id}`, { token: apiUsers.student.idToken })).body.organizerName, 'Campus organizer 👋');
    assert.equal((await request(`/api/activities/${activity.id}/registrations`, { token: apiUsers.student.idToken, method: 'POST' })).response.status, 201);
    const roster = await request(`/api/activities/${activity.id}/registrations`, { token: apiUsers.organizer.idToken });
    assert.equal(roster.body.data[0].participant.displayName, 'Student custom name');
    assert.equal((await request(`/api/activities/${activity.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { title: 'Admin still cannot edit events' } })).response.status, 403);
  });

  test('Admin appointment remains a trusted operator action and is idempotent', async () => {
    const person = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    const run = apply => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['appoint-admin.mjs', '--email', person.email, ...(apply ? ['--apply'] : [])], { cwd: new URL('../', import.meta.url), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { output += chunk; });
      child.once('error', reject); child.once('exit', code => resolve({ code, output }));
    });
    assert.equal((await run(false)).code, 0);
    assert.equal((await db.doc(`users/${person.uid}`).get()).exists, false);
    assert.equal((await run(true)).code, 0);
    assert.equal((await run(true)).code, 0);
    assert.equal((await request('/api/me', { token: person.idToken })).body.role, 'ADMIN');
    assert.equal((await db.collection('roleAssignments').where('uid', '==', person.uid).get()).size, 1);
    assert.equal((await request('/api/admin/summary', { token: person.idToken })).response.status, 200);
    await db.doc(`users/${person.uid}`).update({ accessStatus: 'DISABLED' });
    assert.equal((await request('/api/me', { token: person.idToken })).body.error.code, 'ACCOUNT_DISABLED');
    assert.equal((await request('/api/me/organizer-request', { token: person.idToken })).body.error.code, 'ACCOUNT_DISABLED');
  });

  test('draft assistance is Organizer-only, deterministic in emulators, bounded and never creates an activity', async () => {
    const organizer = await createUser('ORGANIZER', { domain: 'gmail.com' });
    const brief = { topic: 'Campus coding workshop', audience: 'MFU beginners', purpose: 'Learn to build a small program with a student club.', activityType: 'CLUB_ACTIVITY' };
    const call = (token, body = brief) => request('/api/me/activity-draft', { token, method: 'POST', body });
    assert.equal((await call()).response.status, 401);
    for (const token of [apiUsers.student.idToken, apiUsers.admin.idToken]) assert.equal((await call(token)).response.status, 403);
    const pending = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    assert.equal((await call(pending.idToken)).response.status, 403);
    const profile = (await db.doc(`users/${organizer.uid}`).get()).data();
    const first = await call(organizer.idToken), second = await call(organizer.idToken);
    assert.equal(first.response.status, 200);
    assert.equal(first.body.source, 'TEMPLATE');
    assert.deepEqual(first.body, second.body);
    assert.deepEqual(Object.keys(first.body.draft).sort(), ['activityType', 'description', 'title']);
    assert.equal(first.body.draft.activityType, 'CLUB_ACTIVITY');
    assert.deepEqual((await db.doc(`users/${organizer.uid}`).get()).data(), profile);
    assert.equal((await db.collection('activities').where('organizerId', '==', organizer.uid).get()).size, 0);
    assert.equal((await call(organizer.idToken, { ...brief, role: 'ADMIN' })).body.error.code, 'UNKNOWN_FIELD');
    assert.equal((await call(organizer.idToken, { ...brief, purpose: 'x' })).response.status, 400);
    assert.equal((await call(organizer.idToken)).response.status, 200);
    assert.equal((await call(organizer.idToken)).response.status, 429);
    // Existing enrolled MFU Organizers have both capabilities and can also draft.
    assert.equal((await call(apiUsers.organizer.idToken)).response.status, 200);
  });

  async function ticketFixture() {
    const student = await createUser('STUDENT');
    const activity = await createActivity(apiUsers.organizer.idToken, 'Ticket and attendance test activity');
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const registration = await request(`/api/activities/${activity.id}/registrations`, { token: student.idToken, method: 'POST' });
    assert.equal(registration.response.status, 201);
    return { student, activity, registration: registration.body };
  }
  const issue = fixture => request(`/api/registrations/${fixture.registration.id}/ticket`, { token: fixture.student.idToken, method: 'POST' });
  const verify = (activityId, code, token = apiUsers.organizer.idToken) => request(`/api/activities/${activityId}/tickets/verify`, { token, method: 'POST', body: { code } });
  const checkIn = (activityId, body, token = apiUsers.organizer.idToken) => request(`/api/activities/${activityId}/check-ins`, { token, method: 'POST', body });

  test('own ticket issuance is lazy, concurrent-idempotent and private for existing registrations', async () => {
    const fixture = await ticketFixture();
    assert.equal((await db.doc(`registrationTickets/${fixture.registration.id}`).get()).exists, false);
    const tickets = await Promise.all([issue(fixture), issue(fixture)]);
    assert.deepEqual(tickets.map(t => t.response.status).sort(), [200, 201]);
    assert.equal(tickets[0].body.qrValue === tickets[1].body.qrValue, true);
    const ticket = tickets[0].body;
    assert.equal(tickets[0].response.headers.get('cache-control'), 'no-store');
    assert.match(ticket.qrValue, /^CP1:[A-F0-9]{32}$/);
    assert.equal(ticket.qrValue.includes(fixture.student.uid), false);
    assert.equal(ticket.qrValue.includes(fixture.student.email), false);
    assert.equal(ticket.registration.id, fixture.registration.id);
    for (const token of [apiUsers.otherStudent.idToken, apiUsers.admin.idToken]) {
      assert.ok([403, 404].includes((await request(`/api/registrations/${fixture.registration.id}/ticket`, { token, method: 'POST' })).response.status));
    }
    const personal = await createUser('ORGANIZER', { domain: 'gmail.com' });
    assert.equal((await request(`/api/registrations/${fixture.registration.id}/ticket`, { token: personal.idToken, method: 'POST' })).response.status, 403);
    const history = await request('/api/me/registrations', { token: fixture.student.idToken });
    const roster = await request(`/api/activities/${fixture.activity.id}/registrations`, { token: apiUsers.organizer.idToken });
    assert.equal(JSON.stringify(history.body).includes(ticket.qrValue), false);
    assert.equal(JSON.stringify(roster.body).includes(ticket.code), false);
    assert.equal((await db.doc(`activities/${fixture.activity.id}`).get()).data().checkedInCount, 0);
  });

  test('ticket preview authorizes the event owner first and does not disclose wrong-event attendee details', async () => {
    const fixture = await ticketFixture(), ticket = (await issue(fixture)).body;
    const result = await verify(fixture.activity.id, ticket.qrValue);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.participant.email, fixture.student.email);
    assert.equal(result.body.alreadyCheckedIn, false);
    assert.equal((await db.doc(`registrations/${fixture.registration.id}`).get()).data().checkedInAt, undefined);
    for (const token of [fixture.student.idToken, apiUsers.admin.idToken, apiUsers.otherOrganizer.idToken]) {
      assert.equal((await verify(fixture.activity.id, ticket.qrValue, token)).response.status, 403);
      assert.equal((await checkIn(fixture.activity.id, { code: ticket.qrValue }, token)).response.status, 403);
    }
    const other = await createActivity(apiUsers.organizer.idToken); await publishActivity(apiUsers.organizer.idToken, other.id);
    const wrong = await verify(other.id, ticket.qrValue);
    assert.equal(wrong.body.error.code, 'TICKET_WRONG_EVENT');
    assert.equal(JSON.stringify(wrong.body).includes(fixture.student.email), false);
    assert.equal((await checkIn(other.id, { registrationId: fixture.registration.id })).body.error.code, 'TICKET_WRONG_EVENT');
    assert.equal((await verify(fixture.activity.id, 'not a ticket')).response.status, 400);
    assert.equal((await verify(fixture.activity.id, '0'.repeat(32))).response.status, 404);
  });

  test('QR check-in counts once, persists attendance, and cannot be undone through cancellation', async () => {
    const fixture = await ticketFixture(), ticket = (await issue(fixture)).body;
    const result = await checkIn(fixture.activity.id, { code: ticket.qrValue });
    assert.equal(result.response.status, 200);
    assert.equal(result.body.alreadyCheckedIn, false);
    assert.ok(result.body.registration.checkedInAt);
    assert.equal(result.body.activity.checkedInCount, 1);
    assert.equal(result.body.activity.registrationCount, 1);
    assert.equal('checkedInBy' in result.body.registration, false);
    const repeated = await checkIn(fixture.activity.id, { code: ticket.code });
    assert.equal(repeated.response.status, 200);
    assert.equal(repeated.body.alreadyCheckedIn, true);
    assert.equal(repeated.body.activity.checkedInCount, 1);
    const manualRepeat = await checkIn(fixture.activity.id, { registrationId: fixture.registration.id });
    assert.equal(manualRepeat.body.alreadyCheckedIn, true);
    const persisted = (await db.doc(`registrations/${fixture.registration.id}`).get()).data();
    assert.equal(persisted.checkedInBy, apiUsers.organizer.uid);
    assert.equal(persisted.checkInMethod, 'QR');
    assert.equal((await issue(fixture)).body.registration.checkedInAt, result.body.registration.checkedInAt);
    const cancel = await request(`/api/registrations/${fixture.registration.id}/cancel`, { token: fixture.student.idToken, method: 'PATCH' });
    assert.equal(cancel.response.status, 409);
    assert.equal(cancel.body.error.code, 'CANNOT_CANCEL_CHECKED_IN');
    assert.equal((await db.doc(`activities/${fixture.activity.id}`).get()).data().registrationCount, 1);
  });

  test('cancelled and replaced registrations invalidate old QR codes and cannot be manually checked in', async () => {
    const fixture = await ticketFixture(), old = (await issue(fixture)).body;
    const cancelled = await request(`/api/registrations/${fixture.registration.id}/cancel`, { token: fixture.student.idToken, method: 'PATCH' });
    assert.equal(cancelled.response.status, 200);
    assert.equal((await issue(fixture)).body.error.code, 'TICKET_CANCELLED');
    assert.equal((await verify(fixture.activity.id, old.qrValue)).body.error.code, 'TICKET_CANCELLED');
    assert.equal((await checkIn(fixture.activity.id, { registrationId: fixture.registration.id })).body.error.code, 'TICKET_CANCELLED');
    const second = await request(`/api/activities/${fixture.activity.id}/registrations`, { token: fixture.student.idToken, method: 'POST' });
    const newTicket = await issue({ ...fixture, registration: second.body });
    assert.equal(newTicket.response.status, 201);
    assert.equal(newTicket.body.qrValue === old.qrValue, false);
    assert.equal((await checkIn(fixture.activity.id, { code: old.qrValue })).body.error.code, 'TICKET_CANCELLED');
    assert.equal((await checkIn(fixture.activity.id, { code: newTicket.body.qrValue })).response.status, 200);
    assert.equal((await db.doc(`activities/${fixture.activity.id}`).get()).data().checkedInCount, 1);
  });

  test('concurrent QR/manual scans count the same attendee once, including old events without a counter', async () => {
    const fixture = await ticketFixture(), ticket = (await issue(fixture)).body;
    await db.doc(`activities/${fixture.activity.id}`).update({ checkedInCount: FieldValue.delete() });
    const results = await Promise.all(Array.from({ length: 6 }, (_, i) => checkIn(fixture.activity.id, i % 2 ? { code: ticket.code } : { registrationId: fixture.registration.id })));
    assert.ok(results.every(result => result.response.status === 200));
    assert.equal(results.filter(result => !result.body.alreadyCheckedIn).length, 1);
    assert.equal((await db.doc(`activities/${fixture.activity.id}`).get()).data().checkedInCount, 1);
  });

  test('cancellation/check-in races preserve registration locks, counts and attendance', async () => {
    const fixture = await ticketFixture();
    const results = await Promise.all([
      request(`/api/registrations/${fixture.registration.id}/cancel`, { token: fixture.student.idToken, method: 'PATCH' }),
      checkIn(fixture.activity.id, { registrationId: fixture.registration.id }),
    ]);
    assert.deepEqual(results.map(result => result.response.status).sort(), [200, 409]);
    const registration = (await db.doc(`registrations/${fixture.registration.id}`).get()).data();
    const activity = (await db.doc(`activities/${fixture.activity.id}`).get()).data();
    if (registration.status === 'CANCELLED') { assert.equal(activity.registrationCount, 0); assert.equal(activity.checkedInCount, 0); assert.equal(Boolean(registration.checkedInAt), false) }
    else { assert.equal(activity.registrationCount, 1); assert.equal(activity.checkedInCount, 1); assert.ok(registration.checkedInAt) }
  });

  test('closed registration still permits attendance; disabled attendees, drafts and forged fields are denied', async () => {
    const fixture = await ticketFixture(), ticket = (await issue(fixture)).body;
    await request(`/api/activities/${fixture.activity.id}`, { token: apiUsers.organizer.idToken, method: 'PATCH', body: { status: 'CLOSED' } });
    assert.equal((await checkIn(fixture.activity.id, { registrationId: fixture.registration.id, checkedInAt: '2020-01-01' })).body.error.code, 'UNKNOWN_FIELD');
    assert.equal((await checkIn(fixture.activity.id, { code: ticket.code, registrationId: fixture.registration.id })).response.status, 400);
    assert.equal((await checkIn(fixture.activity.id, { registrationId: fixture.registration.id })).response.status, 200);
    const disabled = await ticketFixture(), disabledTicket = (await issue(disabled)).body;
    await db.doc(`users/${disabled.student.uid}`).update({ accessStatus: 'DISABLED' });
    assert.equal((await verify(disabled.activity.id, disabledTicket.qrValue)).body.error.code, 'TICKET_UNAVAILABLE');
    const draft = await createActivity(apiUsers.organizer.idToken);
    assert.equal((await verify(draft.id, ticket.code)).body.error.code, 'CHECK_IN_UNAVAILABLE');
    assert.equal((await request(`/api/activities/${draft.id}`, { token: apiUsers.organizer.idToken, method: 'PATCH', body: { checkedInCount: 99 } })).body.error.code, 'UNKNOWN_FIELD');
  });

  async function facilitiesApi(fetchImpl, run, enabled = true) {
    const integration = createIntegration({ db, config: integrationConfig({ WEBHOOK_INBOUND_SECRET: testWebhookSecret }) });
    const facilities = createFacilities({ db, config: { enabled, key: 'isolated-creation-key', url: 'https://partner.example/api/partner/work-orders', timeZone: 'Asia/Bangkok', timeoutMs: 3000 }, fetchImpl });
    const server = createApp({ db, auth, integration, facilities, env: { FIREBASE_PROJECT_ID: projectId } }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const call = async (path, { token = apiUsers.organizer.idToken, method = 'GET', body } = {}) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { response, body: await response.json() };
    };
    try { await run(call) } finally { await new Promise(resolve => server.close(resolve)) }
  }
  async function facilityActivity() {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await changeActivity(activity.id, { facilitiesNotes: 'Projector and microphones before the workshop' });
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    return activity;
  }
  const creationReply = (payload, patch = {}, status = 201) => new Response(JSON.stringify({ success: true, duplicate: status === 200, workOrderId: randomUUID(), activityId: payload.activity_id, status: 'OPEN', ...patch }), { status });

  const changeActivity = (id, body) => request(`/api/activities/${id}`, { token: apiUsers.organizer.idToken, method: 'PATCH', body });
  const attend = (id, student) => request(`/api/activities/${id}/registrations`, { token: student.idToken, method: 'POST' });

  test('activity policy fields persist while facilities notes remain owner-only across projections', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    const values = { maxParticipants: 12, endDateTime: '2027-01-16T10:00:00Z', registrationDeadline: '2027-01-14T10:00:00Z', facilitiesNotes: 'Private projector setup notes' };
    assert.equal((await changeActivity(activity.id, values)).response.status, 200);
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const own = await request(`/api/activities/${activity.id}`, { token: apiUsers.organizer.idToken });
    assert.equal(own.body.facilitiesNotes, values.facilitiesNotes);
    assert.equal(own.body.maxParticipants, 12);
    for (const user of [apiUsers.student, apiUsers.otherOrganizer]) {
      const detail = await request(`/api/activities/${activity.id}`, { token: user.idToken });
      assert.equal(detail.body.facilitiesNotes, undefined);
      assert.equal((await request('/api/activities', { token: user.idToken })).body.data.some(item => 'facilitiesNotes' in item), false);
    }
    const admin = await request(`/api/admin/activities/${activity.id}`, { token: apiUsers.admin.idToken });
    assert.equal(admin.body.maxParticipants, 12); assert.equal(admin.body.facilitiesNotes, undefined);
    const provider = await request('/partner/activities?limit=50', { headers: { 'X-Partner-Key': testPartnerKey } });
    assert.equal(provider.body.data.some(item => 'facilitiesNotes' in item || 'maxParticipants' in item), false);
    const registered = await attend(activity.id, apiUsers.otherStudent);
    assert.equal(registered.response.status, 201);
    const ticket = await request(`/api/registrations/${registered.body.id}/ticket`, { token: apiUsers.otherStudent.idToken, method: 'POST' });
    assert.equal(ticket.body.activity.facilitiesNotes, undefined);
    assert.equal(ticket.body.activity.maxParticipants, 12);
  });

  test('invalid policy values and inconsistent merged edits cannot bypass server validation', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    for (const capacity of [0, -1, 1.5, '10', 100001, true]) assert.equal((await changeActivity(activity.id, { maxParticipants: capacity })).response.status, 400);
    for (const body of [
      { endDateTime: activity.dateTime }, { endDateTime: '2027-02-30T10:00:00Z' },
      { registrationDeadline: '2028-01-01T10:00:00Z' }, { facilitiesNotes: 'x'.repeat(2001) },
      { facilitiesNotes: 'bad\u0000note' }, { maintenanceStatus: 'COMPLETED' },
    ]) assert.equal((await changeActivity(activity.id, body)).response.status, 400);
    assert.equal((await changeActivity(activity.id, { endDateTime: '2027-01-16T10:00:00Z', registrationDeadline: '2027-01-14T10:00:00Z' })).response.status, 200);
    assert.equal((await changeActivity(activity.id, { dateTime: '2027-01-17T10:00:00Z' })).body.error.code, 'END_BEFORE_START');
    assert.equal((await changeActivity(activity.id, { dateTime: '2027-01-13T10:00:00Z' })).body.error.code, 'DEADLINE_AFTER_START');
    assert.equal((await changeActivity(activity.id, { endDateTime: null, registrationDeadline: null, maxParticipants: null, facilitiesNotes: null })).response.status, 200);
  });

  test('concurrent requests for the last seat cannot overbook and cancellation frees that seat', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await changeActivity(activity.id, { maxParticipants: 1 });
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const students = [await createUser('STUDENT'), await createUser('STUDENT')];
    const results = await Promise.all(students.map(student => attend(activity.id, student)));
    assert.deepEqual(results.map(item => item.response.status).sort(), [201, 409]);
    const winner = results.findIndex(item => item.response.status === 201), loser = 1 - winner;
    assert.equal(results[loser].body.error.code, 'ACTIVITY_FULL');
    assert.equal((await db.doc(`activities/${activity.id}`).get()).data().registrationCount, 1);
    assert.equal((await attend(activity.id, students[winner])).body.error.code, 'ALREADY_REGISTERED');
    assert.equal((await request(`/api/registrations/${results[winner].body.id}/cancel`, { token: students[winner].idToken, method: 'PATCH' })).response.status, 200);
    assert.equal((await attend(activity.id, students[loser])).response.status, 201);
    assert.equal((await db.doc(`activities/${activity.id}`).get()).data().registrationCount, 1);
  });

  test('deadline and ended-activity registration denial preserve cancellation and attendance paths', async () => {
    const fixture = await ticketFixture();
    await changeActivity(fixture.activity.id, { registrationDeadline: new Date(Date.now() - 60000).toISOString() });
    assert.equal((await attend(fixture.activity.id, apiUsers.student)).body.error.code, 'REGISTRATION_DEADLINE_PASSED');
    assert.equal((await issue(fixture)).response.status, 201);
    assert.equal((await checkIn(fixture.activity.id, { registrationId: fixture.registration.id })).response.status, 200);
    const expired = await createActivity(apiUsers.organizer.idToken);
    await changeActivity(expired.id, { dateTime: '2020-01-01T10:00:00Z', endDateTime: '2020-01-01T12:00:00Z' });
    await publishActivity(apiUsers.organizer.idToken, expired.id);
    assert.equal((await attend(expired.id, apiUsers.student)).body.error.code, 'REGISTRATION_CLOSED');
    const cancellable = await ticketFixture();
    await changeActivity(cancellable.activity.id, { registrationDeadline: new Date(Date.now() - 60000).toISOString() });
    assert.equal((await request(`/api/registrations/${cancellable.registration.id}/cancel`, { token: cancellable.student.idToken, method: 'PATCH' })).response.status, 200);
  });

  test('capacity reduction racing a registration preserves the limit and rejects a limit below active attendance', async () => {
    const fixture = await ticketFixture();
    await changeActivity(fixture.activity.id, { maxParticipants: 2 });
    const results = await Promise.all([changeActivity(fixture.activity.id, { maxParticipants: 1 }), attend(fixture.activity.id, await createUser('STUDENT'))]);
    const stored = (await db.doc(`activities/${fixture.activity.id}`).get()).data();
    assert.ok(stored.registrationCount <= stored.maxParticipants);
    assert.ok(results.some(item => item.response.status === 409));
    await changeActivity(fixture.activity.id, { maxParticipants: null });
    const second = await attend(fixture.activity.id, await createUser('STUDENT'));
    assert.equal(second.response.status, 201);
    assert.equal((await changeActivity(fixture.activity.id, { maxParticipants: 1 })).body.error.code, 'CAPACITY_BELOW_REGISTRATIONS');
  });

  test('only trusted links expose secret-verified maintenance updates and stale or duplicate deliveries cannot regress them', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken);
    await changeActivity(activity.id, { facilitiesNotes: 'Projector setup' });
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const workOrderId = randomUUID();
    const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt: '2026-11-06T01:00:00Z', data: { workOrderId, toStatus: 'ASSIGNED', activityId: activity.id } };
    const webhook = body => request('/webhooks/partner', { method: 'POST', headers: { 'X-Webhook-Secret': testWebhookSecret }, body });
    assert.equal((await webhook(event)).response.status, 201);
    const status = () => request(`/api/activities/${activity.id}/maintenance`, { token: apiUsers.organizer.idToken });
    assert.equal((await status()).body.workOrder, null, 'A payload-supplied activity ID must not establish a link');
    assert.equal((await bindMaintenanceWorkOrder(db, { activityId: activity.id, workOrderId })).dryRun, true);
    assert.equal((await db.doc(`maintenanceBindings/${activity.id}`).get()).exists, false);
    await bindMaintenanceWorkOrder(db, { activityId: activity.id, workOrderId }, true);
    const before = (await status()).body;
    assert.equal(before.workOrder.status, 'ASSIGNED'); assert.equal(before.webhookConfigured, true);
    for (const user of [apiUsers.student, apiUsers.admin, apiUsers.otherOrganizer]) assert.equal((await request(`/api/activities/${activity.id}/maintenance`, { token: user.idToken })).response.status, 403);
    assert.equal((await webhook(event)).response.status, 200);
    assert.equal((await status()).body.workOrder.receivedAt, before.workOrder.receivedAt);
    assert.equal((await webhook({ ...event, id: randomUUID(), occurredAt: '2026-11-05T01:00:00Z', data: { workOrderId, toStatus: 'OPEN' } })).response.status, 201);
    assert.equal((await status()).body.workOrder.status, 'ASSIGNED');
    await webhook({ ...event, id: randomUUID(), data: { workOrderId, toStatus: 'OPEN' } });
    assert.equal((await status()).body.workOrder.needsReview, true);
    assert.equal((await status()).body.workOrder.status, null);
    await webhook({ ...event, id: randomUUID(), occurredAt: '2026-11-06T02:00:00Z', data: { workOrderId, toStatus: 'IN_PROGRESS' } });
    assert.equal((await status()).body.workOrder.status, 'IN_PROGRESS');
    const rejected = await request('/webhooks/partner', { method: 'POST', headers: { 'X-Webhook-Secret': 'wrong' }, body: { ...event, id: randomUUID(), occurredAt: '2026-11-06T03:00:00Z', data: { workOrderId, toStatus: 'COMPLETED' } } });
    assert.equal(rejected.response.status, 401);
    assert.equal((await status()).body.workOrder.status, 'IN_PROGRESS');
    assert.equal((await webhook({ ...event, id: randomUUID(), data: { workOrderId, toStatus: '<script>' } })).response.status, 201);
    assert.equal((await status()).body.workOrder.status, 'IN_PROGRESS');
    assert.equal((await request(`/api/activities/${activity.id}/maintenance`, { token: apiUsers.organizer.idToken, method: 'PATCH', body: { workOrderId } })).response.status, 404);
  });

  test('maintenance binding is unique, idempotent and limited to existing published or closed activities', async () => {
    const first = await createActivity(apiUsers.organizer.idToken), second = await createActivity(apiUsers.organizer.idToken);
    const workOrderId = randomUUID();
    await assert.rejects(bindMaintenanceWorkOrder(db, { activityId: first.id, workOrderId }, true), /MAINTENANCE_REQUIRES_PUBLISHED/);
    await publishActivity(apiUsers.organizer.idToken, first.id); await publishActivity(apiUsers.organizer.idToken, second.id);
    const results = await Promise.allSettled([first, second].map(activity => bindMaintenanceWorkOrder(db, { activityId: activity.id, workOrderId }, true)));
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
    assert.match(results.find(item => item.status === 'rejected').reason.message, /MAINTENANCE_LINK_CONFLICT/);
    const winning = results[0].status === 'fulfilled' ? first : second;
    assert.equal((await bindMaintenanceWorkOrder(db, { activityId: winning.id, workOrderId }, true)).unchanged, true);
    await assert.rejects(bindMaintenanceWorkOrder(db, { activityId: winning.id, workOrderId: randomUUID() }, true), /MAINTENANCE_LINK_CONFLICT/);
    await assert.rejects(bindMaintenanceWorkOrder(db, { activityId: 'missing-activity', workOrderId }, true), /NOT_FOUND/);
  });

  test('local maintenance test configuration accepts authenticated updates without any outbound work', async () => {
    const secret = `isolated-local-mode-${randomUUID()}`;
    const env = localIntegrationEnvironment({ WEBHOOK_INBOUND_SECRET: secret, PARTNER_WEBHOOK_URL: 'https://partner.example/webhook', WEBHOOK_OUTBOUND_SECRET: 'fixture-outbound-key-1234567890123456789', PARTNER_API_URL: 'https://partner.example/health' }, { maintenanceTest: true });
    let externalCalls = 0;
    const integration = createIntegration({ db, config: integrationConfig(env), fetchImpl: () => { externalCalls++; throw new Error('External requests forbidden in tests') } });
    const workOrderId = randomUUID();
    const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt: new Date().toISOString(), data: { workOrderId, fromStatus: 'OPEN', toStatus: 'ASSIGNED' } };
    await assert.rejects(integration.receive('wrong-secret', event, 'isolated-mode-rejected'), /INVALID_WEBHOOK_SECRET/);
    assert.equal((await integration.receive(secret, event, 'isolated-mode-accepted')).status, 201);
    assert.equal((await integration.receive(secret, event, 'isolated-mode-duplicate')).status, 200);
    await integration.tick();
    assert.equal(externalCalls, 0);
    assert.equal(integration.maintenanceWebhookEnabled, true);
    assert.equal((await db.doc(`webhookInbox/${event.id}`).get()).data().secretVerified, true);
  });

  test('facilities requests require owner authorization, explicit current preview and supported fields', async () => {
    const activity = await facilityActivity(); let calls = 0;
    await facilitiesApi(async (_url, options) => { calls++; return creationReply(JSON.parse(options.body)) }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`;
      for (const user of [apiUsers.student, apiUsers.admin, apiUsers.otherOrganizer]) {
        assert.equal((await call(path + '/preview', { token: user.idToken })).response.status, 403);
        assert.equal((await call(path + '/requests', { token: user.idToken, method: 'POST', body: { category: 'Electrical', revision: 'a'.repeat(64) } })).response.status, 403);
      }
      const preview = await call(path + '/preview');
      assert.equal(preview.body.payload.description, 'Projector and microphones before the workshop');
      const body = { category: 'Electrical', revision: preview.body.revision };
      assert.equal((await call(path + '/requests', { method: 'POST', body: { ...body, workOrderId: 'forged' } })).response.status, 400);
      await changeActivity(activity.id, { facilitiesNotes: 'Changed requirements after preview' });
      assert.equal((await call(path + '/requests', { method: 'POST', body })).body.error.code, 'FACILITIES_STALE_PREVIEW');
      assert.equal(calls, 0);
    });
    await facilitiesApi(() => { throw new Error('No outbound call allowed') }, async call => {
      const preview = await call(`/api/activities/${activity.id}/maintenance/preview`);
      assert.equal((await call(`/api/activities/${activity.id}/maintenance/requests`, { method: 'POST', body: { category: 'Electrical', revision: preview.body.revision } })).response.status, 503);
    }, false);
  });

  test('concurrent facilities sends create one stable partner request and atomically link its verified receipt', async () => {
    const activity = await facilityActivity(); let calls = 0, release;
    const gate = new Promise(resolve => { release = resolve });
    await facilitiesApi(async (_url, options) => {
      calls++; assert.equal(options.headers['X-Partner-Key'], 'isolated-creation-key'); assert.match(options.headers['Idempotency-Key'], /^[a-f0-9-]{36}$/);
      assert.equal(options.redirect, 'error'); await gate;
      return creationReply(JSON.parse(options.body));
    }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const sending = call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      while (!calls) await new Promise(resolve => setTimeout(resolve, 5));
      const concurrent = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(concurrent.response.status, 202); assert.equal(concurrent.body.state, 'SENDING');
      release(); const sent = await sending;
      assert.equal(sent.body.state, 'SENT'); assert.equal(calls, 1); assert.equal(sent.body.idempotencyKey, undefined);
      const status = (await call(path)).body;
      assert.equal(status.workOrder.id, sent.body.workOrderId); assert.equal(status.workOrder.status, 'OPEN');
      const binding = (await db.doc(`maintenanceBindings/${activity.id}`).get()).data();
      assert.equal(binding.source, 'TEAM10_CREATION_RESPONSE');
      const repeat = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(repeat.body.workOrderId, sent.body.workOrderId); assert.equal(calls, 1);
    });
  });

  test('uncertain facilities results retry the original snapshot and key after activity edits', async () => {
    const activity = await facilityActivity(), keys = [], payloads = []; let calls = 0;
    await facilitiesApi(async (_url, options) => {
      keys.push(options.headers['Idempotency-Key']); payloads.push(options.body); calls++;
      if (calls === 1) throw new Error('fixture connection lost after remote creation');
      return creationReply(JSON.parse(options.body), {}, 200);
    }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`;
      let preview = (await call(path + '/preview')).body;
      const first = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(first.body.state, 'RETRYABLE'); assert.equal(first.body.error, 'FACILITIES_RESULT_UNCERTAIN');
      await changeActivity(activity.id, { facilitiesNotes: 'Edited after uncertain result' });
      preview = (await call(path + '/preview')).body;
      assert.equal(preview.previousAttempt, true); assert.match(preview.payload.description, /Projector/);
      const retry = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(retry.body.state, 'SENT'); assert.equal(retry.body.duplicate, true);
      assert.equal(keys[0], keys[1]); assert.equal(payloads[0], payloads[1]);
    });
  });

  test('invalid partner correlation cannot link a work order or overwrite an existing association', async () => {
    const activity = await facilityActivity();
    await facilitiesApi(async (_url, options) => creationReply(JSON.parse(options.body), { activityId: 'foreign-activity' }), async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const result = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(result.body.error, 'FACILITIES_INVALID_RESPONSE');
      assert.equal((await db.doc(`maintenanceBindings/${activity.id}`).get()).exists, false);
    });
    const other = await facilityActivity(), sharedOrder = randomUUID();
    await bindMaintenanceWorkOrder(db, { activityId: other.id, workOrderId: sharedOrder }, true);
    await facilitiesApi(async (_url, options) => creationReply(JSON.parse(options.body), { workOrderId: sharedOrder }), async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const result = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(result.body.state, 'REVIEW_REQUIRED'); assert.equal(result.body.error, 'FACILITIES_LINK_CONFLICT');
      assert.equal((await db.doc(`maintenanceBindings/${activity.id}`).get()).exists, false);
      assert.equal((await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } })).response.status, 409);
    });
  });

  test('missing creation endpoint records safe HTTP diagnostics and preserves the retry identity', async () => {
    const activity = await facilityActivity(), keys = [], payloads = [];
    await facilitiesApi(async (_url, options) => {
      keys.push(options.headers['Idempotency-Key']); payloads.push(options.body);
      return new Response('Missing route; private partner content', { status: 404 });
    }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const body = { category: 'Electrical', revision: preview.revision };
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await call(path + '/requests', { method: 'POST', body });
        assert.equal(result.body.state, 'RETRYABLE');
        assert.equal(result.body.error, 'FACILITIES_PARTNER_NOT_FOUND');
        assert.equal(result.body.partnerHttpStatus, undefined);
      }
      const stored = (await db.doc(`facilitiesRequests/${activity.id}`).get()).data();
      assert.equal(stored.partnerHttpStatus, 404);
      assert.equal(stored.attempts, 2);
      assert.equal(JSON.stringify(stored).includes('private partner content'), false);
      assert.equal((await db.doc(`maintenanceBindings/${activity.id}`).get()).exists, false);
      assert.equal(keys[0], keys[1]); assert.equal(payloads[0], payloads[1]);
    });
  });

  test('definitive partner rejection stops retries without claiming a work order', async () => {
    const activity = await facilityActivity(); let calls = 0;
    await facilitiesApi(async () => { calls++; return new Response(JSON.stringify({ error: 'Invalid facilities details' }), { status: 422 }) }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const body = { category: 'Electrical', revision: preview.revision };
      const result = await call(path + '/requests', { method: 'POST', body });
      assert.equal(result.body.state, 'REVIEW_REQUIRED');
      assert.equal(result.body.error, 'FACILITIES_PARTNER_REJECTED');
      assert.equal((await call(path)).body.workOrder, null);
      assert.equal((await call(path + '/requests', { method: 'POST', body })).response.status, 409);
      assert.equal(calls, 1);
    });
  });

  test('a signed status received before the creation receipt is preserved on automatic linking', async () => {
    const activity = await facilityActivity(), workOrderId = randomUUID();
    const integration = createIntegration({ db, config: integrationConfig({ WEBHOOK_INBOUND_SECRET: testWebhookSecret, WEBHOOK_REQUIRE_HMAC: 'true' }) });
    await facilitiesApi(async (_url, options) => {
      const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt: '2026-11-06T10:00:00.000Z', sequence: 3, version: 3,
        data: { workOrderId, toStatus: 'IN_PROGRESS', sequence: 3, version: 3, activityId: 'ignored-foreign-id' } };
      const rawBody = Buffer.from(JSON.stringify(event));
      await integration.receive(testWebhookSecret, event, 'fixture-early-webhook', { rawBody, signature: 'sha256=' + createHmac('sha256', testWebhookSecret).update(rawBody).digest('hex'), eventId: event.id, sequence: '3', version: '3' });
      return creationReply(JSON.parse(options.body), { workOrderId });
    }, async call => {
      const path = `/api/activities/${activity.id}/maintenance`, preview = (await call(path + '/preview')).body;
      const result = await call(path + '/requests', { method: 'POST', body: { category: 'Electrical', revision: preview.revision } });
      assert.equal(result.body.state, 'SENT');
      assert.equal((await call(path)).body.workOrder.status, 'IN_PROGRESS');
      assert.equal((await db.doc('maintenanceBindings/ignored-foreign-id').get()).exists, false);
    });
  });

  test('signed HTTP webhooks verify raw bytes and monotonic lifecycle versions before updating status', async () => {
    const activity = await facilityActivity(), workOrderId = randomUUID();
    await bindMaintenanceWorkOrder(db, { activityId: activity.id, workOrderId }, true);
    const send = async (sequence, status, occurredAt, overrides = {}) => {
      const event = { id: randomUUID(), type: 'maintenance.status_changed', occurredAt, sequence, version: sequence, data: { workOrderId, toStatus: status, sequence, version: sequence, activityId: 'untrusted-correlation' } };
      const raw = JSON.stringify(event, null, 2);
      const response = await fetch(`${baseUrl}/webhooks/partner`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': testWebhookSecret,
        'X-Webhook-Signature': 'sha256=' + createHmac('sha256', testWebhookSecret).update(raw).digest('hex'), 'X-Event-ID': event.id, 'X-Event-Sequence': String(sequence), 'X-Event-Version': String(sequence), ...overrides }, body: raw });
      return { response, body: await response.json(), event, raw };
    };
    const first = await send(3, 'IN_PROGRESS', '2026-11-06T09:00:00.000Z'); assert.equal(first.response.status, 201);
    await send(2, 'ASSIGNED', '2026-11-06T10:00:00.000Z');
    const status = async () => (await request(`/api/activities/${activity.id}/maintenance`, { token: apiUsers.organizer.idToken })).body.workOrder.status;
    assert.equal(await status(), 'IN_PROGRESS');
    assert.equal((await send(4, 'RESOLVED', '2026-11-06T08:00:00.000Z')).response.status, 201);
    assert.equal(await status(), 'RESOLVED');
    const bad = await send(5, 'CLOSED', '2026-11-06T11:00:00.000Z', { 'X-Webhook-Signature': 'sha256=bad' });
    assert.equal(bad.response.status, 401); assert.equal(await status(), 'RESOLVED');
    assert.equal((await send(5, 'CLOSED', '2026-11-06T07:00:00.000Z')).response.status, 201);
    assert.equal(await status(), 'CLOSED');
    assert.equal((await db.doc(`webhookInbox/${first.event.id}`).get()).data().authentication, 'HMAC_SHA256');
  });

  const aiApplication = { organization: 'Independent campus organizer', reason: 'I will organize a beginner coding workshop for MFU students to learn programming. I will prepare materials, coordinate volunteers and manage registration.' };
  const aiPass = () => ({ summary: 'Specific campus purpose and responsibilities are clear.', criteria: {
    campusActivity: { met: true, evidence: 'beginner coding workshop' }, purposeAndAudience: { met: true, evidence: 'MFU students to learn programming' },
    organizerIdentity: { met: true, evidence: 'Independent campus organizer' }, responsibility: { met: true, evidence: 'prepare materials, coordinate volunteers and manage registration' },
  }, consistent: true, safe: true, concerns: [] });
  const aiReply = value => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }));
  async function withAiApi(fetchImpl, run, autoApprove = true, now = Date.now) {
    const config = { enabled: true, apiKey: 'isolated-ai-key', model: 'test/model', timeoutMs: 2000, autoApprove };
    const integration = createIntegration({ db, config: integrationConfig({}) });
    const server = createApp({ db, auth, integration, organizerAdmission: createOrganizerAdmission({ db, auth, config, fetchImpl, now }), planningAssistant: createPlanningAssistant({ config, fetchImpl }), env: { FIREBASE_PROJECT_ID: projectId } }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const call = async (path, { token, method = 'POST', body } = {}) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { response, body: await response.json() };
    };
    try { await run(call) } finally { await new Promise(resolve => server.close(resolve)) }
  }
  test('AI admission approves a qualifying personal Google account without granting Student or Admin powers', async () => {
    const user = await createUser('APPLICANT', { provisioned: false, domain: 'gmail.com' });
    await withAiApi(async () => aiReply(aiPass()), async call => {
      const result = await call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
      assert.equal(result.response.status, 201); assert.equal(result.body.status, 'APPROVED'); assert.equal(result.body.decisionSource, 'AI');
      assert.equal(result.body.aiReview.status, 'AUTO_APPROVED'); assert.equal(result.body.aiReview.leaseId, undefined);
      const me = await request('/api/me', { token: user.idToken });
      assert.equal(me.body.role, 'ORGANIZER'); assert.deepEqual(me.body.capabilities, { student: false, organizer: true });
      assert.equal((await request('/api/admin/organizer-requests', { token: user.idToken })).response.status, 403);
      const decisions = await db.collection('organizerRequestDecisions').where('applicantId', '==', user.uid).get();
      assert.equal(decisions.size, 1); assert.equal(decisions.docs[0].data().source, 'AI');
    });
  });
  test('AI promotion preserves enrolled Student identity, registration data and both workspaces', async () => {
    const user = await createUser('STUDENT'), activity = await createActivity(apiUsers.organizer.idToken);
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    const registered = await request(`/api/activities/${activity.id}/registrations`, { token: user.idToken, method: 'POST' });
    const before = (await db.doc(`users/${user.uid}`).get()).data();
    await withAiApi(async () => aiReply(aiPass()), async call => {
      assert.equal((await call('/api/me/organizer-request', { token: user.idToken, body: aiApplication })).body.status, 'APPROVED');
      const me = (await request('/api/me', { token: user.idToken })).body;
      assert.equal(me.universityId, before.universityId); assert.equal(me.name, before.name);
      assert.deepEqual(me.capabilities, { student: true, organizer: true });
      assert.equal((await db.doc(`registrations/${registered.body.id}`).get()).data().status, 'ACTIVE');
    });
  });
  test('incomplete, unavailable and disabled auto-approval paths remain pending and Admin can decide', async () => {
    const incomplete = aiPass(); incomplete.criteria.responsibility = { met: false, evidence: '' }; incomplete.concerns = ['Organizing responsibility is missing.'];
    for (const mode of ['incomplete', 'unavailable', 'disabled']) {
      const user = await createUser('APPLICANT', { provisioned: false, domain: 'gmail.com' });
      await withAiApi(async () => { if (mode === 'unavailable') throw new Error('fixture network failure'); return aiReply(mode === 'incomplete' ? incomplete : aiPass()) }, async call => {
        const result = await call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
        assert.equal(result.body.status, 'PENDING'); assert.equal(result.body.aiReview.status, 'MANUAL_REVIEW');
        assert.equal((await db.doc(`users/${user.uid}`).get()).exists, false);
        const approved = await request(`/api/admin/organizer-requests/${result.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'APPROVE', revision: result.body.revision } });
        assert.equal(approved.body.decisionSource, 'ADMIN'); assert.equal(approved.body.status, 'APPROVED');
      }, mode !== 'disabled');
    }
  });
  test('duplicate submissions share one review and a late AI result cannot overwrite Admin rejection', async () => {
    const user = await createUser('APPLICANT', { provisioned: false, domain: 'gmail.com' }); let calls = 0, release;
    const gate = new Promise(resolve => { release = resolve });
    await withAiApi(async () => { calls++; await gate; return aiReply(aiPass()) }, async call => {
      const first = call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
      while (!calls) await new Promise(resolve => setTimeout(resolve, 5));
      const duplicate = await call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
      assert.equal(duplicate.response.status, 200); assert.equal(duplicate.body.aiReview.status, 'PROCESSING'); assert.equal(calls, 1);
      await request(`/api/admin/organizer-requests/${duplicate.body.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'REJECT', revision: 1, reason: 'Please clarify your campus connection.' } });
      release(); const final = await first;
      assert.equal(final.body.status, 'REJECTED'); assert.equal(final.body.decisionSource, 'ADMIN');
      assert.equal((await db.doc(`users/${user.uid}`).get()).exists, false);
    });
  });
  test('AI result is discarded after resubmission and a changed account cannot be promoted', async () => {
    for (const mode of ['resubmit', 'disabled']) {
      const user = await createUser('APPLICANT', { provisioned: false, domain: 'gmail.com' }); let calls = 0, release;
      const gate = new Promise(resolve => { release = resolve });
      await withAiApi(async () => { calls++; if (calls === 1) { await gate; return aiReply(aiPass()) } throw new Error('Second revision requires Admin') }, async call => {
        const first = call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
        while (!calls) await new Promise(resolve => setTimeout(resolve, 5));
        const pending = (await request('/api/me/organizer-request', { token: user.idToken })).body.request;
        if (mode === 'resubmit') {
          await request(`/api/admin/organizer-requests/${pending.id}`, { token: apiUsers.admin.idToken, method: 'PATCH', body: { decision: 'REJECT', revision: 1, reason: 'Please clarify.' } });
          const second = await call('/api/me/organizer-request', { token: user.idToken, body: { ...aiApplication, reason: aiApplication.reason + ' Updated application.' } });
          assert.equal(second.body.revision, 2); assert.equal(second.body.status, 'PENDING');
        } else await auth.updateUser(user.uid, { disabled: true });
        release(); const final = await first;
        assert.equal(final.body.status, 'PENDING');
        if (mode === 'resubmit') assert.equal(final.body.revision, 2);
        assert.equal((await db.doc(`users/${user.uid}`).get()).exists, false);
      });
    }
  });
  test('an expired AI processing deadline cannot approve an otherwise qualifying application', async () => {
    const user = await createUser('APPLICANT', { provisioned: false, domain: 'gmail.com' }); let clock = Date.now();
    await withAiApi(async () => { clock += 46000; return aiReply(aiPass()) }, async call => {
      const result = await call('/api/me/organizer-request', { token: user.idToken, body: aiApplication });
      assert.equal(result.body.status, 'PENDING'); assert.equal(result.body.aiReview.reason, 'REVIEW_EXPIRED');
      assert.equal((await db.doc(`users/${user.uid}`).get()).exists, false);
    }, true, () => clock);
  });
  test('planning endpoint guards roles and returns server-validated structured plans or templates', async () => {
    const brief = { topic: 'Campus coding workshop', audience: 'MFU students', purpose: 'Learn programming through practical exercises.', activityType: 'EVENT', durationMinutes: 120, participants: 50 };
    const plan = { title: brief.topic, description: brief.purpose, agenda: [{ title: 'Exercises and questions', minutes: 120 }], checklist: { before: ['Prepare exercises'], during: ['Support participants'], after: ['Collect feedback'] }, facilities: ['Suggested projector; confirm availability'], assumptions: ['Equipment availability is unconfirmed.'] };
    await withAiApi(async () => aiReply(plan), async call => {
      for (const user of [apiUsers.student, apiUsers.admin]) assert.equal((await call('/api/me/activity-plan', { token: user.idToken, body: brief })).response.status, 403);
      assert.equal((await call('/api/me/activity-plan', { token: apiUsers.organizer.idToken, body: { ...brief, durationMinutes: -1 } })).response.status, 400);
      const result = await call('/api/me/activity-plan', { token: apiUsers.organizer.idToken, body: brief });
      assert.equal(result.body.source, 'AI'); assert.equal(result.body.plan.agenda[0].endMinute, 120); assert.match(result.body.plan.draft.description, /Preparation checklist/);
    });
  });


  async function withLibraryApi(run, options = {}) {
    const library = createLibrary({ config: { enabled: options.enabled !== false, baseUrl: 'https://library.test', key: 'isolated-library-key', timeoutMs: 1000 }, aiConfig: { enabled: options.aiEnabled !== false, apiKey: 'isolated-ai-key', model: 'test/model', timeoutMs: 1000 }, fetchImpl: options.fetchImpl || libraryFetch, aiFetchImpl: options.aiFetchImpl || libraryAiFetch });
    const integration = createIntegration({ db, config: integrationConfig({}), fetchImpl: () => { throw new Error('External requests forbidden') } });
    const server = createApp({ db, auth, integration, library, env: { FIREBASE_PROJECT_ID: projectId } }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const call = async (activityId, { token = apiUsers.student.idToken, query = '', body, suggest = false, relevance = false } = {}) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/activities/${activityId}/library-resources${suggest ? '/suggest' : relevance ? '/relevance' : ''}${query}`, { method: suggest ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(suggest ? { 'Content-Type': 'application/json' } : {}) }, ...(suggest ? { body: JSON.stringify(body ?? {}) } : {}) });
      return { response, body: await response.json() };
    };
    try { await run(call) } finally { await new Promise(resolve => server.close(resolve)) }
  }
  test('Library resources require Student capability and a visible activity before any provider request', async () => {
    const draft = await createActivity(apiUsers.organizer.idToken, 'Python library access check');
    const active = await createActivity(apiUsers.organizer.idToken, 'Python learning workshop');
    await publishActivity(apiUsers.organizer.idToken, active.id);
    const dual = await createUser('ORGANIZER'), personal = await createUser('ORGANIZER', { domain: 'gmail.com' });
    let calls = 0;
    await withLibraryApi(async call => {
      assert.equal((await call(active.id, { token: '' })).response.status, 401);
      for (const token of [apiUsers.admin.idToken, personal.idToken]) {
        assert.equal((await call(active.id, { token })).response.status, 403);
        assert.equal((await call(active.id, { token, suggest: true })).response.status, 403);
        assert.equal((await call(active.id, { token, relevance: true })).response.status, 403);
      }
      assert.equal((await call(draft.id)).response.status, 404);
      assert.equal((await call('not-found', { suggest: true })).response.status, 404);
      assert.equal(calls, 0);
      for (const token of [apiUsers.student.idToken, dual.idToken]) {
        const result = await call(active.id, { token, query: '?q=Python' });
        assert.equal(result.response.status, 200); assert.equal(result.response.headers.get('cache-control'), 'no-store'); assert.equal(result.body.resources.length, 4);
      }
      assert.equal(calls, 2);
    }, { fetchImpl: async (...args) => { calls++; return libraryFetch(...args) } });
  });
  test('Library AI search uses only server-loaded public text; manual paging and fail-closed outcomes are honest', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken, 'Beginner Python workshop');
    await db.doc(`activities/${activity.id}`).update({ facilitiesNotes: 'Private facilities notes never sent' });
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    await withLibraryApi(async call => {
      const result = await call(activity.id, { suggest: true });
      assert.equal(result.body.search.source, 'AI'); assert.equal(result.body.search.query, 'Python'); assert.equal(result.body.resources[0].title, 'Python resource 1');
      assert.equal((await call(activity.id, { query: '?q=Python&page=2' })).body.resources.length, 2);
      assert.equal((await call(activity.id, { query: '?q=no-match' })).body.pagination.total, 0);
      for (const query of ['?q=a&q=b', '?page=0', '?url=https://other.test']) assert.equal((await call(activity.id, { query })).response.status, 400);
      assert.equal((await call(activity.id, { suggest: true, body: { title: 'Untrusted replacement', uid: 'another-user' } })).response.status, 400);
      const failure = await call(activity.id, { query: '?q=unavailable' });
      assert.equal(failure.response.status, 503); assert.equal(failure.body.error.code, 'LIBRARY_UNAVAILABLE'); assert.equal(JSON.stringify(failure.body).includes('private provider details'), false);
      assert.equal((await call(activity.id, { query: '?q=malformed' })).response.status, 502);
    }, { aiFetchImpl: async (url, options) => {
      const input = JSON.parse(JSON.parse(options.body).messages[1].content);
      assert.deepEqual(input, { title: activity.title, description: activity.description });
      return libraryAiFetch(url, options);
    } });
    await withLibraryApi(async call => {
      const result = await call(activity.id, { suggest: true });
      assert.equal(result.response.status, 503); assert.equal(result.body.error.code, 'LIBRARY_RELEVANCE_UNAVAILABLE');
      assert.equal((await call(activity.id, { relevance: true })).body.eligible, false);
      assert.equal((await call(activity.id, { query: '?q=Python' })).response.status, 200);
    }, { aiEnabled: false });
    await withLibraryApi(async call => {
      const result = await call(activity.id, { suggest: true });
      assert.equal(result.response.status, 503); assert.equal(result.body.error.code, 'LIBRARY_NOT_CONFIGURED');
    }, { enabled: false, aiFetchImpl: () => { throw new Error('AI must not be called') } });
  });
  test('Library relevance gates direct suggestions, invalidates after edits and keeps catalog reads explicit', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken, 'Fresher Welcome for Burmese Students');
    await db.doc(`activities/${activity.id}`).update({ description: 'Welcome' });
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    let reads = 0, assessments = 0;
    await withLibraryApi(async call => {
      const social = await call(activity.id, { relevance: true });
      assert.equal(social.body.status, 'NOT_RELEVANT'); assert.equal(social.body.eligible, false);
      assert.equal(social.response.headers.get('cache-control'), 'no-store');
      assert.equal((await call(activity.id, { suggest: true })).response.status, 409);
      assert.equal(reads, 0); assert.equal(assessments, 1);
      await db.doc(`activities/${activity.id}`).update({ title: 'Python workshop', description: 'Learn Python with exercises.' });
      const educational = await call(activity.id, { relevance: true });
      assert.equal(educational.body.eligible, true); assert.equal(reads, 0); assert.equal(assessments, 2);
      assert.equal((await call(activity.id, { suggest: true })).response.status, 200);
      assert.equal(reads, 1); assert.equal(assessments, 2);
      assert.equal((await call(activity.id, { relevance: true, query: '?title=Python' })).response.status, 400);
      await db.doc(`activities/${activity.id}`).update({ title: 'Fresher Welcome', description: 'Welcome' });
      assert.equal((await call(activity.id, { suggest: true })).response.status, 409);
      assert.equal(reads, 1);
    }, { fetchImpl: async (...args) => { reads++; return libraryFetch(...args) }, aiFetchImpl: async (...args) => { assessments++; return libraryAiFetch(...args) } });
  });
  test('Library AI requests enforce in-flight and five-per-minute limits while manual search remains usable', async () => {
    const activity = await createActivity(apiUsers.organizer.idToken, 'Python rate-limit workshop');
    await publishActivity(apiUsers.organizer.idToken, activity.id);
    let entered, release;
    const started = new Promise(resolve => { entered = resolve }), gate = new Promise(resolve => { release = resolve });
    await withLibraryApi(async call => {
      const first = call(activity.id, { suggest: true }); await started;
      assert.equal((await call(activity.id, { suggest: true })).response.status, 429);
      release(); assert.equal((await first).response.status, 200);
      for (let i = 0; i < 4; i++) assert.equal((await call(activity.id, { suggest: true })).response.status, 200);
      assert.equal((await call(activity.id, { suggest: true })).response.status, 429);
      assert.equal((await call(activity.id, { query: '?q=Python' })).response.status, 200);
    }, { aiFetchImpl: async (...args) => { entered(); await gate; return libraryAiFetch(...args) } });
  });

  async function withInternshipApi(fetchImpl, run, enabled = true) {
    const internships = createInternships({ config: { enabled, baseUrl: 'https://team17.test', timeoutMs: 1000 }, fetchImpl });
    const integration = createIntegration({ db, config: integrationConfig({}), fetchImpl: () => { throw new Error('Unexpected external request') } });
    const server = createApp({ db, auth, integration, internships, env: { FIREBASE_PROJECT_ID: projectId, SCHOOL_EMAIL_DOMAIN: 'lamduan.mfu.ac.th' } }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const call = async (query = '', token = apiUsers.student.idToken) => {
      const response = await fetch(base + '/api/internships' + query, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return { response, body: await response.json() };
    };
    try { await run(call) } finally { await new Promise(resolve => server.close(resolve)) }
  }
  test('internship API admits enrolled Students including dual Organizers and denies other identities before partner calls', async () => {
    const dual = await createUser('ORGANIZER');
    await db.doc(`users/${dual.uid}`).update({ universityId: 'TEST-DUAL-INTERN-001' });
    const personal = await createUser('ORGANIZER', { domain: 'gmail.com' });
    const applicant = await createUser('APPLICANT', { domain: 'gmail.com', provisioned: false });
    let calls = 0;
    await withInternshipApi(async (...args) => { calls++; return internshipFetch(...args) }, async call => {
      assert.equal((await call('', '')).response.status, 401);
      for (const user of [apiUsers.admin, personal, applicant]) assert.equal((await call('', user.idToken)).response.status, 403);
      assert.equal(calls, 0);
      for (const user of [apiUsers.student, dual]) {
        const result = await call('', user.idToken);
        assert.equal(result.response.status, 200); assert.equal(result.response.headers.get('cache-control'), 'no-store');
        assert.equal(result.body.data.length, 6); assert.equal(result.body.data[0].is_demo, true);
      }
      assert.equal(calls, 2);
    });
  });
  test('internship API proxies page/filter results while keeping failures and invalid queries honest', async () => {
    await withInternshipApi(internshipFetch, async call => {
      assert.equal((await call('?page=2')).body.data.length, 2);
      const filtered = await call('?q=React&work_mode=remote');
      assert.equal(filtered.body.pagination.total, 4); assert.equal(filtered.body.data[0].application_deadline, '2027-02-05');
      assert.equal((await call('?q=missing')).body.pagination.total, 0);
      for (const query of ['?q=a&q=b', '?limit=51', '?url=https://other.test']) assert.equal((await call(query)).response.status, 400);
      const unavailable = await call('?q=unavailable'); assert.equal(unavailable.response.status, 503);
      assert.equal(JSON.stringify(unavailable.body).includes('private partner error'), false);
      assert.equal((await call('?q=malformed')).response.status, 502);
    });
    await withInternshipApi(() => { throw new Error('Provider must not be called') }, async call => {
      const result = await call(); assert.equal(result.response.status, 503); assert.equal(result.body.error.code, 'INTERNSHIPS_NOT_CONFIGURED');
    }, false);
  });

}
