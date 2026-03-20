import { Clock } from 'lucide-react';

export default function ComingSoon() {
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
          className="text-brand-text-muted text-[15px] sm:text-base leading-relaxed max-w-md animate-fade-in"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          We're crafting the perfect waffle experience for you. Our doors open soon -- get ready for crispy, golden perfection.
        </p>
      </div>

      <footer className="relative text-center py-4 px-6">
        <p className="text-brand-text-dim text-[11px]">
          &copy; {new Date().getFullYear()} The Supreme Waffle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
