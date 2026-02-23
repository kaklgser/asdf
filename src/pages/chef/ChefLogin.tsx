import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ChefHat } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ChefLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const digits = phone.replace(/\D/g, '');
    const email = `${digits}@supremewaffle.app`;

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError('Invalid phone number or password');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile || (profile.role !== 'chef' && profile.role !== 'admin')) {
      await supabase.auth.signOut();
      setError('Access denied. Chef account required.');
      setLoading(false);
      return;
    }

    navigate('/chef');
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Chef Login</h1>
          <p className="text-brand-text-dim text-sm mt-1">The Supreme Waffel Kitchen</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl p-6 border border-white/[0.06] shadow-sm space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-all bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Enter Kitchen'}
          </button>
        </form>
      </div>
    </div>
  );
}
