import { Router } from 'express';
import Settings from '../models/Settings.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { toApi } from '../utils/format.js';
import {
  facilityLogoUpload,
  facilityLogoUrlForFile,
  deleteFacilityLogoFile,
  runSingleUpload,
} from '../utils/upload.js';

const router = Router();

async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      hourly_rate: 50,
      facility_name: 'Dirsh Parking',
    });
  }
  return settings;
}

router.get('/branding', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      facility_name: settings.facility_name,
      facility_logo_url: settings.facility_logo_url || null,
    });
  } catch (err) {
    console.error('GET /settings/branding failed:', err);
    res.status(500).json({ error: 'Failed to load branding' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(toApi(settings));
  } catch (err) {
    console.error('GET /settings failed:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put(
  '/',
  authMiddleware,
  adminOnly,
  (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    return runSingleUpload(facilityLogoUpload, 'logo')(req, res, next);
  },
  async (req, res) => {
    try {
      const { hourly_rate, facility_name } = req.body;
      if (hourly_rate == null || !facility_name?.trim()) {
        if (req.file) deleteFacilityLogoFile(facilityLogoUrlForFile(req.file.filename));
        return res.status(400).json({ error: 'Hourly rate and facility name required' });
      }

      const settings = await getSettings();
      settings.hourly_rate = parseFloat(hourly_rate);
      settings.facility_name = facility_name.trim();

      if (req.file) {
        deleteFacilityLogoFile(settings.facility_logo_url);
        settings.facility_logo_url = facilityLogoUrlForFile(req.file.filename);
      }

      await settings.save();
      res.json(toApi(settings));
    } catch (err) {
      if (req.file) deleteFacilityLogoFile(facilityLogoUrlForFile(req.file.filename));
      console.error('PUT /settings failed:', err);
      res.status(400).json({ error: err.message || 'Save failed' });
    }
  },
);

export default router;
