import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'operator',
  can_update_payments: false,
  can_update_price: false,
};

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    api.get('/users').then(({ data }) => setUsers(data)).catch(() => toast.error('Failed to load users'));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'operator',
      can_update_payments: !!u.can_update_payments,
      can_update_price: !!u.can_update_price,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data: updated } = await api.put(`/users/${editing.id}`, {
          name: form.name,
          role: form.role,
          can_update_payments: form.role === 'admin' ? form.can_update_payments : false,
          can_update_price: form.role === 'admin' ? form.can_update_price : false,
        });
        const me = JSON.parse(localStorage.getItem('user') || '{}');
        if (me.id === editing.id) {
          localStorage.setItem('user', JSON.stringify({
            ...me,
            name: updated.name,
            role: updated.role,
            can_update_payments: !!updated.can_update_payments,
            can_update_price: !!updated.can_update_price,
          }));
          toast.success('Permissions saved — refresh page to update UI');
        } else {
          toast.success('User updated');
        }
      } else {
        await api.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          can_update_payments: form.role === 'admin' ? form.can_update_payments : false,
          can_update_price: form.role === 'admin' ? form.can_update_price : false,
        });
        toast.success(form.role === 'admin' ? 'Admin account created' : 'Operator account created');
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Management"
        title="App Users"
        subtitle="Create operator or admin accounts — set payment and price permissions"
      >
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 btn-primary px-4 py-2.5 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New user
        </button>
      </PageHeader>

      <div className="p-8 max-w-5xl">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4 shadow-sm relative">
            <button type="button" onClick={closeForm} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
            <div className="col-span-2">
              <h3 className="font-bold text-slate-800">{editing ? 'Edit user' : 'Create user'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Admin can use web portal. Operator uses mobile app only.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                required
                disabled={!!editing}
              />
            </div>
            {!editing && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} required />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({
                  ...form,
                  role: e.target.value,
                  can_update_payments: e.target.value === 'admin' ? form.can_update_payments : false,
                  can_update_price: e.target.value === 'admin' ? form.can_update_price : false,
                })}
                className={inputCls}
              >
                <option value="operator">Operator (mobile)</option>
                <option value="admin">Admin (portal)</option>
              </select>
            </div>

            {form.role === 'admin' && (
              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="col-span-full text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin permissions</p>
                <Toggle
                  label="Can update payments"
                  hint="Add / edit / delete payment methods"
                  on={form.can_update_payments}
                  onChange={() => setForm({ ...form, can_update_payments: !form.can_update_payments })}
                />
                <Toggle
                  label="Can update price"
                  hint="Change hourly rate and facility settings"
                  on={form.can_update_price}
                  onChange={() => setForm({ ...form, can_update_price: !form.can_update_price })}
                />
              </div>
            )}

            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-50/50">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-neutral-900 text-white' : 'bg-red-50 text-red-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === 'admin' ? (
                      <div className="flex flex-wrap gap-1">
                        {u.can_update_payments ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Payments</span>
                        ) : null}
                        {u.can_update_price ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">Price</span>
                        ) : null}
                        {!u.can_update_payments && !u.can_update_price ? (
                          <span className="text-[10px] text-slate-400">View only</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{u.created_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => openEdit(u)} className="text-slate-300 hover:text-slate-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(u.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, hint, on, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-start justify-between gap-3 px-3 py-3 rounded-xl border border-slate-200 bg-white text-left"
    >
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint ? <span className="block text-xs text-slate-400 mt-0.5">{hint}</span> : null}
      </span>
      <span className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${on ? 'bg-red-500' : 'bg-slate-300'}`}>
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}
