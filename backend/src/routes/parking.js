import { Router } from 'express';
import Session from '../models/Session.js';
import Invoice from '../models/Invoice.js';
import Settings from '../models/Settings.js';
import { authMiddleware, operatorOnly } from '../middleware/auth.js';
import { calculateFee, formatElapsed, generateInvoiceNumber } from '../utils/parking.js';
import { toApi, toApiList, startOfToday } from '../utils/format.js';

const router = Router();
router.use(authMiddleware);

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

router.get('/stats', async (req, res) => {
  const settings = await getSettings();
  const today = startOfToday();

  const [active, todayCheckins, todayCheckouts, revenueAgg] = await Promise.all([
    Session.countDocuments({ status: 'active' }),
    Session.countDocuments({ entry_time: { $gte: today } }),
    Session.countDocuments({ status: 'completed', exit_time: { $gte: today } }),
    Session.aggregate([
      { $match: { status: 'completed', exit_time: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$fee' } } },
    ]),
  ]);

  res.json({
    hourly_rate: settings.hourly_rate,
    currently_parked: active,
    today_checkins: todayCheckins,
    today_checkouts: todayCheckouts,
    today_revenue: revenueAgg[0]?.total || 0,
  });
});

router.get('/active', async (req, res) => {
  const settings = await getSettings();
  const sessions = await Session.find({ status: 'active' }).sort({ entry_time: -1 });
  const now = new Date();

  const enriched = sessions.map((s) => {
    const { fee } = calculateFee(s.entry_time, now, settings.hourly_rate);
    return {
      ...toApi(s),
      elapsed: formatElapsed(s.entry_time),
      running_fee: fee,
    };
  });
  res.json(enriched);
});

router.post('/check-in', operatorOnly, async (req, res) => {
  const { plate } = req.body;
  if (!plate?.trim()) {
    return res.status(400).json({ error: 'Plate number required' });
  }
  const normalized = plate.trim().toUpperCase();
  const existing = await Session.findOne({ plate: normalized, status: 'active' });
  if (existing) {
    return res.status(409).json({ error: 'Vehicle already checked in' });
  }
  const session = await Session.create({
    plate: normalized,
    entry_time: new Date(),
    checked_in_by: req.user.id,
  });
  res.status(201).json(toApi(session));
});

router.post('/check-out/:id', operatorOnly, async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'active') return res.status(400).json({ error: 'Session already completed' });

  const settings = await getSettings();
  const exitTime = new Date();
  const { durationMinutes, fee } = calculateFee(session.entry_time, exitTime, settings.hourly_rate);

  session.exit_time = exitTime;
  session.fee = fee;
  session.status = 'completed';
  session.checked_out_by = req.user.id;
  await session.save();

  const invoice = await Invoice.create({
    session_id: session._id,
    invoice_number: generateInvoiceNumber(),
    plate: session.plate,
    entry_time: session.entry_time,
    exit_time: exitTime,
    duration_minutes: durationMinutes,
    hourly_rate: settings.hourly_rate,
    total_fee: fee,
    facility_name: settings.facility_name,
    issued_by: req.user.id,
  });

  res.json({ session: toApi(session), invoice: toApi(invoice) });
});

router.get('/history', async (req, res) => {
  const { plate, from, to } = req.query;
  const filter = { status: 'completed' };

  if (plate) filter.plate = { $regex: plate.toUpperCase(), $options: 'i' };
  if (from || to) {
    filter.exit_time = {};
    if (from) filter.exit_time.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.exit_time.$lte = end;
    }
  }

  const sessions = await Session.find(filter).sort({ exit_time: -1 }).limit(200);
  res.json(toApiList(sessions));
});

export default router;
