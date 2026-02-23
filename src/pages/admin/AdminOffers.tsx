import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Offer } from '../../types';

interface OfferForm {
  id?: string;
  title: string;
  description: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: string;
  min_order: string;
  is_active: boolean;
}

const emptyOffer: OfferForm = {
  title: '', description: '', code: '', discount_type: 'percentage',
  discount_value: '10', min_order: '200', is_active: true,
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OfferForm | null>(null);

  useEffect(() => { loadOffers(); }, []);

  async function loadOffers() {
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setOffers(data || []);
    setLoading(false);
  }

  async function saveOffer() {
    if (!editing || !editing.title.trim() || !editing.code.trim()) return;
    const payload = {
      title: editing.title.trim(),
      description: editing.description.trim(),
      code: editing.code.trim().toUpperCase(),
      discount_type: editing.discount_type,
      discount_value: parseFloat(editing.discount_value) || 0,
      min_order: parseFloat(editing.min_order) || 0,
      is_active: editing.is_active,
    };

    if (editing.id) {
      await supabase.from('offers').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('offers').insert(payload);
    }
    setEditing(null);
    loadOffers();
  }

  async function deleteOffer(id: string) {
    await supabase.from('offers').delete().eq('id', id);
    loadOffers();
  }

  if (loading) {
    return <div className="animate-pulse"><div className="h-8 bg-brand-surface rounded w-32 mb-4" /><div className="h-40 bg-brand-surface rounded-xl" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Offers</h1>
        <button onClick={() => setEditing({ ...emptyOffer })} className="flex items-center gap-1 text-sm text-brand-gold font-semibold">
          <Plus size={16} /> Add Offer
        </button>
      </div>

      {editing && (
        <div className="bg-brand-surface rounded-xl border border-white/[0.06] p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Offer Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input-field" />
            <input placeholder="Coupon Code" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="input-field" />
            <select value={editing.discount_type} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as 'percentage' | 'flat' })} className="input-field">
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
            <input placeholder="Discount Value" type="number" value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: e.target.value })} className="input-field" />
            <input placeholder="Min Order" type="number" value={editing.min_order} onChange={(e) => setEditing({ ...editing, min_order: e.target.value })} className="input-field" />
            <label className="flex items-center gap-2 text-sm text-brand-text-muted">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded" />
              Active
            </label>
          </div>
          <textarea placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input-field resize-none" rows={2} />
          <div className="flex gap-2">
            <button onClick={saveOffer} className="btn-primary text-sm px-4 py-2 flex items-center gap-1"><Save size={14} />{editing.id ? 'Update' : 'Add'}</button>
            <button onClick={() => setEditing(null)} className="btn-outline text-sm px-4 py-2 flex items-center gap-1"><X size={14} />Cancel</button>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="bg-brand-surface rounded-xl border border-white/[0.06] p-10 text-center text-brand-text-muted">No offers</div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-brand-surface rounded-xl border border-white/[0.06] p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-brand-gold font-black text-sm">
                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{offer.title}</h3>
                  <span className="bg-white/[0.06] text-brand-text-muted text-xs px-2 py-0.5 rounded font-mono">{offer.code}</span>
                  {!offer.is_active && <span className="text-xs text-brand-text-dim">Inactive</span>}
                </div>
                <p className="text-xs text-brand-text-muted truncate">{offer.description}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing({
                    id: offer.id, title: offer.title, description: offer.description,
                    code: offer.code, discount_type: offer.discount_type,
                    discount_value: String(offer.discount_value), min_order: String(offer.min_order),
                    is_active: offer.is_active,
                  })}
                  className="p-2 hover:bg-white/[0.06] rounded text-brand-text-dim hover:text-white"
                >
                  <Save size={14} />
                </button>
                <button onClick={() => deleteOffer(offer.id)} className="p-2 hover:bg-red-500/10 rounded text-brand-text-dim hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
