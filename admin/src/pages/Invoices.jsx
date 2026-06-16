import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Printer, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { formatETB, formatDuration } from '../lib/api';
import { getTodayDate } from '../lib/date';
import { downloadCsv } from '../lib/export';
import PageHeader from '../components/PageHeader';

export default function Invoices() {
  const today = getTodayDate();
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [plate, setPlate] = useState('');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const params = { from, to };
      if (plate) params.plate = plate;
      const { data } = await api.get('/invoices', { params });
      setInvoices(data);
      setSelected(null);
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
    const ok = downloadCsv(`invoices-${from}-to-${to}.csv`, invoices, [
      { label: 'Invoice', value: (i) => i.invoice_number },
      { label: 'Plate', value: (i) => i.plate },
      { label: 'Entry', value: (i) => i.entry_time?.replace('T', ' ').slice(0, 19) },
      { label: 'Exit', value: (i) => i.exit_time?.replace('T', ' ').slice(0, 19) },
      { label: 'Duration (min)', value: (i) => i.duration_minutes },
      { label: 'Total (ETB)', value: (i) => i.total_fee },
      { label: 'Issued by', value: (i) => i.issued_by_name || '' },
    ]);
    if (ok) toast.success(`Exported ${invoices.length} invoices`);
    else toast.error('Nothing to export');
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-full bg-slate-50/80">
      <PageHeader
        badge="Finance"
        title="Invoices"
        subtitle="View and reprint receipts — today shown by default"
      >
        {invoices.length > 0 && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export ({invoices.length})
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
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          <button type="button" onClick={setToday} className="flex items-center gap-1.5 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50">
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-4 font-medium">{invoices.length} invoices</p>
            {invoices.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No invoices for this period</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setSelected(inv)}
                    className={`w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id === inv.id ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{inv.plate}</span>
                      <span className="font-bold text-emerald-600">{formatETB(inv.total_fee)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{inv.invoice_number} · {inv.created_at?.slice(0, 10)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {selected ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm" id="invoice-print">
                <div className="text-center mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">{selected.facility_name}</h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Parking Receipt</p>
                </div>
                <div className="space-y-3 text-sm">
                  <Row label="Invoice" value={selected.invoice_number} />
                  <Row label="Plate" value={selected.plate} mono />
                  <Row label="Entry" value={selected.entry_time?.replace('T', ' ').slice(0, 19)} />
                  <Row label="Exit" value={selected.exit_time?.replace('T', ' ').slice(0, 19)} />
                  <Row label="Duration" value={formatDuration(selected.duration_minutes)} />
                  <Row label="Rate" value={`${formatETB(selected.hourly_rate)}/hr`} />
                  {selected.payment_method_name && (
                    <Row label="Payment" value={`${selected.payment_method_icon || ''} ${selected.payment_method_name}`.trim()} />
                  )}
                  <div className="border-t border-slate-200 pt-3 mt-3 bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-slate-400 text-xs font-bold uppercase">Total</span>
                    <span className="font-black text-xl text-emerald-400">{formatETB(selected.total_fee)}</span>
                  </div>
                  {selected.issued_by_name && <Row label="Issued by" value={selected.issued_by_name} />}
                </div>
                <button onClick={handlePrint} className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-800">
                  <Printer className="w-4 h-4" />
                  Print receipt
                </button>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
                Select an invoice to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`${mono ? 'font-mono font-bold' : ''} ${bold ? 'font-bold text-lg' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}
