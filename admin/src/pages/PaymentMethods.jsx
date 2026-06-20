import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';

function MethodIcon({ method, size = 'w-10 h-10' }) {
  if (method.logo_url) {
    return (
      <img
        src={method.logo_url}
        alt={method.name}
        className={`${size} rounded-xl object-contain bg-slate-100 border border-slate-100`}
      />
    );
  }
  return (
    <span className={`inline-flex ${size} items-center justify-center rounded-xl bg-slate-100 text-lg font-bold`}>
      {method.icon || '💳'}
    </span>
  );
}

export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '💳', sort_order: 0 });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchMethods = () => {
    api.get('/payment-methods')
      .then(({ data }) => setMethods(data))
      .catch(() => toast.error('Failed to load payment methods'));
  };

  useEffect(() => { fetchMethods(); }, []);

  const resetForm = () => {
    setForm({ name: '', icon: '💳', sort_order: 0 });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

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

  const startEdit = (method) => {
    setEditingId(method.id);
    setForm({ name: method.name, icon: method.icon || '💳', sort_order: method.sort_order || 0 });
    setLogoFile(null);
    setLogoPreview(method.logo_url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('icon', form.icon);
      fd.append('sort_order', form.sort_order);
      if (logoFile) fd.append('logo', logoFile);

      if (editingId) {
        await api.put(`/payment-methods/${editingId}`, fd);
        toast.success('Payment method updated');
      } else {
        await api.post('/payment-methods', fd);
        toast.success('Payment method added');
      }
      resetForm();
      fetchMethods();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const toggleActive = async (method) => {
    try {
      await api.put(`/payment-methods/${method.id}`, { active: !method.active });
      fetchMethods();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment method?')) return;
    try {
      await api.delete(`/payment-methods/${id}`);
      toast.success('Deleted');
      fetchMethods();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Settings"
        title="Payment Methods"
        subtitle="Manage how operators collect parking fees — Ebirr, Kaafi, Coopy, NIB, etc."
      >
        <button
          onClick={() => {
            if (showForm && !editingId) setShowForm(false);
            else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 btn-primary px-4 py-2.5 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add method
        </button>
      </PageHeader>

      <div className="p-8 max-w-4xl">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4 shadow-sm">
            <div className="col-span-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                {editingId ? 'Edit payment method' : 'New payment method'}
              </h3>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ebirr, Kaafi, Coopy, NIB..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Logo image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              <p className="text-xs text-slate-400 mt-1.5">PNG, JPG, WebP or SVG — max 2 MB</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fallback icon</label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="💳 — shown if no logo"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl">{form.icon || '💳'}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Active methods appear on the operator checkout screen.</p>
              </div>
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" className="btn-primary px-6 py-2.5 text-sm">
                {editingId ? 'Update payment method' : 'Save payment method'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          {methods.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No payment methods yet. Add Ebirr, Kaafi, Coopy, NIB...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-50/50">
                  <th className="px-6 py-3">Logo</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <MethodIcon method={m} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{m.name}</td>
                    <td className="px-6 py-4 text-slate-400">{m.sort_order}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(m)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          m.active ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {m.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(m)} className="text-slate-300 hover:text-slate-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
