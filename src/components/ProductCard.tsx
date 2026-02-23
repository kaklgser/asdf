import { Clock, Plus, Minus } from 'lucide-react';
import type { MenuItem } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export default function ProductCard({ item, onAdd }: ProductCardProps) {
  const { items, updateQuantity, removeItem } = useCart();

  const cartItems = items.filter((ci) => ci.menu_item.id === item.id);
  const totalQty = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  function handleIncrement() {
    if (totalQty === 0) {
      onAdd(item);
    } else {
      const last = cartItems[cartItems.length - 1];
      updateQuantity(last.id, last.quantity + 1);
    }
  }

  function handleDecrement() {
    if (totalQty <= 0) return;
    const last = cartItems[cartItems.length - 1];
    if (last.quantity <= 1) {
      removeItem(last.id);
    } else {
      updateQuantity(last.id, last.quantity - 1);
    }
  }

  return (
    <div className="card group">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white font-bold text-[14px] bg-black/50 px-4 py-2 rounded-lg">Sold Out</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          {item.is_veg ? (
            <div className="w-5 h-5 border-2 border-emerald-400 rounded-sm flex items-center justify-center bg-brand-surface/80">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
          ) : (
            <div className="w-5 h-5 border-2 border-red-400 rounded-sm flex items-center justify-center bg-brand-surface/80">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-400" />
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-white text-[15px] leading-tight truncate">{item.name}</h3>

        <div className="flex items-center gap-1.5 mt-1">
          <Clock size={12} className="text-brand-text-dim" strokeWidth={2.2} />
          <span className="text-[12px] font-semibold text-brand-text-dim">{item.prep_time} min</span>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[17px] font-extrabold text-brand-gold tracking-tight">
            {'\u20B9'}{item.price}
          </span>

          {totalQty > 0 ? (
            <div className="flex items-center gap-0 border-2 border-brand-gold rounded-lg overflow-hidden">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="w-7 text-center text-[14px] font-extrabold text-brand-gold">{totalQty}</span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(item)}
              disabled={!item.is_available}
              className="border-2 border-brand-gold text-brand-gold text-[13px] font-extrabold px-4 py-1.5 rounded-lg
                         hover:bg-brand-gold hover:text-brand-bg active:scale-[0.95] transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
