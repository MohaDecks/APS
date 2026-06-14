import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Car, MapPin, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        toast.error('Operators use the mobile app. Admin login only.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — airport branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden airport-grid-bg text-white flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/40" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <p className="font-black text-lg tracking-wide">AIRPORT PARKING</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.25em] font-bold">Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-black leading-tight max-w-md">
            Terminal car parking operations
          </h2>
          <p className="text-slate-400 mt-4 max-w-sm text-base leading-relaxed">
            Monitor live parking bays, track revenue, and manage operator accounts for your airport facility.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: Car, label: 'Live Bays', sub: 'Real-time' },
              { icon: MapPin, label: 'Plate View', sub: 'POS cards' },
              { icon: Shield, label: 'Admin Only', sub: 'Secure' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-sm font-bold">{label}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="h-2 runway-stripes rounded-full opacity-60 mb-4" />
          <p className="text-xs text-slate-500">Short-term parking · Check-in via mobile operators</p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4">
              <Plane className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="font-black text-2xl text-slate-900">Airport Parking</h1>
            <p className="text-slate-500 text-sm mt-1">Admin Control Panel</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200/80">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Access the parking management dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  placeholder="admin@parking.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/20"
              >
                {loading ? 'Signing in...' : 'Enter Parking Dashboard'}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500">Operators check cars in/out via the <strong className="text-slate-700">mobile app</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
