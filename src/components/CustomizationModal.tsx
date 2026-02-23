import { useState, useEffect } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import type { MenuItem, CustomizationGroup, CustomizationOption, SelectedCustomization } from '../types';
import { supabase } from '../lib/supabase';

interface Props {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (item: MenuItem, quantity: number, customizations: SelectedCustomization[]) => void;
}

export default function CustomizationModal({ item, onClose, onConfirm }: Props) {
  const [groups, setGroups] = useState<(CustomizationGroup & { options: CustomizationOption[] })[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomizations();
  }, []);

  async function loadCustomizations() {
    const { data: groupsData } = await supabase
      .from('customization_groups')
      .select('*')
      .order('display_order');

    if (groupsData) {
      const { data: optionsData } = await supabase
        .from('customization_options')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      const grouped = groupsData.map((g) => ({
        ...g,
        options: (optionsData || []).filter((o) => o.group_id === g.id),
      }));
      setGroups(grouped);
    }
    setLoading(false);
  }

  function toggleOption(groupId: string, optionId: string, selectionType: string) {
    setSelected((prev) => {
      const current = prev[groupId] || [];
      if (selectionType === 'single') {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
      }
      return {
        ...prev,
        [groupId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  }

  function getSelectedCustomizations(): SelectedCustomization[] {
    const result: SelectedCustomization[] = [];
    for (const group of groups) {
      const selectedIds = selected[group.id] || [];
      for (const optionId of selectedIds) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          result.push({ group_name: group.name, option_name: option.name, price: option.price });
        }
      }
    }
    return result;
  }

  const customizationsTotal = getSelectedCustomizations().reduce((sum, c) => sum + c.price, 0);
  const totalPrice = (item.price + customizationsTotal) * quantity;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-brand-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] sm:max-h-[90vh] flex flex-col animate-slide-up shadow-elevated border border-white/[0.06] mb-16 sm:mb-0">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h3 className="font-extrabold text-[18px] text-white">{item.name}</h3>
            <p className="text-[14px] font-semibold text-brand-text-dim">{'\u20B9'}{item.price} base price</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors">
            <X size={22} className="text-brand-text-dim" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/[0.06] rounded w-24 mb-3" />
                  <div className="space-y-2">
                    <div className="h-12 bg-white/[0.04] rounded-xl" />
                    <div className="h-12 bg-white/[0.04] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-brand-text-dim text-sm text-center py-4">No customization options available</p>
          ) : (
            groups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-bold text-[15px] text-white">{group.name}</h4>
                  <span className="text-[13px] font-semibold text-brand-text-dim">
                    {group.selection_type === 'single' ? 'Choose one' : 'Choose multiple'}
                  </span>
                  {group.is_required && (
                    <span className="text-[13px] text-brand-gold font-bold">Required</span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isSelected = (selected[group.id] || []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(group.id, option.id, group.selection_type)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-brand-gold bg-brand-gold/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-brand-gold bg-brand-gold' : 'border-brand-text-dim'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-brand-bg" />}
                          </div>
                          <span className="text-[14px] font-semibold text-white">{option.name}</span>
                        </div>
                        {option.price > 0 && (
                          <span className="text-[14px] font-bold text-brand-text-muted">+{'\u20B9'}{option.price}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 border-t border-white/[0.06] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-5 space-y-4">
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white hover:border-brand-gold/30 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-[20px] font-extrabold w-8 text-center tabular-nums text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-xl bg-brand-gold text-brand-bg flex items-center justify-center hover:brightness-110 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={() => onConfirm(item, quantity, getSelectedCustomizations())}
            className="btn-primary w-full text-center flex items-center justify-center gap-2"
          >
            <span>Add to Cart</span>
            <span className="font-extrabold">{'\u20B9'}{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
