import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft, ChefHat, Truck, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Order } from '../types';

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Clock, label: 'Pending' },
  confirmed: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CheckCircle, label: 'Confirmed' },
  preparing: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: ChefHat, label: 'Preparing' },
  packed: { color: 'text-teal-400', bg: 'bg-teal-500/10', icon: Package, label: 'Ready' },
  out_for_delivery: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Truck, label: 'On the way' },
  delivered: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle, label: 'Cancelled' },
  expired: { color: 'text-brand-text-dim', bg: 'bg-white/[0.06]', icon: Clock, label: 'Expired' },
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadOrders();

    const channel = supabase
      .channel('my-orders-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadOrders() {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled', 'expired'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled', 'expired'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-[60vh] section-padding py-10 bg-brand-bg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.06] rounded-xl w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/[0.06] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="section-padding py-10 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-brand-text-dim hover:text-brand-gold mb-8 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-10">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-brand-text-dim" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-brand-text-muted text-[14px] mb-8">Your order history will appear here</p>
            <Link to="/menu" className="btn-primary">Order Now</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {activeOrders.length > 0 && (
              <section>
                <h2 className="section-label mb-4">Active Orders</h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => {
                    const isReady = order.status === 'packed' && order.order_type === 'pickup';
                    return (
                      <Link
                        key={order.id}
                        to={`/track/${order.order_id}`}
                        className={`block bg-brand-surface rounded-xl p-5 transition-all duration-300 ${
                          isReady
                            ? 'border-2 border-brand-gold ring-2 ring-brand-gold/20'
                            : 'border border-white/[0.06]'
                        }`}
                      >
                        {isReady && (
                          <div className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold rounded-xl px-3 py-2 mb-3 animate-pulse">
                            <Bell size={16} strokeWidth={2.2} />
                            <span className="text-[14px] font-bold">Your order is ready for pickup!</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-black text-white">{order.order_id}</span>
                              <StatusBadge status={order.status} orderType={order.order_type} />
                            </div>
                            <p className="text-[12px] font-semibold text-brand-text-dim mt-1.5">
                              {new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {' '}&bull;{' '}{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                            </p>
                          </div>
                          <span className="font-bold text-brand-gold text-lg">&#8377;{order.total}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {pastOrders.length > 0 && (
              <section>
                <h2 className="section-label mb-4">Past Orders</h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/track/${order.order_id}`}
                      className="block bg-brand-surface rounded-xl border border-white/[0.06] p-5 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-white">{order.order_id}</span>
                            <StatusBadge status={order.status} orderType={order.order_type} />
                          </div>
                          <p className="text-[12px] font-semibold text-brand-text-dim mt-1.5">
                            {new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' '}&bull;{' '}{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                          </p>
                        </div>
                        <span className="font-bold text-brand-gold text-lg">&#8377;{order.total}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, orderType }: { status: string; orderType: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  let label = config.label;
  if (status === 'packed' && orderType === 'pickup') label = 'Ready for Pickup';
  if (status === 'packed' && orderType === 'delivery') label = 'Packed';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold ${config.color} ${config.bg}`}>
      <Icon size={12} strokeWidth={2.2} />
      {label}
    </span>
  );
}
