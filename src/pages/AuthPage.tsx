import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

type Step = 'phone' | 'otp' | 'profile';

export default function AuthPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { sendOtp, verifyOtp, completeProfile, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (profile && profile.full_name) {
      if (profile.role === 'chef') {
        navigate('/chef', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [profile, navigate, from]);

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
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    const { error } = await sendOtp(digits);
    setLoading(false);

    if (error) {
      showToast(error, 'error');
      return;
    }

    showToast('OTP sent to your phone');
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
      if (newOtp.every((d) => d !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(token?: string) {
    const code = token || otp.join('');
    if (code.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }

    setLoading(true);
    const { error, isNewUser } = await verifyOtp(phone, code);
    setLoading(false);

    if (error) {
      showToast(error, 'error');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      return;
    }

    if (isNewUser) {
      setStep('profile');
    } else {
      showToast('Welcome back!');
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    setLoading(true);
    const { error } = await completeProfile(fullName.trim(), email.trim());
    setLoading(false);

    if (error) {
      showToast(error, 'error');
      return;
    }

    showToast('Account created successfully!');
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    await handleSendOtp();
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

        {step === 'phone' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white text-center mb-1">Welcome</h1>
            <p className="text-brand-text-muted text-[14px] text-center mb-8">
              Enter your mobile number to continue
            </p>

            <div className="bg-brand-surface rounded-2xl border border-white/[0.06] p-6">
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 mt-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-fade-in">
            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
              className="flex items-center gap-1.5 text-brand-text-dim text-[14px] mb-5 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Change number
            </button>

            <h1 className="text-2xl font-bold text-white text-center mb-1">Verify OTP</h1>
            <p className="text-brand-text-muted text-[14px] text-center mb-8">
              Enter the 6-digit code sent to{' '}
              <span className="text-white font-semibold">+91 {phone}</span>
            </p>

            <div className="bg-brand-surface rounded-2xl border border-white/[0.06] p-6">
              <div className="flex justify-center gap-2.5 mb-6">
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
                <div className="flex justify-center mb-4">
                  <Loader2 size={24} className="animate-spin text-brand-gold" />
                </div>
              )}

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-brand-text-dim text-[13px]">
                    Resend OTP in <span className="text-brand-gold font-semibold">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
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

        {step === 'profile' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white text-center mb-1">Complete Your Profile</h1>
            <p className="text-brand-text-muted text-[14px] text-center mb-8">
              Just a few details to get started
            </p>

            <div className="bg-brand-surface rounded-2xl border border-white/[0.06] p-6">
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div>
                  <label className="block text-[14px] font-semibold text-brand-text-muted mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="input-field"
                    autoComplete="name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-brand-text-muted mb-1.5">
                    Email <span className="text-brand-text-dim font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !fullName.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 mt-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
