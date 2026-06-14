import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB } from '../lib/api';
import { downloadCsv } from '../lib/export';
import PageHeader from '../components/PageHeader';

const periods = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/reports/${period}`)
      .then(({ data }) => setReport(data))
      .catch(() => toast.error('Failed to load report'));
  }, [period]);

  if (!report) {
    return (
      <div className="min-h-full bg-slate-50/80 flex items-center justify-center">
        <p className="text-slate-400">Loading report...</p>
      </div>
    );
  }

  const { summary, daily_breakdown, top_plates } = report;

  const handleExport = () => {
    const ok = downloadCsv(`report-${period}.csv`, daily_breakdown, [
      { label: 'Date', value: (d) => d.date },
      { label: 'Sessions', value: (d) => d.sessions },
      { label: 'Revenue (ETB)', value: (d) => d.revenue },
    ]);
    if (ok) toast.success(`Exported ${daily_breakdown.length} rows`);
    else toast.error('Nothing to export');
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Finance"
        title="Reports"
        subtitle="Daily, weekly, and monthly revenue summaries"
      >
        {daily_breakdown.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export table
          </button>
        )}
      </PageHeader>

      <div className="p-8 max-w-7xl">
        <div className="flex gap-2 mb-8">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                period === p.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sessions" value={summary.total_sessions} />
          <StatCard label="Total Revenue" value={formatETB(summary.total_revenue)} accent />
          <StatCard label="Average Fee" value={formatETB(summary.avg_fee)} />
          <StatCard label="Unique Vehicles" value={summary.unique_vehicles} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Revenue by Day</h2>
            </div>
            {daily_breakdown.length === 0 ? (
              <p className="p-6 text-slate-400 text-sm">No data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 font-bold tracking-wider">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Sessions</th>
                    <th className="px-6 py-3 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {daily_breakdown.map((d) => (
                    <tr key={d.date} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-medium text-slate-700">{d.date}</td>
                      <td className="px-6 py-3">{d.sessions}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">{formatETB(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Top Vehicles</h2>
            </div>
            {top_plates.length === 0 ? (
              <p className="p-6 text-slate-400 text-sm">No data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 font-bold tracking-wider">
                    <th className="px-6 py-3 text-left">Plate</th>
                    <th className="px-6 py-3 text-left">Visits</th>
                    <th className="px-6 py-3 text-left">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {top_plates.map((p) => (
                    <tr key={p.plate} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-mono font-bold">{p.plate}</td>
                      <td className="px-6 py-3">{p.visits}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">{formatETB(p.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-2 tabular-nums ${accent ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
