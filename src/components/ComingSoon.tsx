import { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, Instagram } from 'lucide-react';

const LAUNCH_DATE = new Date('2026-04-15T00:00:00');

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds };
}

export default function ComingSoon() {
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);

  const blocks = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-brand-bg flex flex-col overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-gold/[0.03] blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full bg-brand-gold/[0.02] blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8 animate-fade-in">
          <img
            src="/image.png"
            alt="The Supreme Waffle"
            className="h-28 sm:h-36 w-auto object-contain mx-auto"
          />
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Clock size={14} className="text-brand-gold" strokeWidth={2.5} />
            <span className="text-brand-gold text-[13px] font-bold tracking-wide uppercase">Coming Soon</span>
          </div>
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 max-w-xl animate-fade-in"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          Something Delicious is{' '}
          <span className="text-brand-gold">Brewing</span>
        </h1>

        <p
          className="text-brand-text-muted text-[15px] sm:text-base leading-relaxed max-w-md mb-10 animate-fade-in"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          We're crafting the perfect waffle experience for you. Our doors open soon -- get ready for crispy, golden perfection.
        </p>

        <div
          className="flex gap-3 sm:gap-4 mb-12 animate-fade-in"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          {blocks.map((b) => (
            <div
              key={b.label}
              className="w-[72px] sm:w-[84px] bg-brand-surface border border-white/[0.06] rounded-xl p-3 sm:p-4"
            >
              <span className="block text-2xl sm:text-3xl font-black text-white tabular-nums leading-none mb-1">
                {String(b.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-brand-text-dim uppercase tracking-wider">
                {b.label}
              </span>
            </div>
          ))}
        </div>

        <div
          className="w-full max-w-sm animate-fade-in"
          style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
          <div className="bg-brand-surface/60 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-brand-gold" strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <p className="text-white text-[13px] font-bold">Visit Us</p>
                <p className="text-brand-text-dim text-[12px]">123 Baker Street, Food District</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-brand-gold" strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <p className="text-white text-[13px] font-bold">Call Us</p>
                <p className="text-brand-text-dim text-[12px]">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Instagram size={18} className="text-brand-gold" strokeWidth={2.2} />
              </div>
              <div className="text-left">
                <p className="text-white text-[13px] font-bold">Follow Us</p>
                <p className="text-brand-text-dim text-[12px]">@thesupremwaffle</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative text-center py-4 px-6">
        <p className="text-brand-text-dim text-[11px]">
          &copy; {new Date().getFullYear()} The Supreme Waffle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
