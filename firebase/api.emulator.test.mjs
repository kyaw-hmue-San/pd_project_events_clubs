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

  test('school Student promotion preserves identity and registration history; self-review and changed identities are denied', async () => {
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

  test('Admin appointment remains a trusted operator action and is idempotent', async () => {
    const person = await createUser('STUDENT', { provisioned: false, domain: 'gmail.com' });
    const run = apply => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['appoint-admin.mjs', '--email', person.email, ...(apply ? ['--apply'] : [])], { cwd: new URL('.', import.meta.url), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
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

}
