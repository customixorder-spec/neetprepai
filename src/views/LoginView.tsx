import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  GraduationCap, 
  FileCheck2, 
  CalendarClock, 
  BrainCircuit, 
  KeyRound,
  Mail,
  MailCheck,
  MailWarning,
  Target,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  HelpCircle
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { sendOtp, verifyOtp, loginWithEmailAndPassword, registerWithEmailAndPassword, resetPasswordWithOtp, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password / New Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Step state: 'credentials' | 'otp' | 'forgot_password' | 'reset_password'
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot_password' | 'reset_password'>('credentials');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [wasSentViaEmail, setWasSentViaEmail] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [showSmtpGuide, setShowSmtpGuide] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timer for resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Request OTP before completing registration or login
  const handleInitiateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    if (!cleanEmail.endsWith('@gmail.com')) {
      setError('Only @gmail.com email addresses are permitted.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (isRegistering && !name.trim()) {
      setError('Please enter your full name.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await sendOtp(cleanEmail);
      if (result.success) {
        setSentOtpCode(result.otpCode || null);
        setWasSentViaEmail(!!result.sentViaEmail);
        setOtpMessage(result.message || `OTP sent to ${cleanEmail}`);
        setStep('otp');
        setOtpDigits(['', '', '', '', '', '']);
        setResendCountdown(30);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await sendOtp(email.trim().toLowerCase());
      if (result.success) {
        setSentOtpCode(result.otpCode || null);
        setWasSentViaEmail(!!result.sentViaEmail);
        setOtpMessage(`New OTP code sent to ${email.trim().toLowerCase()}`);
        setResendCountdown(30);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError('Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit change
  const handleOtpDigitChange = (index: number, value: string) => {
    if (error) setError(null);
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted whole code into single input
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const lastInput = document.getElementById(`otp-input-5`);
      if (lastInput) lastInput.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto focus next input
    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (text.length >= 6) {
      e.preventDefault();
      const six = text.slice(0, 6).split('');
      setOtpDigits(six);
      if (error) setError(null);
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleFillCode = (code: string) => {
    const digits = code.replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length === 6) {
      setOtpDigits(digits);
      if (error) setError(null);
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Submit OTP Verification
  const handleVerifyOtpAndAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify OTP
      const verifyRes = await verifyOtp(email, otpValue);
      if (!verifyRes.success) {
        setError(verifyRes.error || 'Invalid OTP code.');
        setIsLoading(false);
        return;
      }

      // Step 2: Complete Login or Registration after OTP verified!
      if (isRegistering) {
        const result = await registerWithEmailAndPassword(name, email, password);
        if (!result.success && result.error) {
          setError(result.error);
        }
      } else {
        const result = await loginWithEmailAndPassword(email, password);
        if (!result.success && result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send Forgot Password OTP
  const handleSendForgotPasswordOtp = async (targetEmail?: string) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase();
    setError(null);
    
    if (!cleanEmail) {
      setError('Please enter your @gmail.com email address.');
      return;
    }
    if (!cleanEmail.endsWith('@gmail.com')) {
      setError('Only @gmail.com email addresses are permitted.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOtp(cleanEmail);
      if (result.success) {
        setEmail(cleanEmail);
        setSentOtpCode(result.otpCode || null);
        setWasSentViaEmail(!!result.sentViaEmail);
        setOtpMessage(result.message || `Password reset OTP code sent to ${cleanEmail}`);
        setStep('reset_password');
        setOtpDigits(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirmPassword('');
        setResendCountdown(30);
      } else {
        setError(result.error || 'Failed to send OTP code.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP & Reset Password
  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordWithOtp(email, otpValue, newPassword);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success && result.error && !result.isCancelled) {
        setError(result.error);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Google Sign-In could not be completed. Please try again or use email verification.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Product Value & Features */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>NEET Prep AI • Ultimate Medical Entrance Companion</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight font-sans">
            Crack NEET UG with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">NCERT-Focused AI</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Extract NTA-pattern MCQs from NCERT PDFs, attempt timed mock tests with +4 / -1 negative marking, and generate personalized 7-day NEET study timetables for Physics, Chemistry, Botany, and Zoology.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">NCERT PDF & Photo Extractor</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant NTA MCQs with line-by-line textbook references.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">7-Day Smart Revision Schedule</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Personalized study timetable targeting high-yield exam chapters.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">NTA Pattern Exam Simulator</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Full timed mock papers with real +4 / -1 score breakdown.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">AI Mistake Notebook & Analytics</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Auto-tag weak subtopics and track accuracy across Physics, Chem & Bio.</p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Authentication Form Card */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative">
            
            {step === 'credentials' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center justify-between">
                    <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> OTP Protected
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRegistering 
                      ? 'Register with your @gmail.com address to start practicing.'
                      : 'Sign in to access your personalized NEET UG practice workspace.'
                    }
                  </p>
                </div>

                {/* Error Notification Callout */}
                {error && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed flex-1">{error}</span>
                    </div>
                    {error.toLowerCase().includes('password') && (
                      <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-200">Incorrect password? Verify with OTP:</span>
                        <button
                          type="button"
                          onClick={() => handleSendForgotPasswordOtp(email)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                          <span>Verify & Reset via OTP</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleInitiateAuth} className="space-y-4">
                  
                  {isRegistering && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-indigo-400 font-normal">Must be @gmail.com</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="student@gmail.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      {!isRegistering && (
                        <button
                          type="button"
                          onClick={() => {
                            setStep('forgot_password');
                            setError(null);
                          }}
                          className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {isRegistering && (
                      <p className="text-[10px] text-slate-500 mt-1">Must be at least 6 characters long.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isRegistering ? 'Send OTP & Register' : 'Send OTP & Sign In'}</span>
                      </>
                    )}
                  </button>

                </form>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.8-1.5-1.2-3.1-1.2-4.6z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Sign in with Google Account</span>
                </button>

                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors font-medium underline underline-offset-4 cursor-pointer"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'New NEET Aspirant? Click here to Register'}
                  </button>
                </div>
              </>
            ) : step === 'forgot_password' ? (
              /* Forgot Password Request Screen */
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                    Forgot Password
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-400" />
                    <span>Reset Password with OTP</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Enter your registered @gmail.com address below to receive a 6-digit OTP code on your email to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSendForgotPasswordOtp(); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Registered Email Address</span>
                      <span className="text-[10px] text-indigo-400 font-normal">Must be @gmail.com</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="student@gmail.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send OTP Code to Email</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : step === 'reset_password' ? (
              /* OTP Verification & Set New Password Screen */
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancel & Return
                  </button>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                    OTP Reset Active
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Verify OTP & Set New Password</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    A 6-digit OTP code was sent to <strong className="text-indigo-300">{email}</strong>. Enter the OTP code and set your new password below.
                  </p>
                </div>

                {/* OTP Delivery Status: Real Gmail Inbox or Setup Guide */}
                {wasSentViaEmail ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 space-y-2 text-xs animate-fadeIn shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <MailCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>OTP Dispatched to Gmail Inbox</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          A 6-digit verification code has been sent directly to <strong className="text-white">{email}</strong>. Check your inbox or Spam/Promotions folder.
                        </p>
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Gmail Inbox</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <MailWarning className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-300 flex items-center justify-between">
                          <span>SMTP Delivery Setup</span>
                          <button
                            type="button"
                            onClick={() => setShowSmtpGuide(!showSmtpGuide)}
                            className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer underline"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>{showSmtpGuide ? 'Hide Guide' : 'Setup Guide'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          To deliver real OTP emails to <strong className="text-indigo-200">{email}</strong>, set <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_USER</code> and <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_PASS</code> in Settings.
                        </p>
                      </div>
                    </div>

                    {showSmtpGuide && (
                      <div className="mt-2 pt-2.5 border-t border-indigo-800/60 text-[11px] text-slate-300 space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl">
                        <div className="font-bold text-indigo-200 text-xs flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-indigo-400" />
                          <span>How to setup Gmail SMTP (1 Minute):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                          <li>Open Google Account Security and ensure <strong>2-Step Verification</strong> is ON.</li>
                          <li>Go to Google App Passwords and create a 16-character password for "NEET Prep".</li>
                          <li>In App Settings / Secrets, add <code className="text-amber-300 font-mono">SMTP_USER</code> and <code className="text-amber-300 font-mono">SMTP_PASS</code>.</li>
                        </ol>
                      </div>
                    )}

                    {sentOtpCode && (
                      <div className="pt-2 border-t border-indigo-800/40 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          Sandbox Test Code: <span className="font-mono font-bold text-indigo-300 tracking-wider">{sentOtpCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFillCode(sentOtpCode)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Auto-Fill Code
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtpAndResetPassword} onPaste={handlePasteOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                      6-Digit OTP Verification Code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl bg-slate-950 border border-slate-800 text-center text-lg sm:text-xl font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors p-0.5 font-sans"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Resetting Password & Logging In...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify OTP & Save New Password</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Didn't receive the OTP code?</span>
                  <button
                    type="button"
                    onClick={() => handleSendForgotPasswordOtp(email)}
                    disabled={resendCountdown > 0 || isLoading}
                    className="font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: OTP Verification Screen */
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Email
                  </button>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-2.5 py-0.5 rounded-full">
                    Step 2 of 2
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>Enter 6-Digit OTP</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {wasSentViaEmail 
                      ? <>A 6-digit security code was dispatched directly to your inbox <strong className="text-indigo-300">{email}</strong>.</>
                      : <>A 6-digit security code was generated for <strong className="text-indigo-300">{email}</strong> to verify your account.</>}
                  </p>
                </div>

                {/* OTP Delivery Status: Real Gmail Inbox or Setup Guide */}
                {wasSentViaEmail ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 space-y-2 text-xs animate-fadeIn shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <MailCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>OTP Dispatched to Gmail Inbox</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          A 6-digit verification code has been sent directly to <strong className="text-white">{email}</strong>. Check your inbox or Spam/Promotions folder.
                        </p>
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Gmail Inbox</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <MailWarning className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-amber-300 flex items-center justify-between">
                          <span>SMTP Delivery Setup</span>
                          <button
                            type="button"
                            onClick={() => setShowSmtpGuide(!showSmtpGuide)}
                            className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer underline"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>{showSmtpGuide ? 'Hide Guide' : 'Setup Guide'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          To deliver real OTP emails to <strong className="text-indigo-200">{email}</strong>, set <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_USER</code> and <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_PASS</code> in Settings.
                        </p>
                      </div>
                    </div>

                    {showSmtpGuide && (
                      <div className="mt-2 pt-2.5 border-t border-indigo-800/60 text-[11px] text-slate-300 space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl">
                        <div className="font-bold text-indigo-200 text-xs flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-indigo-400" />
                          <span>How to setup Gmail SMTP (1 Minute):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                          <li>Open Google Account Security and ensure <strong>2-Step Verification</strong> is ON.</li>
                          <li>Go to Google App Passwords and create a 16-character password for "NEET Prep".</li>
                          <li>In App Settings / Secrets, add <code className="text-amber-300 font-mono">SMTP_USER</code> and <code className="text-amber-300 font-mono">SMTP_PASS</code>.</li>
                        </ol>
                      </div>
                    )}

                    {sentOtpCode && (
                      <div className="pt-2 border-t border-indigo-800/40 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          Sandbox Test Code: <span className="font-mono font-bold text-indigo-300 tracking-wider">{sentOtpCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFillCode(sentOtpCode)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          Auto-Fill Code
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Callout */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtpAndAuthenticate} onPaste={handlePasteOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                      Verification Code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-11 sm:h-13 rounded-xl bg-slate-950 border border-slate-800 text-center text-lg sm:text-xl font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying OTP & Logging in...</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-4 h-4" />
                        <span>Verify OTP & Complete {isRegistering ? 'Registration' : 'Sign In'}</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || isLoading}
                    className="font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};


