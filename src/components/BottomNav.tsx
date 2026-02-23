import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, Package, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/my-orders', icon: Package, label: 'Orders' },
  { to: '/auth', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  function getProfileTo() {
    return user ? '/my-orders' : '/auth';
  }

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/';
    if (to === '/auth') return location.pathname === '/auth' || location.pathname === '/my-orders';
    return location.pathname.startsWith(to);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-brand-bg border-t border-white/[0.08]">
      <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const to = tab.to === '/auth' ? getProfileTo() : tab.to;
          const active = isActive(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 w-[72px] py-2 rounded-xl transition-all ${
                active
                  ? 'text-brand-gold'
                  : 'text-brand-text-dim hover:text-brand-text-muted'
              }`}
            >
              <div className={`relative ${active ? '' : ''}`}>
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-gold rounded-full" />
                )}
              </div>
              <span className={`text-[12px] leading-none ${active ? 'font-bold' : 'font-semibold'}`}>
                {tab.label === 'Profile' && user ? 'Profile' : tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
