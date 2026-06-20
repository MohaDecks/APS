import { useState, useEffect } from 'react';
import { Save, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useBranding } from '../lib/branding';

export default function Settings() {
  const { refreshBranding } = useBranding();
  const [hourlyRate, setHourlyRate] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setHourlyRate(String(data.hourly_rate));
      setFacilityName(data.facility_name);
      setLogoPreview(data.facility_logo_url || null);
    }).catch(() => toast.error('Failed to load settings'));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('hourly_rate', hourlyRate);
      fd.append('facility_name', facilityName);
      if (logoFile) fd.append('logo', logoFile);

      const { data } = await api.put('/settings', fd);
      setLogoFile(null);
      setLogoPreview(data.facility_logo_url || logoPreview);
      await refreshBranding();
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
        subtitle="Set hourly rate, facility name, and receipt logo"
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
                className="w-40 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm text-slate-400">ETB / hour</span>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Preview: a 3-hour stay would cost <strong className="text-red-600">{preview}</strong>.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-1">Receipt</h2>
            <p className="text-sm text-slate-500 mb-4">Shown on every receipt in the operator app.</p>

            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Facility name</label>
            <input
              type="text"
              value={facilityName}
              onChange={(e) => setFacilityName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-5"
            />

            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Receipt logo</label>
            <p className="text-sm text-slate-500 mb-3">Upload PNG, JPG, or SVG. Used on receipts in the mobile app.</p>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <ImagePlus className="w-4 h-4" />
                  Choose image
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-xs text-slate-400 mt-2">Max 5 MB. PNG or JPG recommended.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 btn-primary px-6 py-2.5 text-sm"
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
