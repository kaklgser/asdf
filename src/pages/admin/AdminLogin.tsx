import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Phone } from 'lucide-react';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(phone, password);
    if (err) setError(err);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/image.png" alt="Logo" className="w-14 h-14 rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-white">Admin Login</h1>
          <p className="text-brand-text-dim text-sm mt-1">The Supreme Waffle Dashboard</p>
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

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
