import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, Copy, RotateCcw, Store, Truck, ChefHat, Users, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { useToast } from '../components/Toast';
import { playOrderSound, playOrderCompleteSound } from '../lib/sounds';

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    playOrderSound();
  }, []);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!order) return;

    if (prevStatusRef.current && prevStatusRef.current !== order.status) {
      if (order.status === 'preparing') {
        showToast('Chef accepted your order!');
      } else if (order.status === 'packed') {
        playOrderCompleteSound();
        showToast('Your order is ready!');
      }
    }
    prevStatusRef.current = order.status;

    const channel = supabase
      .channel(`order-${order.order_id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_id=eq.${order.order_id}` }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.order_id, order?.status]);

  async function loadOrder() {
    if (!orderId) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    if (data) setOrder(data);
    setLoading(false);
  }

  function copyOrderId() {
    if (order) {
      navigator.clipboard.writeText(order.order_id);
      showToast('Order ID copied!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-brand-bg">
        <div className="animate-pulse text-center">
          <div className="w-20 h-20 bg-white/[0.06] rounded-full mx-auto mb-6" />
          <div className="h-6 bg-white/[0.06] rounded-2xl w-44 mx-auto mb-3" />
          <div className="h-4 bg-white/[0.06] rounded-2xl w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center section-padding text-center bg-brand-bg">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Order Not Found</h2>
        <p className="text-brand-text-muted text-[14px] mb-6">We couldn't find an order with that ID</p>
        <Link to="/menu" className="btn-primary">Browse Menu</Link>
      </div>
    );
  }

  const isExpired = order.status === 'expired';
  const isPending = order.status === 'pending';
  const isPickup = order.order_type === 'pickup';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'packed';
  const isDelivered = order.status === 'delivered';
  const isConfirmed = order.status !== 'pending' && order.status !== 'expired' && order.status !== 'cancelled';

  return (
    <div className="min-h-[60vh] flex items-center justify-center section-padding py-12 bg-brand-bg">
      <div className="max-w-md w-full text-center animate-fade-in">

        {isReady && (
          <>
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Bell size={40} className="text-emerald-400 animate-bounce" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Your Order is Complete!</h1>
            <p className="text-brand-text-muted mb-8">
              Come and pick up your order at the counter.
            </p>
          </>
        )}

        {isPreparing && (
          <>
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <ChefHat size={40} className="text-amber-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Your Order is Being Prepared!</h1>
            <p className="text-brand-text-muted mb-8">
              Our chef is making your order fresh. {order.estimated_minutes ? `Please wait about ${order.estimated_minutes} minutes.` : ''}
            </p>
          </>
        )}

        {isPending && (
          <>
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Users size={40} className="text-orange-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Order Placed!</h1>
            <p className="text-brand-text-muted mb-8">Your order is in queue. Waiting for chef to accept.</p>
          </>
        )}

        {isDelivered && (
          <>
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
              {isPickup ? 'Order Picked Up!' : 'Order Delivered!'}
            </h1>
            <p className="text-brand-text-muted mb-8">Enjoy your waffles!</p>
          </>
        )}

        {isConfirmed && !isPreparing && !isReady && !isDelivered && (
          <>
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Order Confirmed!</h1>
            <p className="text-brand-text-muted mb-8">
              {isPickup
                ? 'Your waffles are being prepared. We will notify you when ready.'
                : 'Your waffles are being prepared and will be delivered soon.'}
            </p>
          </>
        )}

        {isExpired && (
          <>
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Clock size={40} className="text-orange-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">Order Expired</h1>
            <p className="text-brand-text-muted mb-8">The restaurant could not confirm in time</p>
          </>
        )}

        <div className="rounded-2xl border p-6 mb-6 animate-scale-in bg-brand-surface border-white/[0.06]">
          {isPickup && !isExpired && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Store size={16} className="text-brand-gold" />
              <span className="text-[14px] font-bold text-brand-gold uppercase tracking-wider">Pickup Order</span>
            </div>
          )}

          {!isPickup && !isExpired && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Truck size={16} className="text-sky-400" />
              <span className="text-[14px] font-bold text-sky-400 uppercase tracking-wider">Delivery Order</span>
            </div>
          )}

          <p className="text-[12px] font-semibold text-brand-text-dim uppercase tracking-wider mb-2">
            {isPickup ? 'Show this at the counter' : 'Order ID'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className={`font-black tracking-wider tabular-nums ${
              isPickup ? 'text-4xl text-brand-gold' : 'text-3xl text-white'
            }`}>
              {order.order_id}
            </span>
            <button onClick={copyOrderId} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors text-brand-text-dim hover:text-brand-text-muted">
              <Copy size={18} strokeWidth={2.2} />
            </button>
          </div>

          {isPending && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-orange-500/10 rounded-2xl px-4 py-3 border border-orange-500/20">
              <Users size={16} className="text-orange-400" />
              <span className="text-[14px] font-bold text-orange-400">In Queue - Waiting for chef</span>
            </div>
          )}

          {isPreparing && order.estimated_minutes && (
            <div className="mt-4 flex items-center justify-center gap-2 bg-amber-500/10 rounded-2xl px-4 py-3 border border-amber-500/20">
              <ChefHat size={16} className="text-amber-400" />
              <span className="text-[14px] font-bold tabular-nums text-amber-400">
                Preparing - ~{order.estimated_minutes} min
              </span>
            </div>
          )}

          {isReady && (
            <div className="mt-4 bg-emerald-500/10 rounded-2xl px-4 py-3 border border-emerald-500/20">
              <p className="text-[14px] text-emerald-400 font-bold flex items-center justify-center gap-2">
                <Bell size={16} />
                Your order is complete! Pick it up now.
              </p>
            </div>
          )}

          {isPending && (
            <div className="mt-4 bg-orange-500/5 rounded-2xl px-4 py-3">
              <p className="text-[14px] text-brand-text-muted font-semibold">
                Your order is in the queue. Our chef will accept it shortly.
              </p>
            </div>
          )}

          {isPreparing && (
            <div className="mt-4 bg-amber-500/5 rounded-2xl px-4 py-3">
              <p className="text-[14px] text-brand-text-muted font-semibold">
                Sit back and relax! Your food is being freshly prepared.
              </p>
            </div>
          )}

          {!isPickup && isConfirmed && !isPreparing && !isReady && !isDelivered && (
            <div className="mt-4 bg-sky-500/10 rounded-2xl px-4 py-3 border border-sky-500/20">
              <p className="text-[14px] text-sky-400 font-semibold">
                {order.status === 'out_for_delivery'
                  ? 'Our delivery partner is on the way with your waffles!'
                  : 'Your order is being prepared and will be delivered soon.'}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-[14px] text-brand-text-muted">
            <div className="flex justify-between mb-1">
              <span>Total</span>
              <span className="font-bold text-brand-gold tabular-nums">{'\u20B9'}{order.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="capitalize text-white">
                {order.payment_method === 'cod'
                  ? (isPickup ? 'Pay at Counter' : 'Cash on Delivery')
                  : order.payment_method.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {(isConfirmed || isPending) && (
            <Link to={`/track/${order.order_id}`} className="btn-primary w-full text-center">
              Track Order
            </Link>
          )}
          {isExpired && (
            <Link to="/menu" className="btn-primary w-full text-center flex items-center justify-center gap-2">
              <RotateCcw size={18} strokeWidth={2.2} />
              Order Again
            </Link>
          )}
          <Link to="/menu" className="btn-outline w-full text-center">
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
