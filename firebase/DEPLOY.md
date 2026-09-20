# Host the assignment API on Render

The Express API runs on Render; the existing Firestore database and Firebase
Authentication remain in project `events-management-4d8ce`. No database migration
or frontend is needed to test with Postman. This guide prepares deployment; it
does not mean the API has already been deployed.

## 1. Gather access and credentials

- A Render account and access to connect this GitHub repository.
- Firebase project access, including permission to obtain a service-account key.
- A Firebase service-account JSON key for `events-management-4d8ce`.
- For API testing: the Firebase Web API key and credentials for provisioned,
  email-verified Student and Organizer test accounts.

In Firebase Console, open Project settings → Service accounts → Firebase Admin
SDK → Generate new private key. An authorized project owner may need to do this
if your account cannot. If organization policy blocks keys, ask the project owner
for an approved credential/deployment approach instead of disabling that policy.

Store the downloaded file outside the repository. The service identity needs
Firestore read/write and Firebase Authentication user-read access (the API checks
token revocation). Use a dedicated identity with those permissions where possible;
the backend does not need project Owner/Editor permissions.

The service-account JSON is a server secret. Do not commit it, include it in a
frontend or Postman collection, or distribute it to API consumers. The Firebase
Web API key is a different value used for client sign-in, not the server's key.

## 2. Create the web service

In Render, choose New → Web Service and connect the repository/branch you intend
to deploy. Use these settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Root directory | `firebase` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/health` |
| Instance type | Free, for the assignment demo |

Use Node.js 22 or newer. The API already listens on `0.0.0.0` and the host's
`PORT`, so no port change is needed.

Under Environment → Secret Files, add a file named
`firebase-service-account.json` and paste the complete downloaded JSON into its
Contents field. Render exposes it at `/etc/secrets/firebase-service-account.json`.

Add the variables from [.env.example](.env.example):

```dotenv
FIREBASE_PROJECT_ID=events-management-4d8ce
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json
NODE_ENV=production
```

`GOOGLE_APPLICATION_CREDENTIALS` is a file path, not the JSON text. Do not set
`PORT` manually on Render. Do not run the seed script as a build/start command;
the existing database already contains profiles and activity data.

Deploy, then copy the actual HTTPS service URL shown by Render. Do not guess the
subdomain. Render Free services sleep after 15 minutes without traffic and can
take about a minute to wake up; allow time before the assignment demonstration.

## 3. Verify before sharing

1. Open `<service-url>/health`: expect `200` and `{"status":"ok"}`. This checks
   the process only, not Firebase credentials or database connectivity.
2. Import [the Postman collection](postman/Campus_Events_API.postman_collection.json).
3. Set `baseUrl` to the service URL without a trailing slash or `/api`.
4. Set `firebaseApiKey`, `organizerEmail`, `organizerPassword`, `studentEmail`,
   and `studentPassword` locally in Postman. Get the Web API key from Firebase
   Project settings → General → your web app's configuration (`apiKey`).
5. Run requests 02–05 to sign in and retrieve profiles. Sign-in saves tokens
   automatically. `/api/me` confirms protected API access and a Firestore read.
6. Run requests 06–15 in order using demo data. Expect create `201`, read/update
   `200`, and draft deletion `204`. These requests modify the live database and
   leave the published test activity and cancellation history in place.
7. Before cancelling, repeat registration: expect `409 ALREADY_REGISTERED`.
   A protected request without a token should return `401`; a Student attempting
   to create an activity should receive `403`.

If queries return `500`, inspect the Render logs and Firestore index status.
Ensure the indexes from `firestore.indexes.json` are deployed and enabled. The
repository's deny-all client rules should remain in place: this API accesses
Firestore through its server credentials.

Common blockers:

| Result | Check |
|---|---|
| Startup credential-file error | Secret filename, full JSON, and credential path |
| `INVALID_TOKEN` | Sign in again; ensure client and server use the same Firebase project |
| `EMAIL_NOT_VERIFIED` | Complete email verification, then sign in again |
| `ACCOUNT_NOT_PROVISIONED` | Matching `users/{Auth UID}` profile with `STUDENT` or `ORGANIZER` role |
| `/` returns `404` | Expected: use `/health` or an `/api/...` route |

## 4. Give teammates the client details

Share the actual base URL, the Postman collection, the Firebase Web API key, and
access to appropriate test accounts through a private channel. Their requests use
`Authorization: Bearer <Firebase ID token>`. They do not need the service-account
JSON, Firebase console access, or hosting credentials to call your API.

The current API can be tested with Postman, curl, or another backend. It does not
yet configure CORS for browser calls from a different origin. If a teammate's
frontend will call it directly, configure an explicit allowed-origin list and
OPTIONS handling for its frontend URLs before browser integration.

## Optional local run

From `firebase/`, using Node.js 22+:

```bash
npm ci
cp .env.example .env
# Edit .env: use the absolute path of your locally stored service-account JSON.
node --env-file=.env api.mjs
```

`.env` is ignored by Git. `npm start` uses environment variables supplied by the
host; it does not load a local `.env` file automatically.

## Official references

- [Render Express deployment](https://render.com/docs/deploy-node-express-app)
- [Render environment variables and secret files](https://render.com/docs/configure-environment-variables)
- [Render Free limitations](https://render.com/docs/free)
- [Firebase Admin SDK credentials](https://firebase.google.com/docs/admin/setup)
