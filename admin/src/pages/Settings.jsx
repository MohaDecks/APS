import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB } from '../lib/api';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [hourlyRate, setHourlyRate] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setHourlyRate(String(data.hourly_rate));
      setFacilityName(data.facility_name);
    }).catch(() => toast.error('Failed to load settings'));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings', { hourly_rate: parseFloat(hourlyRate), facility_name: facilityName });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const preview = hourlyRate ? formatETB(parseFloat(hourlyRate) * 3) : formatETB(0);

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Configuration"
        title="Parking Pricing"
        subtitle="Set hourly rate and facility name for receipts"
      />

      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-1">Pricing</h2>
            <p className="text-sm text-slate-500 mb-4">
              Charged per started hour. Sessions are billed by rounding the duration up to the next full hour.
            </p>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hourly rate (ETB)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-40 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-sm text-slate-400">ETB / hour</span>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Preview: a 3-hour stay would cost <strong className="text-emerald-600">{preview}</strong>.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-1">Receipt</h2>
            <p className="text-sm text-slate-500 mb-4">Shown at the top of every receipt.</p>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Facility name</label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
