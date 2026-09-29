import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthCard, AuthLayout } from '@/components/auth/AuthLayout';
import { GoogleSignInSection } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? '/dashboard';

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!EMAIL_PATTERN.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (!form.password) nextErrors.password = 'Enter your password';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to continue to InterviewNest"
        footer={
          <>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-white hover:underline">
              Sign up
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field icon={Mail} label="Email address" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
          <Field icon={Lock} label="Password" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} error={errors.password} />

          <label className="flex w-fit cursor-pointer items-center gap-3 pt-2 text-sm text-white/75 select-none">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={form.remember}
              onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
            />
            <span
              className={cn(
                'grid size-5 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400',
                form.remember ? 'border-white bg-white text-ink-950' : 'border-white/25 bg-white/[0.04]'
              )}
            >
              {form.remember && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            Remember me
          </label>

          <Button type="submit" variant="light" size="lg" className="mt-4 w-full" loading={submitting}>
            Sign In {!submitting && <ArrowRight className="size-4" />}
          </Button>
        </form>

        <GoogleSignInSection label="Sign in with Google" onSuccess={() => navigate(redirectTo, { replace: true })} />
      </AuthCard>
    </AuthLayout>
  );
}
