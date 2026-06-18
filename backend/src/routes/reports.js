import { Router } from 'express';
import Session from '../models/Session.js';
import Settings from '../models/Settings.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { startOfToday, startOfDaysAgo } from '../utils/format.js';

const router = Router();
router.use(authMiddleware, adminOnly);

function parseDateRange(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (start > end) return null;
  return { $gte: start, $lte: end };
}

function getPresetRange(period) {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { $gte: startOfToday(), $lte: now };
    case 'weekly':
      return { $gte: startOfDaysAgo(7), $lte: now };
    case 'monthly':
      return { $gte: startOfDaysAgo(30), $lte: now };
    default:
      return { $gte: startOfToday(), $lte: now };
  }
}

function durationMinutesField() {
  return {
    $max: [
      1,
      {
        $ceil: {
          $divide: [{ $subtract: ['$exit_time', '$entry_time'] }, 60000],
        },
      },
    ],
  };
}

async function getHourlyRate() {
  const settings = await Settings.findOne().lean();
  return settings?.hourly_rate ?? 100;
}

async function getReportData({ exitTimeRange, sort = 'desc', from, to, period }) {
  const match = { status: 'completed', exit_time: exitTimeRange };
  const sortDir = sort === 'asc' ? 1 : -1;
  const hourly_rate = await getHourlyRate();
  const withDuration = [
    { $match: match },
    { $addFields: { duration_minutes: durationMinutesField() } },
    { $addFields: { billed_hours: { $ceil: { $divide: ['$duration_minutes', 60] } } } },
  ];

  const [summaryAgg, dailyBreakdown, topPlates] = await Promise.all([
    Session.aggregate([
      ...withDuration,
      {
        $group: {
          _id: null,
          total_sessions: { $sum: 1 },
          total_revenue: { $sum: '$fee' },
          avg_fee: { $avg: '$fee' },
          total_duration_minutes: { $sum: '$duration_minutes' },
          total_billed_hours: { $sum: '$billed_hours' },
          plates: { $addToSet: '$plate' },
        },
      },
      {
        $project: {
          total_sessions: 1,
          total_revenue: 1,
          avg_fee: 1,
          total_duration_minutes: 1,
          total_billed_hours: 1,
          unique_vehicles: { $size: '$plates' },
        },
      },
    ]),
    Session.aggregate([
      ...withDuration,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$exit_time' } },
          sessions: { $sum: 1 },
          revenue: { $sum: '$fee' },
          duration_minutes: { $sum: '$duration_minutes' },
          billed_hours: { $sum: '$billed_hours' },
        },
      },
      { $sort: { _id: sortDir } },
      { $project: { date: '$_id', sessions: 1, revenue: 1, duration_minutes: 1, billed_hours: 1, _id: 0 } },
    ]),
    Session.aggregate([
      ...withDuration,
      {
        $group: {
          _id: '$plate',
          visits: { $sum: 1 },
          total_spent: { $sum: '$fee' },
          duration_minutes: { $sum: '$duration_minutes' },
          billed_hours: { $sum: '$billed_hours' },
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
      { $project: { plate: '$_id', visits: 1, total_spent: 1, duration_minutes: 1, billed_hours: 1, _id: 0 } },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    total_sessions: 0,
    total_revenue: 0,
    avg_fee: 0,
    total_duration_minutes: 0,
    total_billed_hours: 0,
    unique_vehicles: 0,
  };

  let hourly_breakdown = [];
  if (from && to && from === to) {
    hourly_breakdown = await Session.aggregate([
      ...withDuration,
      {
        $group: {
          _id: { $hour: '$exit_time' },
          sessions: { $sum: 1 },
          revenue: { $sum: '$fee' },
          duration_minutes: { $sum: '$duration_minutes' },
          billed_hours: { $sum: '$billed_hours' },
        },
      },
      { $sort: { _id: sortDir } },
      {
        $project: {
          hour: '$_id',
          label: {
            $concat: [
              { $cond: [{ $lt: ['$_id', 10] }, '0', ''] },
              { $toString: '$_id' },
              ':00',
            ],
          },
          sessions: 1,
          revenue: 1,
          duration_minutes: 1,
          billed_hours: 1,
          _id: 0,
        },
      },
    ]);
  }

  return {
    period: period || null,
    from: from || null,
    to: to || null,
    sort,
    hourly_rate,
    summary,
    daily_breakdown: dailyBreakdown,
    hourly_breakdown,
    top_plates: topPlates,
  };
}

router.get('/', async (req, res) => {
  const { from, to, sort = 'desc' } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to date required (YYYY-MM-DD)' });
  }
  const exitTimeRange = parseDateRange(from, to);
  if (!exitTimeRange) {
    return res.status(400).json({ error: 'Invalid date range' });
  }
  res.json(await getReportData({ exitTimeRange, sort, from, to }));
});

router.get('/:period', async (req, res) => {
  const period = req.params.period;
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return res.status(400).json({ error: 'Invalid period. Use daily, weekly, or monthly' });
  }
  const { sort = 'desc' } = req.query;
  const range = getPresetRange(period);
  const from = range.$gte.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  res.json(await getReportData({ exitTimeRange: range, sort, from, to, period }));
});

export default router;
