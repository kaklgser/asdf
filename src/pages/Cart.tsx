import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, User, Pencil, Store } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { MenuItem, PaymentMethod, Offer, SelectedCustomization } from '../types';
import { useToast } from '../components/Toast';
import { playOrderSound } from '../lib/sounds';
import CustomizationModal from '../components/CustomizationModal';

export default function CartPage() {
  const { items, subtotal, itemCount, removeItem, updateQuantity, clearCart, addItem } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<{ cartItemId: string; menuItem: MenuItem } | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.full_name && !name) setName(profile.full_name);
      if (profile.phone && !phone) setPhone(profile.phone);
    }
  }, [profile]);

  async function applyCoupon() {
    setCouponError('');
    if (!couponCode.trim()) return;

    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!data) {
      setCouponError('Invalid or expired coupon code');
      setAppliedOffer(null);
      return;
    }

    if (subtotal < data.min_order) {
      setCouponError(`Minimum order of \u20B9${data.min_order} required`);
      setAppliedOffer(null);
      return;
    }

    setAppliedOffer(data);
    showToast('Coupon applied!');
  }

  const discount = appliedOffer
    ? appliedOffer.discount_type === 'percentage'
      ? Math.round(subtotal * (appliedOffer.discount_value / 100))
      : appliedOffer.discount_value
    : 0;
  const total = subtotal - discount;

  async function handlePlaceOrder() {
    if (!user) {
      navigate('/auth', { state: { from: '/cart' } });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      showToast('Please fill in your name and phone number', 'error');
      return;
    }

    setSubmitting(true);

    await supabase.from('profiles').update({
      full_name: name.trim(),
      phone: phone.trim(),
    }).eq('id', user.id);

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: profile?.email || '',
        address: '',
        pincode: '',
        order_type: 'pickup',
        delivery_fee: 0,
        subtotal,
        discount,
        total,
        payment_method: paymentMethod,
      })
      .select('order_id')
      .single();

    if (error || !order) {
      showToast('Failed to place order. Please try again.', 'error');
      setSubmitting(false);
      return;
    }

    const { data: orderRow } = await supabase
      .from('orders')
      .select('id')
      .eq('order_id', order.order_id)
      .maybeSingle();

    if (orderRow) {
      await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: orderRow.id,
          menu_item_id: item.menu_item.id,
          item_name: item.menu_item.name,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          customizations: item.customizations,
        }))
      );
    }

    playOrderSound();
    clearCart();
    navigate(`/order-success/${order.order_id}`);
  }

  function handleEditConfirm(menuItem: MenuItem, quantity: number, customizations: SelectedCustomization[]) {
    if (!editingItem) return;
    removeItem(editingItem.cartItemId);
    addItem(menuItem, quantity, customizations);
    setEditingItem(null);
    showToast('Item updated!');
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center section-padding bg-brand-bg">
        <div className="w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-brand-text-dim" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Your cart is empty</h2>
        <p className="text-brand-text-muted text-[15px]">Add some delicious waffles to get started</p>
        <Link to="/menu" className="btn-primary mt-6">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-lg mx-auto px-4 py-6 pb-32 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <Link to="/menu" className="inline-flex items-center gap-2 text-[13px] text-brand-text-dim hover:text-brand-gold transition-colors">
            <ArrowLeft size={15} />
            Menu
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
            <Store size={12} strokeWidth={2.5} />
            Pickup Order
          </div>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-white mb-5">
          Cart <span className="text-brand-text-dim font-semibold text-base tabular-nums">({itemCount})</span>
        </h1>

        <div className="space-y-2.5 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-brand-surface rounded-xl p-3.5 border border-white/[0.06] flex gap-3"
            >
              <img
                src={item.menu_item.image_url}
                alt={item.menu_item.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-[14px] leading-snug">{item.menu_item.name}</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-500/10 rounded-lg text-brand-text-dim hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} strokeWidth={2.2} />
                  </button>
                </div>

                {item.customizations.length > 0 && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <div className="flex-1 min-w-0">
                      <CartCustomizations customizations={item.customizations} />
                    </div>
                    <button
                      onClick={() => setEditingItem({ cartItemId: item.id, menuItem: item.menu_item })}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-gold hover:text-brand-gold-soft transition-colors flex-shrink-0 mt-0.5"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>
                )}

                {item.customizations.length === 0 && (
                  <button
                    onClick={() => setEditingItem({ cartItemId: item.id, menuItem: item.menu_item })}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-gold hover:text-brand-gold-soft transition-colors mt-1"
                  >
                    <Plus size={10} />
                    Add toppings
                  </button>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-brand-gold/30 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-[12px] font-bold tabular-nums text-brand-gold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="font-bold text-brand-gold tabular-nums text-[14px]">{'\u20B9'}{item.total_price.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}

          <Link
            to="/menu"
            className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold text-brand-gold hover:bg-brand-gold/5 rounded-xl transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add more items
          </Link>
        </div>

        {!user && (
          <div className="bg-brand-gold/5 rounded-xl p-4 border border-brand-gold/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-brand-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-[14px]">Sign in to order</h3>
                <p className="text-[12px] text-brand-text-dim">Track orders and save your details</p>
              </div>
              <Link
                to="/auth"
                state={{ from: '/cart' }}
                className="btn-primary text-[13px] py-2 px-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {user && (
          <div className="bg-brand-surface rounded-xl p-4 border border-white/[0.06] mb-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-[14px]"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field text-[14px]"
              />
            </div>
          </div>
        )}

        <div className="bg-brand-surface rounded-xl p-4 border border-white/[0.06] mb-4">
          <h3 className="font-bold text-white text-[14px] mb-3">Payment</h3>
          <div className="space-y-2">
            {([
              { value: 'cod' as PaymentMethod, label: 'Cash (Pay at Shop)', desc: 'Pay when you collect your order' },
              { value: 'upi' as PaymentMethod, label: 'UPI', desc: 'Pay using any UPI app' },
            ]).map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left ${
                  paymentMethod === pm.value
                    ? 'border-brand-gold bg-brand-gold/10'
                    : 'border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === pm.value ? 'border-brand-gold bg-brand-gold' : 'border-brand-text-dim'}`}>
                  {paymentMethod === pm.value && <div className="w-full h-full rounded-full bg-brand-bg scale-[0.4]" />}
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-white block">{pm.label}</span>
                  <span className="text-[11px] text-brand-text-dim">{pm.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface rounded-xl p-4 border border-white/[0.06] mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="input-field pl-9 text-[13px]"
              />
            </div>
            <button onClick={applyCoupon} className="btn-outline px-4 py-2 text-[13px] font-semibold rounded-lg">Apply</button>
          </div>
          {couponError && <p className="text-red-400 text-[12px] mt-2">{couponError}</p>}
          {appliedOffer && (
            <div className="mt-2.5 bg-emerald-500/10 text-emerald-400 text-[12px] px-3 py-2 rounded-lg flex items-center justify-between">
              <span className="font-semibold">{appliedOffer.title} applied!</span>
              <button onClick={() => { setAppliedOffer(null); setCouponCode(''); }} className="font-semibold hover:underline">Remove</button>
            </div>
          )}
        </div>

        <div className="bg-brand-surface rounded-xl p-4 border border-white/[0.06] mb-6">
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between text-brand-text-muted">
              <span className="text-[13px]">Subtotal</span>
              <span className="tabular-nums">{'\u20B9'}{subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span className="text-[13px]">Discount</span>
                <span className="tabular-nums">-{'\u20B9'}{discount.toFixed(0)}</span>
              </div>
            )}
            <div className="border-t border-white/[0.06] pt-2.5 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="tabular-nums text-lg tracking-tight text-brand-gold">{'\u20B9'}{total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-bg/95 backdrop-blur-sm border-t border-white/[0.06] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="btn-primary w-full text-center text-[15px] font-extrabold py-3.5 rounded-xl tracking-tight"
            >
              {!user
                ? 'Sign In to Place Order'
                : submitting
                ? 'Placing Order...'
                : <>Place Order -- {'\u20B9'}{total.toFixed(0)}</>}
            </button>
          </div>
        </div>
      </div>

      {editingItem && (
        <CustomizationModal
          item={editingItem.menuItem}
          onClose={() => setEditingItem(null)}
          onConfirm={handleEditConfirm}
        />
      )}
    </div>
  );
}

function CartCustomizations({ customizations }: { customizations: SelectedCustomization[] }) {
  const grouped: Record<string, string[]> = {};
  for (const c of customizations) {
    if (!grouped[c.group_name]) grouped[c.group_name] = [];
    grouped[c.group_name].push(c.option_name);
  }

  return (
    <div className="space-y-0.5">
      {Object.entries(grouped).map(([group, options]) => (
        <p key={group} className="text-[11px] text-brand-text-dim leading-snug truncate">
          <span className="text-brand-text-muted">{group}:</span> {options.join(', ')}
        </p>
      ))}
    </div>
  );
}
