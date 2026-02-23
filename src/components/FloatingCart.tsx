import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function FloatingCart() {
  const { itemCount, subtotal } = useCart();
  const location = useLocation();

  const hidden = location.pathname === '/cart'
    || location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/chef')
    || location.pathname.startsWith('/order-success')
    || itemCount === 0;

  if (hidden) return null;

  return (
    <Link
      to="/cart"
      className="fixed bottom-[76px] left-4 right-4 z-40 animate-slide-up max-w-lg mx-auto"
    >
      <div className="bg-brand-gold rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-glow-gold hover:brightness-110 active:scale-[0.98] transition-all">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={2.5} className="text-brand-bg" />
            <span className="absolute -top-2 -right-2.5 w-5 h-5 bg-brand-bg text-brand-gold text-[11px] font-extrabold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="text-brand-bg">
            <span className="text-[14px] font-extrabold">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="mx-2 text-brand-bg/50">|</span>
            <span className="text-[14px] font-extrabold tabular-nums">
              {'\u20B9'}{subtotal}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-brand-bg">
          <span className="text-[13px] font-bold">View Cart</span>
          <ChevronRight size={16} strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}
