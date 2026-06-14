import { Clock, Car, Plane, MapPin } from 'lucide-react';
import { formatETB } from '../lib/api';

const ZONES = ['A', 'B', 'C', 'D'];

export function ActiveParkingCard({ session, bayNumber }) {
  const zone = ZONES[(bayNumber - 1) % ZONES.length];
  const spot = String(bayNumber).padStart(2, '0');

  return (
    <div className="group relative bg-white rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Parking bay header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-[10px] font-black">P</span>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Bay {spot}</p>
            <p className="text-xs font-bold">Zone {zone} · Terminal</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
          Occupied
        </span>
      </div>

      {/* Asphalt strip */}
      <div className="h-1.5 parking-lot-floor" />

      <div className="px-4 pt-4 pb-4">
        <PlateDisplay plate={session.plate} />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <InfoBox icon={Clock} label="Elapsed" value={session.elapsed} mono />
          <InfoBox label="Checked In" value={session.entry_time?.replace('T', ' ').slice(11, 19) || '—'} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Running Fee</span>
          </div>
          <span className="text-xl font-black text-emerald-400 tabular-nums">{formatETB(session.running_fee)}</span>
        </div>
      </div>

      {/* Parking lines bottom */}
      <div className="h-2 bg-slate-100 border-t border-dashed border-slate-300" />
    </div>
  );
}

export function DepartedParkingCard({ session, bayNumber }) {
  const spot = bayNumber ? String(bayNumber).padStart(2, '0') : '—';

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bay {spot} · Departed</span>
        <Plane className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="px-4 pt-4 pb-4">
        <PlateDisplay plate={session.plate} muted />

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Arrived</p>
            <p className="font-medium text-slate-600 mt-0.5">{session.entry_time?.replace('T', ' ').slice(0, 16)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Departed</p>
            <p className="font-medium text-slate-600 mt-0.5">{session.exit_time?.replace('T', ' ').slice(0, 16)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Paid</span>
          <span className="text-lg font-black text-slate-800 tabular-nums">{formatETB(session.fee)}</span>
        </div>
      </div>
    </div>
  );
}

function PlateDisplay({ plate, muted }) {
  return (
    <div className={`plate-frame px-4 py-5 text-center ${muted ? 'opacity-70 border-slate-300' : ''}`}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <MapPin className="w-3 h-3 text-blue-600" />
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Ethiopia · Airport Parking</p>
      </div>
      <p className={`font-plate font-extrabold tracking-[0.12em] leading-none ${muted ? 'text-2xl text-slate-500' : 'text-3xl text-slate-900'}`}>
        {plate}
      </p>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, mono }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={`text-sm font-bold text-slate-800 mt-0.5 ${mono ? 'font-plate' : ''}`}>{value}</p>
    </div>
  );
}

export function EmptyParkingLot() {
  return (
    <div className="col-span-full">
      <div className="rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 bg-white">
        <div className="parking-lot-floor px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Terminal Parking Lot</p>
              <p className="text-slate-400 text-xs">All bays available</p>
            </div>
          </div>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">0 / Open</span>
        </div>
        <div className="py-16 px-8 text-center">
          <div className="inline-flex gap-3 mb-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-16 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                <span className="text-slate-300 text-xs font-bold">P{n}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 font-semibold text-lg">Lot is empty</p>
          <p className="text-slate-400 text-sm mt-1">Vehicles appear here when operators check them in via mobile app</p>
        </div>
      </div>
    </div>
  );
}
