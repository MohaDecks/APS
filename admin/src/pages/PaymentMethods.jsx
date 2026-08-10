import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, Pencil, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { canUpdatePayments } from '../lib/auth';

const COUNTRIES = ['Ethiopia', 'Somalia', 'Kenya', 'Djibouti', 'Other'];

const emptyForm = {
  name: '',
  country: 'Ethiopia',
  city_name: '',
  merchantUid: '',
  apiKey: '',
  apiUserId: '',
  prefix: '',
  merchant_prefix: '',
  is_visible: 1,
  is_ussd: 0,
  status: 1,
  icon: '💳',
  sort_order: 0,
};

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

export default function PaymentMethods() {
  const canEdit = canUpdatePayments();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchList = () => {
    setLoading(true);
    api.get('/payment-methods')
      .then(({ data }) => setList(data))
      .catch(() => toast.error('Failed to load payment methods'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const openCreate = () => {
    if (!canEdit) {
      toast.error('No permission to update payments');
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) {
      toast.error('No permission to update payments');
      return;
    }
    setEditing(item);
    setForm({
      name: item.name || '',
      country: item.country || 'Ethiopia',
      city_name: item.city_name || '',
      merchantUid: item.merchantUid || '',
      apiKey: item.apiKey || '',
      apiUserId: item.apiUserId || '',
      prefix: item.prefix || '',
      merchant_prefix: item.merchant_prefix || '',
      is_visible: item.is_visible ?? 1,
      is_ussd: item.is_ussd ?? 0,
      status: item.status ?? (item.active ? 1 : 0),
      icon: item.icon || '💳',
      sort_order: item.sort_order || 0,
    });
    setLogoFile(null);
    setLogoPreview(item.logo_url || item.image_url?.[0] || null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setToggle = (key) => setForm((f) => ({ ...f, [key]: f[key] ? 0 : 1 }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Payment method name is required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('country', form.country);
      fd.append('city_name', form.city_name);
      fd.append('merchantUid', form.merchantUid);
      fd.append('apiKey', form.apiKey);
      fd.append('apiUserId', form.apiUserId);
      fd.append('prefix', form.prefix);
      fd.append('merchant_prefix', form.merchant_prefix);
      fd.append('is_visible', String(form.is_visible));
      fd.append('is_ussd', String(form.is_ussd));
      fd.append('status', String(form.status));
      fd.append('active', form.status ? 'true' : 'false');
      fd.append('icon', form.icon || '💳');
      fd.append('sort_order', String(form.sort_order || 0));
      if (logoFile) fd.append('logo', logoFile);

      if (editing) {
        await api.put(`/payment-methods/${editing.id}`, fd);
        toast.success('Payment method updated');
      } else {
        await api.post('/payment-methods', fd);
        toast.success('Payment method added');
      }
      closeModal();
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canEdit) {
      toast.error('No permission to update payments');
      return;
    }
    if (!confirm(`Delete payment method "${item.name}"?`)) return;
    try {
      await api.delete(`/payment-methods/${item.id}`);
      toast.success('Deleted');
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Finance"
        title="Payment list"
        subtitle={canEdit ? 'Register payment options — API key, merchant & user ID' : 'View only — you cannot edit payments'}
      >
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 btn-primary px-4 py-2.5 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        )}
      </PageHeader>

      <div className="p-8 max-w-6xl">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : list.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">No payment methods yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {canEdit ? 'Add EBIRR, Kaafi, or other gateway credentials' : 'Ask an admin with payment permission to add methods'}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-6 inline-flex items-center gap-2 btn-primary px-5 py-2.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {list.map((item) => {
              const img = item.logo_url || item.image_url?.[0];
              const active = item.status ?? item.active;
              return (
                <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    {img ? (
                      <img src={img} alt="" className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                        {item.icon || <CreditCard className="w-5 h-5 text-slate-400" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.country}{item.city_name ? ` · ${item.city_name}` : ''}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {active ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <div className="px-5 py-3 space-y-1.5 text-xs">
                    <Row label="Merchant UID" value={item.merchantUid} mono />
                    <Row label="API User ID" value={item.apiUserId} mono />
                    <Row label="API Key" value={mask(item.apiKey)} mono />
                    <Row label="Prefix" value={item.prefix} mono />
                  </div>
                  <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                    {item.is_visible ? <Badge>Visible</Badge> : null}
                    {item.is_ussd ? <Badge>USSD</Badge> : null}
                  </div>
                  {canEdit && (
                    <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(item)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Payment Method *">
                  <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCls} required />
                </Field>
                <Field label="Country *">
                  <select value={form.country} onChange={(e) => setField('country', e.target.value)} className={inputCls}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="City Name">
                  <input value={form.city_name} onChange={(e) => setField('city_name', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Merchant UID">
                  <input value={form.merchantUid} onChange={(e) => setField('merchantUid', e.target.value)} className={inputCls} />
                </Field>
                <Field label="API Key">
                  <input value={form.apiKey} onChange={(e) => setField('apiKey', e.target.value)} className={inputCls} />
                </Field>
                <Field label="API User ID">
                  <input value={form.apiUserId} onChange={(e) => setField('apiUserId', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Prefix">
                  <input value={form.prefix} onChange={(e) => setField('prefix', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Merchant Prefix">
                  <input value={form.merchant_prefix} onChange={(e) => setField('merchant_prefix', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Sort order">
                  <input type="number" value={form.sort_order} onChange={(e) => setField('sort_order', Number(e.target.value))} className={inputCls} />
                </Field>
                <Field label="Fallback icon">
                  <input value={form.icon} onChange={(e) => setField('icon', e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logo</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">{form.icon || '💳'}</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <ImagePlus className="w-4 h-4" />
                    Choose image
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <Toggle label="Visible" on={!!form.is_visible} onChange={() => setToggle('is_visible')} />
                <Toggle label="USSD" on={!!form.is_ussd} onChange={() => setToggle('is_ussd')} />
                <Toggle label="Active" on={!!form.status} onChange={() => setToggle('status')} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80"
    >
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-red-500' : 'bg-slate-300'}`}>
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-slate-700 truncate max-w-[60%] ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
      {children}
    </span>
  );
}

function mask(s) {
  if (!s) return '';
  if (s.length <= 6) return '••••';
  return `${s.slice(0, 4)}••••${s.slice(-3)}`;
}
