import { useBranding } from '../lib/branding';

export default function PageHeader({ badge, title, subtitle, children }) {
  const { logoUrl, facilityName } = useBranding();

  return (
    <div className="border-b border-slate-200 bg-white px-8 py-6">
      <div className="flex items-start justify-between gap-4 max-w-7xl">
        <div className="flex items-start gap-4 min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={facilityName || 'Dirsh Parking'}
              className="h-12 w-auto max-w-[140px] object-contain shrink-0 mt-0.5"
            />
          )}
          <div className="min-w-0">
            {badge && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{badge}</p>
            )}
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
