import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_NUMBER = '9999900000';
const CHEF_NUMBER = '9999900001';
const DIRECT_LOGIN_NUMBERS = [ADMIN_NUMBER, CHEF_NUMBER];

type Step = 'phone' | 'otp';

export default function AdminLogin() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { profile, signInDirect } = useAuth();

  useEffect(() => {
    if (profile?.role === 'admin') navigate('/admin', { replace: true });
  }, [profile, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, '').slice(0, 10));
  }

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    if (DIRECT_LOGIN_NUMBERS.includes(digits)) {
      const { error: loginErr, role } = await signInDirect(digits);
      setLoading(false);
      if (loginErr) {
        setError(loginErr);
        return;
      }
      if (role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. Admin account required.');
        return;
      }
      return;
    }

    const fullPhone = `+91${digits}`;
    const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);

    if (otpErr) {
      setError(otpErr.message);
      return;
    }

    setStep('otp');
    setResendTimer(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      if (newOtp.every((d) => d !== '')) handleVerifyOtp(newOtp.join(''));
      return;
    }
    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '')) handleVerifyOtp(newOtp.join(''));
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(token?: string) {
    const code = token || otp.join('');
    if (code.length !== 6) return;

    setError('');
    setLoading(true);
    const fullPhone = `+91${phone.replace(/\D/g, '')}`;

    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: code,
      type: 'sms',
    });

    if (verifyErr || !data.user) {
      setError(verifyErr?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profileData || profileData.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. Admin account required.');
      setOtp(['', '', '', '', '', '']);
      setStep('phone');
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/admin');
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 border border-brand-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield size={40} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Login</h1>
          <p className="text-brand-text-dim text-sm mt-1.5">The Supreme Waffle Dashboard</p>
        </div>

        {step === 'phone' && (
          <div className="animate-fade-in">
            <form onSubmit={handleSendOtp} className="bg-brand-surface rounded-2xl p-6 border border-white/[0.06] space-y-4">
              {error && (
                <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20 font-medium">{error}</div>
              )}
              <div>
                <label className="block text-[13px] font-semibold text-brand-text-dim mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-dim" />
                  <input
                    type="tel"
                    placeholder="Enter admin phone number"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="input-field pl-10"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-all bg-brand-gold text-brand-bg hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-fade-in">
            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
              className="flex items-center gap-1.5 text-brand-text-dim text-[14px] mb-4 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Change number
            </button>

            <div className="bg-brand-surface rounded-2xl p-6 border border-white/[0.06] space-y-4">
              {error && (
                <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20 font-medium">{error}</div>
              )}

              <p className="text-brand-text-muted text-[14px] text-center">
                Enter OTP sent to <span className="text-white font-semibold">+91 {phone}</span>
              </p>

              <div className="flex justify-center gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-11 h-13 text-center text-xl font-bold rounded-xl bg-white/[0.06] border border-white/[0.1] text-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 outline-none transition-all"
                  />
                ))}
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 size={24} className="animate-spin text-brand-gold" />
                </div>
              )}

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-brand-text-dim text-[13px]">
                    Resend in <span className="text-brand-gold font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-brand-gold text-[14px] font-semibold hover:underline underline-offset-2"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[12px] text-brand-text-dim mt-6">
          Only authorized administrators can access this portal
        </p>
      </div>
    </div>
  );
}
