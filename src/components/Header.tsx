import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    setProfileOpen(false);
    navigate('/');
  }

  const displayName = profile?.full_name || profile?.phone || 'User';
  const displayPhone = profile?.phone || user?.user_metadata?.phone || '';

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="section-padding">
        <div className="flex items-center gap-3 h-[60px] lg:h-[68px]">
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://res.cloudinary.com/dlkovvlud/image/upload/v1771590689/Screenshot_2026-02-20_175222-removebg-preview_ufalk6.png"
              alt="The Supreme Waffle - Premium Gourmet Waffles"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,215,0,0.15)]"
            />
          </Link>

          <Link
            to="/menu"
            className="flex-1 flex items-center gap-3 bg-brand-surface border border-white/[0.08] rounded-xl px-4 py-3 hover:border-white/15 transition-all group"
          >
            <Search size={18} className="text-brand-gold flex-shrink-0" strokeWidth={2.5} />
            <span className="text-[15px] font-medium text-brand-text-dim group-hover:text-brand-text-muted transition-colors">
              Search waffles...
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="hidden sm:flex items-center gap-2 text-[14px] font-semibold text-brand-text-muted hover:text-white px-3 py-2.5 rounded-xl hover:bg-brand-surface-light transition-all"
                >
                  <div className="w-9 h-9 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/20">
                    <User size={16} className="text-brand-gold" strokeWidth={2.5} />
                  </div>
                  <span className="max-w-[80px] truncate hidden lg:inline">{displayName}</span>
                  <ChevronDown size={14} className={`text-brand-text-dim transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-brand-surface rounded-xl border border-white/[0.06] shadow-elevated py-1.5 animate-slide-down z-50">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="font-bold text-[15px] text-white truncate">{displayName}</p>
                      {displayPhone && <p className="text-[13px] font-medium text-brand-text-dim truncate mt-0.5">+91 {displayPhone}</p>}
                    </div>
                    <Link
                      to="/my-orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-brand-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <Package size={16} strokeWidth={2.2} />
                      My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-brand-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <LogOut size={16} strokeWidth={2.2} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                state={{ from: location.pathname }}
                className="hidden sm:flex items-center gap-1.5 text-[14px] font-bold text-brand-gold hover:text-brand-gold-soft transition-colors px-3 py-2.5"
              >
                <User size={16} strokeWidth={2.5} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
