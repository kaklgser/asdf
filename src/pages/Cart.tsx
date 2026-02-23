import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, User, MapPin, Store, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { DeliveryZone, OrderType, PaymentMethod, Offer } from '../types';
import { useToast } from '../components/Toast';
import LocationPicker from '../components/LocationPicker';
import { playOrderSound } from '../lib/sounds';

const STEPS = ['Cart', 'Details', 'Payment', 'Place Order'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <span className={`text-[12px] font-bold ${
            i <= currentStep ? 'text-brand-gold' : 'text-brand-text-dim'
          }`}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <span className={`text-[12px] mx-0.5 ${
              i < currentStep ? 'text-brand-gold' : 'text-brand-text-dim'
            }`}>
              &rsaquo;
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');

  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | null>(null);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [zoneError, setZoneError] = useState('');
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.full_name && !name) setName(profile.full_name);
      if (profile.phone && !phone) setPhone(profile.phone);
      if (profile.email && !email) setEmail(profile.email);
      if (profile.default_address && !address) setAddress(profile.default_address);
      if (profile.default_pincode && !pincode) setPincode(profile.default_pincode);
    }
  }, [profile]);

  useEffect(() => {
    if (pincode.length === 6) {
      checkPincode(pincode);
    } else {
      setDeliveryZone(null);
      setZoneError('');
    }
  }, [pincode]);

  async function checkPincode(code: string) {
    const { data } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('pincode', code)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setDeliveryZone(data);
      setZoneError('');
    } else {
      setDeliveryZone(null);
      setZoneError('Sorry, we do not deliver to this area yet');
    }
  }

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

  const deliveryFee = orderType === 'delivery' ? (deliveryZone?.delivery_fee ?? 0) : 0;
  const discount = appliedOffer
    ? appliedOffer.discount_type === 'percentage'
      ? Math.round(subtotal * (appliedOffer.discount_value / 100))
      : appliedOffer.discount_value
    : 0;
  const total = subtotal - discount + deliveryFee;

  const hasDetails = name.trim() && phone.trim();
  const hasAddress = orderType === 'pickup' || (address.trim() && pincode.trim() && deliveryZone);
  const currentStep = !hasDetails ? 1 : !hasAddress ? 1 : paymentMethod ? 3 : 2;

  async function handlePlaceOrder() {
    if (!user) {
      navigate('/auth', { state: { from: '/cart' } });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      showToast('Please fill in your name and phone number', 'error');
      return;
    }
    if (orderType === 'delivery' && (!address.trim() || !pincode.trim())) {
      showToast('Please fill in your delivery address', 'error');
      return;
    }
    if (orderType === 'delivery' && !deliveryZone) {
      showToast('Please enter a valid delivery pincode', 'error');
      return;
    }
    if (orderType === 'delivery' && deliveryZone && subtotal < deliveryZone.min_order) {
      showToast(`Minimum order of \u20B9${deliveryZone.min_order} required for this area`, 'error');
      return;
    }

    setSubmitting(true);

    await supabase.from('profiles').update({
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      default_address: address.trim(),
      default_pincode: pincode.trim(),
    }).eq('id', user.id);

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        address: orderType === 'delivery' ? address.trim() : '',
        pincode: orderType === 'delivery' ? pincode.trim() : '',
        order_type: orderType,
        delivery_fee: deliveryFee,
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
      <div className="section-padding py-6 animate-fade-in">
        <Link to="/menu" className="inline-flex items-center gap-2 text-[13px] text-brand-text-dim hover:text-brand-gold mb-5 transition-colors">
          <ArrowLeft size={15} />
          Back to Menu
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Your Cart <span className="text-brand-text-dim font-semibold text-lg tabular-nums">({itemCount} items)</span>
        </h1>

        <StepIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <OrderTypeBadge orderType={orderType} />
              <Link
                to="/menu"
                className="flex items-center gap-1.5 text-[13px] font-bold text-brand-gold hover:text-brand-gold-soft transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
                Add more items
              </Link>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="bg-brand-surface rounded-xl p-4 border border-white/[0.06] flex gap-4"
              >
                <img
                  src={item.menu_item.image_url}
                  alt={item.menu_item.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-[15px] leading-snug">{item.menu_item.name}</h3>
                      {item.customizations.length > 0 && (
                        <CustomizationDetails customizations={item.customizations} />
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-brand-text-dim hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center border border-brand-gold/30 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-7 text-center text-[12px] font-bold tabular-nums text-brand-gold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-brand-gold hover:bg-brand-gold/10 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="font-bold text-brand-gold tabular-nums">{'\u20B9'}{item.total_price.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {!user && (
              <div className="bg-brand-gold/5 rounded-xl p-5 border border-brand-gold/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sign in to order</h3>
                    <p className="text-[13px] text-brand-text-dim">Track orders and save your details</p>
                  </div>
                </div>
                <Link
                  to="/auth"
                  state={{ from: '/cart' }}
                  className="btn-primary w-full text-center text-[14px] py-2.5 block"
                >
                  Sign In / Create Account
                </Link>
              </div>
            )}

            <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
              <h3 className="font-bold text-white mb-3">Order Type</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-semibold transition-all ${
                    orderType === 'delivery'
                      ? 'bg-brand-gold text-brand-bg'
                      : 'bg-brand-bg text-brand-text-muted border border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <Truck size={16} strokeWidth={2.2} />
                  Home Delivery
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-[14px] font-semibold transition-all ${
                    orderType === 'pickup'
                      ? 'bg-brand-gold text-brand-bg'
                      : 'bg-brand-bg text-brand-text-muted border border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <Store size={16} strokeWidth={2.2} />
                  Collect at Shop
                </button>
              </div>
              {orderType === 'pickup' && (
                <p className="text-[13px] text-brand-text-dim mt-3 bg-brand-bg rounded-lg px-3 py-2.5 leading-relaxed">
                  Order ahead and we'll notify you when ready for pickup.
                </p>
              )}
            </div>

            <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
              <h3 className="font-bold text-white mb-3">Your Details</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Full Name *" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
                <input type="tel" placeholder="Phone Number *" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
                <input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
            </div>

            {orderType === 'delivery' && (
              <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
                <h3 className="font-bold text-white mb-3">Delivery Address</h3>
                <LocationPicker
                  address={address}
                  pincode={pincode}
                  onAddressChange={setAddress}
                  onPincodeChange={setPincode}
                />
                {zoneError && <p className="text-red-400 text-[13px] mt-2">{zoneError}</p>}
                {deliveryZone && (
                  <div className="flex items-center gap-2 mt-3 text-[13px] text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                    <MapPin size={14} strokeWidth={2.2} className="flex-shrink-0" />
                    <span>
                      {deliveryZone.area_name} &mdash;{' '}
                      <span className="tabular-nums">{'\u20B9'}{deliveryZone.delivery_fee}</span> delivery fee,{' '}
                      ~<span className="tabular-nums">{deliveryZone.estimated_time}</span> min
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
              <h3 className="font-bold text-white mb-3">Payment Method</h3>
              <div className="space-y-2">
                {([
                  { value: 'cod' as PaymentMethod, label: orderType === 'pickup' ? 'Pay at Counter' : 'Cash on Delivery', desc: orderType === 'pickup' ? 'Pay when you collect your order' : 'Pay cash when order arrives' },
                  { value: 'upi' as PaymentMethod, label: 'UPI', desc: 'Pay using any UPI app' },
                  { value: 'card' as PaymentMethod, label: 'Card', desc: 'Credit or debit card' },
                ]).map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                      paymentMethod === pm.value
                        ? 'border-brand-gold bg-brand-gold/10'
                        : 'border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === pm.value ? 'border-brand-gold bg-brand-gold' : 'border-brand-text-dim'}`}>
                      {paymentMethod === pm.value && <div className="w-full h-full rounded-full bg-brand-bg scale-[0.4]" />}
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-white block">{pm.label}</span>
                      <span className="text-[12px] text-brand-text-dim">{pm.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
              <h3 className="font-bold text-white mb-3">Coupon Code</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field pl-9"
                  />
                </div>
                <button onClick={applyCoupon} className="btn-outline px-5 py-2 text-[14px] font-semibold rounded-lg">Apply</button>
              </div>
              {couponError && <p className="text-red-400 text-[13px] mt-2">{couponError}</p>}
              {appliedOffer && (
                <div className="mt-3 bg-emerald-500/10 text-emerald-400 text-[13px] px-3 py-2.5 rounded-lg flex items-center justify-between">
                  <span className="font-semibold">{appliedOffer.title} applied!</span>
                  <button onClick={() => { setAppliedOffer(null); setCouponCode(''); }} className="font-semibold text-[13px] hover:underline">Remove</button>
                </div>
              )}
            </div>

            <div className="bg-brand-surface rounded-xl p-5 border border-white/[0.06]">
              <h3 className="font-bold text-white mb-3">Order Summary</h3>
              <div className="space-y-2.5 text-[14px]">
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
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-brand-text-muted">
                    <span className="text-[13px]">Delivery Fee</span>
                    <span className="tabular-nums">{deliveryFee > 0 ? `\u20B9${deliveryFee.toFixed(0)}` : 'Free'}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] pt-3 flex justify-between font-bold text-lg">
                  <span className="text-white">Total</span>
                  <span className="tabular-nums tracking-tight text-brand-gold">{'\u20B9'}{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="btn-primary w-full text-center text-lg py-4 rounded-xl tracking-tight"
            >
              {!user
                ? 'Sign In to Place Order'
                : submitting
                ? 'Placing Order...'
                : <>Place Order &mdash; <span className="tabular-nums">{'\u20B9'}{total.toFixed(0)}</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTypeBadge({ orderType }: { orderType: OrderType }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${
      orderType === 'pickup'
        ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
    }`}>
      {orderType === 'pickup' ? <Store size={12} strokeWidth={2.5} /> : <Truck size={12} strokeWidth={2.5} />}
      {orderType === 'pickup' ? 'Pickup' : 'Delivery'}
    </div>
  );
}

function CustomizationDetails({ customizations }: { customizations: { group_name: string; option_name: string; price: number }[] }) {
  const grouped: Record<string, string[]> = {};
  for (const c of customizations) {
    if (!grouped[c.group_name]) grouped[c.group_name] = [];
    grouped[c.group_name].push(c.option_name);
  }

  return (
    <div className="mt-1.5 space-y-0.5">
      {Object.entries(grouped).map(([group, options]) => (
        <p key={group} className="text-[12px] text-brand-text-dim leading-snug">
          <span className="text-brand-text-muted font-medium">{group}:</span>{' '}
          {options.join(', ')}
        </p>
      ))}
    </div>
  );
}
