import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, MenuItem } from '../types';
import ProductCard from '../components/ProductCard';
import CustomizationModal from '../components/CustomizationModal';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/Toast';
import { playAddToCartSound } from '../lib/sounds';

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [vegOnly, setVegOnly] = useState(false);
  const [egglessOnly, setEgglessOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high'>('popular');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [catRes, itemRes] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('menu_items').select('*').order('display_order'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (itemRes.data) setItems(itemRes.data);
    setLoading(false);
  }

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeCategory !== 'all') {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) result = result.filter((i) => i.category_id === cat.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (vegOnly) result = result.filter((i) => i.is_veg);
    if (egglessOnly) result = result.filter((i) => i.is_eggless);
    switch (sortBy) {
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => b.rating - a.rating);
    }
    return result;
  }, [items, categories, activeCategory, search, vegOnly, egglessOnly, sortBy]);

  function handleCategoryChange(slug: string) {
    setActiveCategory(slug);
    if (slug === 'all') { searchParams.delete('category'); } else { searchParams.set('category', slug); }
    setSearchParams(searchParams);
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="bg-brand-bg/95 backdrop-blur-xl border-b border-white/[0.06] sticky top-[60px] lg:top-[68px] z-30">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gold" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search waffles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-11 text-[15px] font-medium"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-white transition-colors">
                  <X size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-brand-gold text-brand-bg'
                  : 'bg-brand-surface text-brand-text-muted border border-white/[0.06] hover:border-white/10'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-brand-gold text-brand-bg'
                    : 'bg-brand-surface text-brand-text-muted border border-white/[0.06] hover:border-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                vegOnly ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-brand-surface text-brand-text-dim border border-white/[0.06]'
              }`}
            >
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
              Veg
            </button>
            <button
              onClick={() => setEgglessOnly(!egglessOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                egglessOnly ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30' : 'bg-brand-surface text-brand-text-dim border border-white/[0.06]'
              }`}
            >
              Eggless
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-brand-text-dim" strokeWidth={2.5} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-[13px] bg-transparent font-bold text-brand-text-muted focus:outline-none cursor-pointer"
            >
              <option value="popular">Popular</option>
              <option value="price_low">Price: Low</option>
              <option value="price_high">Price: High</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-brand-surface rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-brand-text-dim" strokeWidth={2.5} />
            </div>
            <h3 className="text-[17px] font-bold text-white mb-1.5">No waffles found</h3>
            <p className="text-brand-text-dim text-[14px] font-medium">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredItems.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={setSelectedItem} />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={(item, qty, customizations) => {
            addItem(item, qty, customizations);
            setSelectedItem(null);
            playAddToCartSound();
            showToast(`${item.name} added to cart!`);
          }}
        />
      )}
    </div>
  );
}
