import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, ChefHat, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ChefLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

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
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ChefHat size={40} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Kitchen Login</h1>
          <p className="text-brand-text-dim text-sm mt-1.5">The Supreme Waffle - Chef Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl p-6 border border-white/[0.06] space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20 font-medium">{error}</div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-brand-text-dim mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim" />
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="input-field pl-10"
                inputMode="numeric"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-brand-text-dim mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-all bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ChefHat size={18} />
                Enter Kitchen
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[12px] text-brand-text-dim mt-6">
          Only authorized kitchen staff can access this portal
        </p>
      </div>
    </div>
  );
}
