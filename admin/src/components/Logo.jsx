const GRADIENT_ID = 'aps-logo-gradient';

export function LogoMark({ size = 48, className = '' }) {
  const id = `${GRADIENT_ID}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-lg ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="0.55" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${id})`} />
      <circle cx="32" cy="32" r="27.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path
        d="M22 18h10.5c7.2 0 12 4.2 12 10.8 0 5.6-3.4 9.2-8.8 10.1L40 46h-8.1l-6.2-9.5H30V46h-8V18zm7.5 14.8h2.2c3 0 4.8-1.4 4.8-4.1 0-2.8-1.8-4.2-4.8-4.2H29.5v8.3z"
        fill="white"
      />
      <path
        d="M43.5 13.5c3.5 1.2 6.5 3.5 8.5 6.5M43.5 13.5L41 16l2.5 2.5M43.5 13.5l2.5-2.5"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoText({ theme, size = 'compact' }) {
  const titleClass =
    theme === 'dark'
      ? 'text-white'
      : 'text-slate-900';
  const subClass =
    theme === 'dark'
      ? 'text-blue-200'
      : 'text-blue-600';
  const titleSize = size === 'hero' ? 'text-2xl sm:text-3xl' : size === 'full' ? 'text-lg' : 'text-sm';
  const subSize = size === 'hero' ? 'text-xs sm:text-sm mt-1' : size === 'full' ? 'text-[10px] mt-0.5' : 'text-[9px]';

  return (
    <div className={size === 'hero' ? 'text-center' : ''}>
      <p className={`font-black leading-none tracking-[0.12em] ${titleClass} ${titleSize}`}>
        AIRPORT PARKING
      </p>
      <p className={`font-bold uppercase tracking-[0.28em] ${subClass} ${subSize}`}>
        Vehicles System
      </p>
    </div>
  );
}

export default function Logo({ variant = 'compact', theme = 'dark', className = '' }) {
  if (variant === 'icon') {
    return <LogoMark size={44} className={className} />;
  }

  if (variant === 'hero') {
    const markSize = 96;
    return (
      <div className={`flex flex-col items-center gap-5 ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/25 blur-2xl scale-125" />
          <LogoMark size={markSize} className="relative" />
        </div>
        <LogoText theme={theme} size="hero" />
      </div>
    );
  }

  const markSize = variant === 'full' ? 56 : 44;

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <LogoMark size={markSize} />
      <LogoText theme={theme} size={variant === 'full' ? 'full' : 'compact'} />
    </div>
  );
}
