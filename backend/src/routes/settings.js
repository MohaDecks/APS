import { Router } from 'express';
import Settings from '../models/Settings.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { toApi } from '../utils/format.js';

const router = Router();

async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      hourly_rate: 50,
      facility_name: 'Bole International Airport Parking',
    });
  }
  return settings;
}

router.get('/', authMiddleware, async (req, res) => {
  const settings = await getSettings();
  res.json(toApi(settings));
});

router.put('/', authMiddleware, adminOnly, async (req, res) => {
  const { hourly_rate, facility_name } = req.body;
  if (hourly_rate == null || !facility_name) {
    return res.status(400).json({ error: 'Hourly rate and facility name required' });
  }
  const settings = await Settings.findOneAndUpdate(
    {},
    { hourly_rate: parseFloat(hourly_rate), facility_name },
    { new: true, upsert: true }
  );
  res.json(toApi(settings));
});

export default router;
