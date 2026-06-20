import { useBranding } from '../lib/branding';

function LogoText({ theme, size = 'compact', facilityName }) {
  const titleClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subClass = theme === 'dark' ? 'text-red-300' : 'text-red-600';
  const titleSize = size === 'hero' ? 'text-2xl sm:text-3xl' : size === 'full' ? 'text-lg' : 'text-sm';
  const subSize = size === 'hero' ? 'text-xs sm:text-sm mt-1' : size === 'full' ? 'text-[10px] mt-0.5' : 'text-[9px]';
  const parts = (facilityName || 'Dirsh Parking').trim().split(/\s+/);
  const title = (parts[0] || 'Dirsh').toUpperCase();
  const subtitle = (parts.slice(1).join(' ') || 'Parking').toUpperCase();

  return (
    <div className={size === 'hero' ? 'text-center' : ''}>
      <p className={`font-black leading-none tracking-[0.12em] ${titleClass} ${titleSize}`}>{title}</p>
      <p className={`font-bold uppercase tracking-[0.28em] ${subClass} ${subSize}`}>{subtitle}</p>
    </div>
  );
}

export default function Logo({ variant = 'compact', theme = 'dark', className = '' }) {
  const { logoUrl, facilityName } = useBranding();

  const heroH = 'h-[120px]';
  const sidebarH = 'h-[88px] w-full max-w-[220px]';
  const fullH = 'h-14';
  const compactH = 'h-11';

  if (logoUrl) {
    if (variant === 'sidebar') {
      return (
        <div className={`flex flex-col items-center w-full ${className}`}>
          <img src={logoUrl} alt={facilityName} className={`object-contain ${sidebarH}`} />
        </div>
      );
    }

    const imgClass =
      variant === 'hero' ? `${heroH} w-auto max-w-[280px]` :
      variant === 'full' ? `${fullH} w-auto max-w-[200px]` :
      `${compactH} w-auto max-w-[160px]`;

    if (variant === 'hero') {
      return (
        <div className={`flex flex-col items-center ${className}`}>
          <img src={logoUrl} alt={facilityName} className={`object-contain ${imgClass}`} />
        </div>
      );
    }

    return (
      <div className={`flex items-center ${className}`}>
        <img src={logoUrl} alt={facilityName} className={`object-contain ${imgClass}`} />
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`flex flex-col items-center gap-5 ${className}`}>
        <LogoText theme={theme} size="hero" facilityName={facilityName} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <LogoText theme={theme} size={variant === 'full' ? 'full' : 'compact'} facilityName={facilityName} />
    </div>
  );
}
