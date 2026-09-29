import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard, AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleSignInSection } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-4
}

const STRENGTH = [
  { label: 'Too short', color: 'bg-red-400' },
  { label: 'Weak', color: 'bg-red-400' },
  { label: 'Okay', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-emerald-400' },
  { label: 'Strong', color: 'bg-emerald-400' },
];

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const strength = form.password.length < 8 ? 0 : passwordStrength(form.password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name';
    if (!EMAIL_PATTERN.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const user = await register({ ...form, name: form.name.trim() });
      toast.success(`Welcome to InterviewNest, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        subtitle="Start practising with your AI interviewer"
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field icon={UserRound} label="Full name" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />
          <Field icon={Mail} label="Email address" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
          <div>
            <Field icon={Lock} label="Password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} error={errors.password} />
            {form.password && !errors.password && (
              <div className="mt-2.5 flex items-center gap-3 px-1" aria-live="polite">
                <div className="flex flex-1 gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <span key={level} className={cn('h-1 flex-1 rounded-full', level <= strength ? STRENGTH[strength].color : 'bg-white/10')} />
                  ))}
                </div>
                <span className="w-16 text-right text-xs text-white/55">{STRENGTH[strength].label}</span>
              </div>
            )}
          </div>

          <Button type="submit" variant="light" size="lg" className="mt-4 w-full" loading={submitting}>
            Create Account {!submitting && <ArrowRight className="size-4" />}
          </Button>
        </form>

        <GoogleSignInSection label="Sign up with Google" onSuccess={() => navigate('/dashboard', { replace: true })} />
      </AuthCard>
    </AuthLayout>
  );
}
