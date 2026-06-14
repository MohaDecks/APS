import { Router } from 'express';
import Session from '../models/Session.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { startOfToday, startOfDaysAgo } from '../utils/format.js';

const router = Router();
router.use(authMiddleware, adminOnly);

function getDateRange(period) {
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

async function getReportData(period) {
  const exitTimeRange = getDateRange(period);
  const match = { status: 'completed', exit_time: exitTimeRange };

  const [summaryAgg, dailyBreakdown, topPlates] = await Promise.all([
    Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total_sessions: { $sum: 1 },
          total_revenue: { $sum: '$fee' },
          avg_fee: { $avg: '$fee' },
          plates: { $addToSet: '$plate' },
        },
      },
      {
        $project: {
          total_sessions: 1,
          total_revenue: 1,
          avg_fee: 1,
          unique_vehicles: { $size: '$plates' },
        },
      },
    ]),
    Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$exit_time' } },
          sessions: { $sum: 1 },
          revenue: { $sum: '$fee' },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', sessions: 1, revenue: 1, _id: 0 } },
    ]),
    Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$plate',
          visits: { $sum: 1 },
          total_spent: { $sum: '$fee' },
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 10 },
      { $project: { plate: '$_id', visits: 1, total_spent: 1, _id: 0 } },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    total_sessions: 0,
    total_revenue: 0,
    avg_fee: 0,
    unique_vehicles: 0,
  };

  return { period, summary, daily_breakdown: dailyBreakdown, top_plates: topPlates };
}

router.get('/:period', async (req, res) => {
  const period = req.params.period;
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return res.status(400).json({ error: 'Invalid period. Use daily, weekly, or monthly' });
  }
  res.json(await getReportData(period));
});

export default router;
