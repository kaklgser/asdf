import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (profile) {
      if (profile.role === 'chef') {
        navigate('/chef', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [profile, navigate, from]);

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(phone.trim(), password);
      if (error) {
        showToast(error, 'error');
        setLoading(false);
        return;
      }
      showToast('Welcome back!');
    } else {
      const { error } = await signUp(phone.trim(), password, fullName.trim());
      if (error) {
        showToast(error, 'error');
        setLoading(false);
        return;
      }
      showToast('Account created successfully!');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <img
            src="/image.png"
            alt="The Supreme Waffle"
            className="h-24 w-auto object-contain"
          />
        </Link>

        <h1 className="text-2xl font-bold text-white text-center mb-1">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-brand-text-muted text-[14px] text-center mb-8">
          {mode === 'signin'
            ? 'Sign in to order your favourite waffles'
            : 'Join us for the best waffle experience'}
        </p>

        <div className="bg-brand-surface rounded-2xl border border-white/[0.06] p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 animate-fade-in"
            key={mode}
          >
            {mode === 'signup' && (
              <div>
                <label className="block text-[14px] font-semibold text-brand-text-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-field"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-[14px] font-semibold text-brand-text-muted mb-1.5">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-brand-text-dim text-[14px] pointer-events-none">
                  <Phone size={15} strokeWidth={2.2} />
                  <span className="font-semibold">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="9876543210"
                  className="input-field pl-[5rem]"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-brand-text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                  className="input-field pr-11"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} strokeWidth={2.4} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[14px] text-brand-text-dim mt-6">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-brand-gold font-semibold hover:underline underline-offset-2"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-brand-gold font-semibold hover:underline underline-offset-2"
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
