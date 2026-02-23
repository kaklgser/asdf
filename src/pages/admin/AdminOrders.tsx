import { useState, useEffect } from 'react';
import { Check, X, ChevronRight, Truck, Store, Filter, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderStatus, OrderType } from '../../types';

const pickupFlow: OrderStatus[] = ['confirmed', 'preparing', 'packed', 'delivered'];
const deliveryFlow: OrderStatus[] = ['confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered'];

const PREP_TIME_OPTIONS = [5, 10, 15, 20, 25, 30, 45, 60];

function getNextStatus(order: Order): OrderStatus | null {
  const flow = order.order_type === 'pickup' ? pickupFlow : deliveryFlow;
  const currentIdx = flow.indexOf(order.status as OrderStatus);
  if (currentIdx === -1 || currentIdx >= flow.length - 1) return null;
  return flow[currentIdx + 1];
}

function statusLabel(status: string, orderType: OrderType): string {
  if (orderType === 'pickup') {
    if (status === 'packed') return 'Ready';
    if (status === 'delivered') return 'Picked Up';
    if (status === 'out_for_delivery') return 'Ready';
  }
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status] || status;
}

function nextActionLabel(nextStatus: OrderStatus, orderType: OrderType): string {
  if (orderType === 'pickup') {
    if (nextStatus === 'packed') return 'Mark Ready';
    if (nextStatus === 'delivered') return 'Mark Picked Up';
  }
  const labels: Record<string, string> = {
    confirmed: 'Confirm',
    preparing: 'Start Preparing',
    packed: 'Mark Packed',
    out_for_delivery: 'Send for Delivery',
    delivered: 'Mark Delivered',
  };
  return labels[nextStatus] || nextStatus;
}

function statusColor(status: string, orderType: OrderType): string {
  if (orderType === 'pickup' && status === 'packed') return 'bg-green-500/10 text-green-400';
  if (status === 'delivered') return 'bg-green-500/10 text-green-400';
  if (status === 'cancelled' || status === 'expired') return 'bg-red-500/10 text-red-400';
  if (status === 'pending') return 'bg-orange-500/10 text-orange-400';
  if (status === 'preparing') return 'bg-yellow-500/10 text-yellow-400';
  return 'bg-blue-500/10 text-blue-400';
}

function ConfirmPanel({ onCancel, onConfirm }: {
  onCancel: () => void;
  onConfirm: (minutes: number) => void;
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(15);

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3">
      <div>
        <p className="text-xs font-semibold text-brand-text-dim mb-2 flex items-center gap-1">
          <Clock size={12} />
          Estimated prep time
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PREP_TIME_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMinutes(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedMinutes === m
                  ? 'bg-brand-gold text-brand-bg border-brand-gold'
                  : 'bg-brand-surface-light text-brand-text-muted border-brand-gold/20 hover:border-brand-gold/40'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1" />
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 border border-white/[0.06] rounded-lg text-xs font-medium text-brand-text-muted hover:border-red-500/30 hover:text-red-400 transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedMinutes)}
          className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
        >
          <Check size={14} />
          Confirm ({selectedMinutes} min)
        </button>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('placed_at', { ascending: false })
      .limit(100);
    setOrders(data || []);
    setLoading(false);
  }

  async function confirmWithTime(orderId: string, minutes: number) {
    await supabase.from('orders').update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      estimated_minutes: minutes,
    }).eq('id', orderId);
    setConfirmingId(null);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  }

  async function cancelOrder(orderId: string) {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    setConfirmingId(null);
  }

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  }

  function getExpiryRemaining(expiresAt: string) {
    const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    if (remaining <= 0) return 'Expired';
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery'];

  const filteredOrders = orders.filter((o) => {
    const typeMatch = typeFilter === 'all' || o.order_type === typeFilter;
    const statusMatch =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? activeStatuses.includes(o.status) :
      o.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const pickupCount = orders.filter((o) => o.order_type === 'pickup' && activeStatuses.includes(o.status)).length;
  const deliveryCount = orders.filter((o) => o.order_type === 'delivery' && activeStatuses.includes(o.status)).length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-brand-surface rounded w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-brand-surface rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Orders</h1>
        <button onClick={loadOrders} className="text-sm text-brand-gold font-semibold hover:underline">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          { value: 'all', label: 'All Orders', icon: Filter },
          { value: 'pickup', label: `Pickup (${pickupCount})`, icon: Store },
          { value: 'delivery', label: `Delivery (${deliveryCount})`, icon: Truck },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              typeFilter === t.value
                ? 'bg-brand-gold text-brand-bg shadow-sm'
                : 'bg-brand-surface text-brand-text-muted border border-white/[0.06] hover:bg-brand-surface-light'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['active', 'all', 'pending', 'confirmed', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'expired'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              statusFilter === s ? 'bg-brand-gold text-brand-bg' : 'bg-brand-surface text-brand-text-muted border border-white/[0.06] hover:bg-brand-surface-light'
            }`}
          >
            {s === 'active' ? 'Active' : s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-brand-surface rounded-xl border border-white/[0.06] p-10 text-center text-brand-text-muted">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order);
            const isTerminal = ['cancelled', 'expired', 'delivered'].includes(order.status);
            const isPickupReady = order.order_type === 'pickup' && order.status === 'packed';
            const isConfirming = confirmingId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-brand-surface rounded-xl border p-4 transition-all ${
                  isPickupReady ? 'border-green-500/30 ring-1 ring-green-500/20' : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-lg text-white">{order.order_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(order.status, order.order_type)}`}>
                        {statusLabel(order.status, order.order_type)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.order_type === 'pickup'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}>
                        {order.order_type === 'pickup' ? <Store size={11} /> : <Truck size={11} />}
                        {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                      </span>
                    </div>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                      {order.customer_name} &bull; {order.customer_phone}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-white">₹{order.total}</p>
                    <p className="text-xs text-brand-text-dim">{getTimeAgo(order.placed_at)}</p>
                  </div>
                </div>

                {order.order_type === 'delivery' && order.address && (
                  <p className="text-xs text-brand-text-dim mb-3 truncate">
                    Delivery: {order.address}, {order.pincode}
                  </p>
                )}

                {order.estimated_minutes && ['confirmed', 'preparing'].includes(order.status) && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-brand-text-muted">
                    <Clock size={12} />
                    <span>Est. {order.estimated_minutes} min prep time</span>
                  </div>
                )}

                {isPickupReady && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                    <span className="text-sm text-green-400 font-semibold">Ready for customer pickup</span>
                  </div>
                )}

                {order.status === 'pending' && !isConfirming && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-orange-400 font-medium">
                      Expires: {getExpiryRemaining(order.expires_at)}
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-white/[0.06] rounded-lg text-xs font-medium text-brand-text-muted hover:border-red-500/30 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={() => setConfirmingId(order.id)}
                      className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <Check size={14} />
                      Confirm
                    </button>
                  </div>
                )}

                {order.status === 'pending' && isConfirming && (
                  <ConfirmPanel
                    onCancel={() => cancelOrder(order.id)}
                    onConfirm={(minutes) => confirmWithTime(order.id, minutes)}
                  />
                )}

                {!isTerminal && order.status !== 'pending' && nextStatus && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex-1" />
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-white/[0.06] rounded-lg text-xs font-medium text-brand-text-muted hover:border-red-500/30 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isPickupReady
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-brand-gold text-brand-bg hover:bg-brand-gold-soft'
                      }`}
                    >
                      <ChevronRight size={14} />
                      {nextActionLabel(nextStatus, order.order_type)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
