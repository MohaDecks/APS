import { useState, useCallback } from 'react';
import { Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB, formatDuration, formatBilledHours } from '../lib/api';
import { downloadCsv } from '../lib/export';
import PageHeader from './PageHeader';

export default function ReportView({
  title,
  subtitle,
  defaultFrom,
  defaultTo,
  breakdownTitle = 'Revenue by Day',
  exportPrefix = 'report',
  preferHourly = false,
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [sort, setSort] = useState('desc');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports', { params: { from, to, sort } });
      setReport(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [from, to, sort]);

  const handleApply = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const useHourly = preferHourly && from === to && report?.hourly_breakdown?.length > 0;
  const breakdown = useHourly ? report.hourly_breakdown : (report?.daily_breakdown || []);
  const breakdownLabel = useHourly ? 'Hour' : 'Date';
  const breakdownKey = useHourly ? 'label' : 'date';

  const handleExport = () => {
    if (!breakdown.length) {
      toast.error('Nothing to export');
      return;
    }
    const ok = downloadCsv(`${exportPrefix}-${from}-to-${to}.csv`, breakdown, [
      { label: breakdownLabel, value: (d) => d[breakdownKey] },
      { label: 'Sessions', value: (d) => d.sessions },
      { label: 'Duration (actual)', value: (d) => d.duration_minutes },
      { label: 'Billed (hours)', value: (d) => d.billed_hours },
      { label: 'Revenue (ETB)', value: (d) => d.revenue },
    ]);
    if (ok) toast.success(`Exported ${breakdown.length} rows`);
  };

  const summary = report?.summary;
  const topPlates = report?.top_plates || [];

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader badge="Finance" title={title} subtitle={subtitle} />

      <div className="p-8 max-w-7xl">
        <form onSubmit={handleApply} className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-8 shadow-sm">
          {report?.hourly_rate != null && (
            <p className="text-xs text-slate-500 mb-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              Rate: <strong>{report.hourly_rate} ETB/hr</strong> — each session is billed by rounding{' '}
              <strong>up to the next full hour</strong> (e.g. 22h 45m parked = 23h billed = {formatETB(23 * report.hourly_rate)}).
            </p>
          )}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                <span className="text-sm text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white min-w-[140px]"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Loading...' : 'Apply'}
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={!breakdown.length}
              className="flex items-center gap-2 bg-rose-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-500 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </form>

        {!report ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">Select a date range and click Apply to load the report</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Sessions" value={summary.total_sessions} />
              <StatCard label="Total Revenue" value={formatETB(summary.total_revenue)} accent />
              <StatCard label="Time Parked" value={formatDuration(summary.total_duration_minutes || 0)} />
              <StatCard label="Billed Hours" value={formatBilledHours(summary.total_billed_hours || 0)} />
              <StatCard label="Average Fee" value={formatETB(summary.avg_fee)} />
              <StatCard label="Unique Vehicles" value={summary.unique_vehicles} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-bold text-slate-800">{useHourly ? 'Revenue by Hour' : breakdownTitle}</h2>
                </div>
                {breakdown.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-sm uppercase tracking-wider">No data found records</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 font-bold tracking-wider bg-slate-50/30">
                        <th className="px-6 py-3 text-left">{breakdownLabel}</th>
                        <th className="px-6 py-3 text-left">Sessions</th>
                        <th className="px-6 py-3 text-left">Parked</th>
                        <th className="px-6 py-3 text-left">Billed</th>
                        <th className="px-6 py-3 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((d) => (
                        <tr key={d[breakdownKey]} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-medium text-slate-700">{d[breakdownKey]}</td>
                          <td className="px-6 py-3">{d.sessions}</td>
                          <td className="px-6 py-3 text-slate-600">{formatDuration(d.duration_minutes || 0)}</td>
                          <td className="px-6 py-3 font-semibold text-slate-700">{formatBilledHours(d.billed_hours || 0)}</td>
                          <td className="px-6 py-3 font-bold text-red-600">{formatETB(d.revenue)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-6 py-3 text-slate-800">Total</td>
                        <td className="px-6 py-3">{summary.total_sessions}</td>
                        <td className="px-6 py-3 text-slate-700">{formatDuration(summary.total_duration_minutes || 0)}</td>
                        <td className="px-6 py-3 text-slate-800">{formatBilledHours(summary.total_billed_hours || 0)}</td>
                        <td className="px-6 py-3 text-red-600">{formatETB(summary.total_revenue)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-bold text-slate-800">Top Vehicles</h2>
                </div>
                {topPlates.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-sm uppercase tracking-wider">No data found records</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 font-bold tracking-wider bg-slate-50/30">
                        <th className="px-6 py-3 text-left">Plate</th>
                        <th className="px-6 py-3 text-left">Visits</th>
                        <th className="px-6 py-3 text-left">Parked</th>
                        <th className="px-6 py-3 text-left">Billed</th>
                        <th className="px-6 py-3 text-left">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPlates.map((p) => (
                        <tr key={p.plate} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-3 font-mono font-bold">{p.plate}</td>
                          <td className="px-6 py-3">{p.visits}</td>
                          <td className="px-6 py-3 text-slate-600">{formatDuration(p.duration_minutes || 0)}</td>
                          <td className="px-6 py-3 font-semibold text-slate-700">{formatBilledHours(p.billed_hours || 0)}</td>
                          <td className="px-6 py-3 font-bold text-slate-800">{formatETB(p.total_spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-2 tabular-nums ${accent ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
