import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB } from '../lib/api';
import { getTodayDate } from '../lib/date';
import { downloadCsv } from '../lib/export';
import PageHeader from '../components/PageHeader';
import { DepartedParkingCard } from '../components/ParkingCard';

export default function History() {
  const today = getTodayDate();
  const [sessions, setSessions] = useState([]);
  const [plate, setPlate] = useState('');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = { from, to };
      if (plate) params.plate = plate;
      const { data } = await api.get('/parking/history', { params });
      setSessions(data);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [from, to, plate]);

  useEffect(() => {
    handleSearch();
  }, []);

  const setToday = () => {
    const t = getTodayDate();
    setFrom(t);
    setTo(t);
  };

  const handleExport = () => {
    const ok = downloadCsv(`departed-${from}-to-${to}.csv`, sessions, [
      { label: 'Plate', value: (s) => s.plate },
      { label: 'Entry', value: (s) => s.entry_time?.replace('T', ' ').slice(0, 19) },
      { label: 'Exit', value: (s) => s.exit_time?.replace('T', ' ').slice(0, 19) },
      { label: 'Fee (ETB)', value: (s) => s.fee },
    ]);
    if (ok) toast.success(`Exported ${sessions.length} sessions`);
    else toast.error('Nothing to export');
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Archive"
        title="Departed Vehicles"
        subtitle="Completed parking sessions — filters default to today"
      >
        {searched && sessions.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export ({sessions.length})
          </button>
        )}
      </PageHeader>

      <div className="p-8 max-w-7xl">
        <form onSubmit={handleSearch} className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-end shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Plate</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="SEARCH BY PLATE"
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <button
            type="button"
            onClick={setToday}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && (
          <p className="text-sm text-slate-400 mb-5 font-medium">
            {sessions.length} sessions · {from === to ? from : `${from} → ${to}`}
          </p>
        )}

        {searched && sessions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No sessions found</p>
            <p className="text-slate-400 text-sm mt-1">Adjust filters or wait for new check-outs</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sessions.map((s, i) => (
              <DepartedParkingCard key={s.id} session={s} bayNumber={i + 1} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
