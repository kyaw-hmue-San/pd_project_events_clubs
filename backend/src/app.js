import express from 'express';
import { createPlanningAssistant, planningAssistantConfig } from './features/draft-assistant/planning.js';
import { createOrganizerAdmission, organizerAiConfig } from './features/organizer-requests/ai-review.js';
import { mountAdminRoutes } from './features/admin/routes.js';
import { errorEnvelope, handleError } from './shared/errors.js';
import { schoolEmailDomain } from './shared/school-access.js';
import { requestEvidence } from './features/integrations/service.js';
import { authenticate } from './middleware/auth.js';
import { mountActivitiesRoutes } from './features/activities/routes.js';
import { mountRegistrationsRoutes } from './features/registrations/routes.js';
import { mountUsersRoutes } from './features/users/routes.js';
import { mountIntegrationsRoutes } from './features/integrations/routes.js';
import { mountOrganizerRequestRoutes } from './features/organizer-requests/routes.js';
import { mountDraftAssistantRoutes } from './features/draft-assistant/routes.js';
import { createDraftAssistant, draftAssistantConfig } from './features/draft-assistant/service.js';
import { mountTicketRoutes } from './features/tickets/routes.js';
import { mountMaintenanceRoutes } from './features/integrations/maintenance.js';
import { createFacilities, facilitiesConfig } from './features/integrations/facilities.js';

// Importing this factory never starts Firebase, a listener, or the retry worker.
export function createApp({ db, auth, integration, env = process.env, draftAssistant, facilities, planningAssistant, organizerAdmission }) {
  const app = express();
  const frontendOrigins = (env.FRONTEND_ORIGINS || 'http://localhost:5173')
    .split(',').map(origin => origin.trim()).filter(Boolean);
  for (const origin of frontendOrigins) {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error('FRONTEND_ORIGINS must contain comma-separated exact HTTP(S) origins without paths');
    }
  }
  const allowedFrontendOrigins = new Set(frontendOrigins);
  const corsMethods = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
  const corsHeaders = new Set(['authorization', 'content-type', 'x-request-id']);
  const integrationLogViewers = new Set((env.INTEGRATION_LOG_VIEWER_UIDS || '').split(',').map(uid => uid.trim()).filter(Boolean));
  const publicIntegrationLogFields = new Set(['kind', 'requestId', 'eventId', 'at', 'source', 'attempt', 'httpStatus', 'outcome', 'recovered', 'durationMs']);
  app.disable('x-powered-by');
  app.use(requestEvidence(db));
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (!origin) return next();
    if (!allowedFrontendOrigins.has(origin)) return res.status(403).json(errorEnvelope('ORIGIN_NOT_ALLOWED'));

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', [...corsMethods].join(', '));
    res.setHeader('Access-Control-Allow-Headers', [...corsHeaders].join(', '));
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID');
    res.vary('Origin');
    if (req.method === 'OPTIONS') {
      const requestedMethod = req.get('Access-Control-Request-Method');
      const requestedHeaders = (req.get('Access-Control-Request-Headers') || '').split(',').map(header => header.trim().toLowerCase()).filter(Boolean);
      if ((requestedMethod && !corsMethods.has(requestedMethod)) || requestedHeaders.some(header => !corsHeaders.has(header))) {
        return res.status(403).json(errorEnvelope('CORS_PREFLIGHT_DENIED'));
      }
      return res.status(204).end();
    }
    next();
  });
  app.use(express.json({ limit: '32kb', verify: (req, _res, buffer) => {
    if (req.path === '/webhooks/partner') req.rawBody = Buffer.from(buffer);
  } }));

  const context = { db, auth, integration,
    planningAssistant: planningAssistant || createPlanningAssistant({ config: planningAssistantConfig(env) }),
    organizerAdmission: organizerAdmission || createOrganizerAdmission({ db, auth, config: organizerAiConfig(env) }), integrationLogViewers, publicIntegrationLogFields,
    facilities: facilities || createFacilities({ db, config: facilitiesConfig(env) }),
    draftAssistant: draftAssistant || createDraftAssistant({ config: draftAssistantConfig(env) }) };
  app.get('/health', (_req, res) => res.json({ status: 'ok', apiVersion: '2026-11-04-organizer-access' }));
  mountIntegrationsRoutes(app, context);
  app.use('/api', authenticate({ db, auth, schoolDomain: schoolEmailDomain(env) }));
  mountUsersRoutes(app, context);
  mountDraftAssistantRoutes(app, context);
  mountAdminRoutes(app, context);
  mountOrganizerRequestRoutes(app, context);
  mountIntegrationsRoutes(app, context, true);
  mountActivitiesRoutes(app, context);
  mountRegistrationsRoutes(app, context);
  mountTicketRoutes(app, context);
  mountMaintenanceRoutes(app, context);
  app.use((_req, res) => res.status(404).json(errorEnvelope('NOT_FOUND')));
  app.use(handleError);
  return app;
}
