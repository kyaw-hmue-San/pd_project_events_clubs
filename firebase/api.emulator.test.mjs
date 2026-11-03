import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { after, before, test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

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

  async function createUser(role) {
    const suffix = `${role.toLowerCase()}-${randomUUID()}`;
    const email = `${suffix}@example.test`;
    const password = `Demo-${randomUUID()}-9a!`;
    const user = await auth.createUser({ email, password, emailVerified: true, displayName: `Test ${role}` });
    const signIn = await fetch(`http://${authEmulatorHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const signInBody = await signIn.json();
    assert.equal(signIn.status, 200, `Auth emulator sign-in failed: ${JSON.stringify(signInBody)}`);
    const { idToken } = signInBody;
    await db.doc(`users/${user.uid}`).set({
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
    for (const key of [
      'GOOGLE_APPLICATION_CREDENTIALS',
      'PARTNER_API_URL', 'PARTNER_API_HEADER_NAME', 'PARTNER_API_TOKEN', 'PARTNER_WEBHOOK_URL',
      'PARTNER_INBOUND_API_KEY', 'WEBHOOK_INBOUND_SECRET', 'WEBHOOK_OUTBOUND_SECRET'
    ]) delete childEnv[key];
    childEnv.PARTNER_INBOUND_API_KEY = testPartnerKey;
    childEnv.WEBHOOK_INBOUND_SECRET = testWebhookSecret;

    apiProcess = spawn(process.execPath, ['api.mjs'], {
      cwd: new URL('.', import.meta.url),
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

    const organizerRegister = await request('/api/activities/not-an-activity/registrations', {
      token: apiUsers.organizer.idToken,
      method: 'POST'
    });
    assert.equal(organizerRegister.response.status, 403);

    const organizerHistory = await request('/api/me/registrations', { token: apiUsers.organizer.idToken });
    assert.equal(organizerHistory.response.status, 403);

    const studentRoster = await request(`/api/activities/${organizerCreate.id}/registrations`, { token: apiUsers.student.idToken });
    assert.equal(studentRoster.response.status, 403);
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
}
