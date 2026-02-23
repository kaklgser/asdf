import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
      className="fixed bottom-[76px] right-4 z-40 animate-scale-in"
    >
      <div className="bg-brand-gold text-brand-bg rounded-full w-[56px] h-[56px] flex items-center justify-center shadow-glow-gold hover:brightness-110 active:scale-95 transition-all relative">
        <ShoppingBag size={24} strokeWidth={2.5} />
        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-brand-bg text-[12px] font-extrabold rounded-full flex items-center justify-center shadow-md">
          {itemCount}
        </span>
      </div>
      <div className="text-center mt-1">
        <span className="text-[12px] font-bold text-brand-gold">
          {'\u20B9'}{subtotal}
        </span>
      </div>
    </Link>
  );
}
