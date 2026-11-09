import { fail } from '../../shared/domain.js';
import { errorEnvelope } from '../../shared/errors.js';

export function mountInternshipRoutes(app, { internships }) {
  app.get('/api/internships', async (req, res) => {
    if (!req.user.capabilities.student) fail(403, 'FORBIDDEN');
    res.setHeader('Cache-Control', 'no-store');
    try { res.json(await internships.list(req.query)); }
    catch (error) {
      // Only these fixed provider outcomes are safe to explain publicly.
      if (['INTERNSHIPS_NOT_CONFIGURED', 'INTERNSHIPS_UNAVAILABLE', 'INTERNSHIPS_INVALID_RESPONSE'].includes(error.message) && [502, 503].includes(error.status)) return res.status(error.status).json(errorEnvelope(error.message));
      throw error;
    }
  });
}
