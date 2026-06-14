import { useState, useEffect, useCallback } from 'react';
import { Radio, LogIn, LogOut, Banknote, Plane, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB } from '../lib/api';
import { ActiveParkingCard, EmptyParkingLot } from '../components/ParkingCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get('/parking/stats'),
        api.get('/parking/active'),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load data');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const parked = stats?.currently_parked ?? 0;

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-100 to-slate-50">
      {/* Airport header */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 airport-grid-bg opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-1 runway-stripes opacity-80" />
        <div className="relative px-8 py-7 max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 text-amber-400" />
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  <Radio className="w-3 h-3" />
                  Live Operations
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">Airport Parking Lot</h1>
              <p className="text-slate-400 text-sm mt-1.5">
                Terminal short-term parking · {formatETB(stats?.hourly_rate || 0)}/hr · Operators use mobile app
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Car className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-4xl font-black text-white tabular-nums leading-none">{parked}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">On Premises</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Car} label="Parked Now" value={parked} accent="text-emerald-600" highlight />
          <StatCard icon={LogIn} label="Check-ins Today" value={stats?.today_checkins ?? '—'} />
          <StatCard icon={LogOut} label="Check-outs Today" value={stats?.today_checkouts ?? '—'} />
          <StatCard icon={Banknote} label="Revenue Today" value={stats ? formatETB(stats.today_revenue) : '—'} accent="text-slate-900" />
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Parking Bays</h2>
            <p className="text-sm text-slate-500">
              {sessions.length} vehicle{sessions.length !== 1 ? 's' : ''} currently in the lot
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            View Only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sessions.length === 0 ? (
            <EmptyParkingLot />
          ) : (
            sessions.map((s, i) => (
              <ActiveParkingCard key={s.id} session={s} bayNumber={i + 1} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, highlight }) {
  return (
    <div className={`rounded-2xl p-5 border transition-all hover:shadow-md ${
      highlight
        ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200/80 shadow-sm'
        : 'bg-white border-slate-200/80'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-emerald-600' : 'text-slate-500'}`} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-black tabular-nums ${accent || 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
